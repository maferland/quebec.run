import { prisma } from '@/lib/prisma'
import {
  cachePublicData,
  invalidatePublicCache,
  PUBLIC_API_REVALIDATE_SECONDS,
  PUBLIC_CACHE_TAGS,
  PUBLIC_PAGE_REVALIDATE_SECONDS,
} from '@/lib/public-cache'
import type {
  EventsQuery,
  EventCreate,
  EventUpdate,
  EventId,
  EventByClubAndSlug,
  EventByClubAndSlugBare,
  PublicPayload,
  AuthPayload,
} from '@/lib/schemas'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'
import { geocodeAddress } from './geocoding'
import {
  getEventsInRange,
  createVirtualEvent,
  expandRRuleDates,
} from './recurring-events'
import { addDays } from 'date-fns'
import {
  EVENT_FACETS,
  createEmptyFacetCounts,
  type FacetKey,
} from '@/lib/facets'

import { compareWeekdays, type Weekday } from '@/lib/utils/weekday'

// ─── Explore data layer ───────────────────────────────────────────────────────

export type ExploreRun = {
  id: string
  title: string
  time: string
  status: 'SCHEDULED' | 'CANCELLED'
  lat: number | null
  lng: number | null
  distance: string | null
  isPast: boolean
  address: string | null
  neighborhood: string | null
  club: {
    id: string
    slug: string
    name: string
    type: string | null
    vibe: string | null
    beginnerFriendly: boolean
    paceMin: string | null
    paceMax: string | null
  }
}

// Returns {start, end} UTC boundaries for a Toronto calendar day offset from today.
const TORONTO_TIME_ZONE = 'America/Toronto'

function getTorontoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

function getTorontoOffset(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return (
    Date.UTC(
      value('year'),
      value('month') - 1,
      value('day'),
      value('hour'),
      value('minute'),
      value('second')
    ) - date.getTime()
  )
}

function torontoMidnight(year: number, month: number, day: number) {
  const utcGuess = Date.UTC(year, month - 1, day)
  const first = new Date(utcGuess - getTorontoOffset(new Date(utcGuess)))
  return new Date(utcGuess - getTorontoOffset(first))
}

export function getTorontoDayBounds(
  dayOffset: number,
  now = new Date()
): { start: Date; end: Date } {
  const today = getTorontoDateParts(now)
  const target = new Date(
    Date.UTC(today.year, today.month - 1, today.day + dayOffset)
  )
  const next = new Date(
    Date.UTC(today.year, today.month - 1, today.day + dayOffset + 1)
  )
  const start = torontoMidnight(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    target.getUTCDate()
  )
  const nextStart = torontoMidnight(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate()
  )
  const end = new Date(nextStart.getTime() - 1)
  return { start, end }
}

function toExploreRun(
  event: {
    id: string
    title: string
    time: string
    status: 'SCHEDULED' | 'CANCELLED'
    latitude: number | null
    longitude: number | null
    distance: string | null
    address: string | null
    neighborhood: string | null
    club: {
      id: string
      slug: string
      name: string
      type: string | null
      vibe: string | null
      beginnerFriendly: boolean
      paceMin: string | null
      paceMax: string | null
    } | null
  },
  now: Date
): ExploreRun | null {
  if (!event.club) return null
  const [h, m] = event.time.split(':').map(Number)
  const eventMinutes = (h ?? 0) * 60 + (m ?? 0)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return {
    id: event.id,
    title: event.title,
    time: event.time,
    status: event.status,
    lat: event.latitude,
    lng: event.longitude,
    distance: event.distance,
    isPast: eventMinutes < nowMinutes,
    address: event.address,
    neighborhood: event.neighborhood,
    club: event.club,
  }
}

const EXPLORE_CLUB_SELECT = {
  id: true,
  slug: true,
  name: true,
  type: true,
  vibe: true,
  beginnerFriendly: true,
  paceMin: true,
  paceMax: true,
} as const

async function getEventsForDayRaw(dayOffset: number): Promise<ExploreRun[]> {
  const { start, end } = getTorontoDayBounds(dayOffset)
  const now = new Date()
  const isToday = dayOffset === 0

  // Concrete events (including CANCELLED) — exclude those whose recurring parent is inactive
  const concreteEvents = await prisma.event.findMany({
    where: {
      date: { gte: start, lte: end },
      OR: [{ recurringEventId: null }, { recurringEvent: { isActive: true } }],
    },
    select: {
      id: true,
      title: true,
      time: true,
      status: true,
      latitude: true,
      longitude: true,
      distance: true,
      address: true,
      neighborhood: true,
      recurringEventId: true,
      club: { select: EXPLORE_CLUB_SELECT },
    },
    orderBy: { time: 'asc' },
  })

  // Keys of dates that have concrete events (to skip virtual expansion)
  const materializedKeys = new Set(
    concreteEvents.map((e) => `${e.recurringEventId}`)
  )

  // Expand active recurring events for this day, skipping materialized dates
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: { isActive: true },
    include: { club: true },
  })

  const virtualEvents = recurringEvents.flatMap((re) => {
    const occurrences = expandRRuleDates(re.schedulePattern, start, end)
    // Check if this pattern has a concrete event on this day
    const hasConcreteOnDay = concreteEvents.some(
      (e) => e.recurringEventId === re.id
    )
    if (hasConcreteOnDay) return []
    return occurrences.map((date) => {
      const virt = createVirtualEvent(re, date)
      return {
        id: virt.id,
        title: virt.title,
        time: virt.time,
        status: 'SCHEDULED' as const,
        latitude: virt.latitude,
        longitude: virt.longitude,
        distance: virt.distance,
        address: virt.address,
        neighborhood: re.neighborhood ?? null,
        recurringEventId: re.id,
        club: {
          id: re.club.id,
          slug: re.club.slug,
          name: re.club.name,
          type: re.club.type ?? null,
          vibe: re.club.vibe ?? null,
          beginnerFriendly: re.club.beginnerFriendly,
          paceMin: re.club.paceMin ?? null,
          paceMax: re.club.paceMax ?? null,
        },
      }
    })
  })

  void materializedKeys // used implicitly above

  const all = [...concreteEvents, ...virtualEvents].sort((a, b) =>
    a.time.localeCompare(b.time)
  )

  // isPast only applies to today's runs
  const effectiveNow = isToday ? now : new Date(0)
  return all
    .map((e) => toExploreRun(e, effectiveNow))
    .filter((e): e is ExploreRun => e !== null)
}

export const getEventsForDay = cachePublicData(
  getEventsForDayRaw,
  ['events-for-day'],
  {
    revalidate: PUBLIC_API_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.runs],
  }
)

async function getWeekEventCountsRaw(): Promise<
  { day: number; count: number }[]
> {
  const days = Array.from({ length: 7 }, (_, day) => ({
    day,
    ...getTorontoDayBounds(day),
  }))
  const weekStart = days[0].start
  const weekEnd = days[days.length - 1].end

  const [concreteEvents, recurringEvents] = await Promise.all([
    prisma.event.findMany({
      where: {
        date: { gte: weekStart, lte: weekEnd },
        OR: [
          { recurringEventId: null },
          { recurringEvent: { isActive: true } },
        ],
      },
      select: { date: true, status: true, recurringEventId: true },
    }),
    prisma.recurringEvent.findMany({
      where: { isActive: true },
      select: { id: true, schedulePattern: true },
    }),
  ])

  return days.map(({ day, start, end }) => {
    const eventsForDay = concreteEvents.filter(
      (event) => event.date >= start && event.date <= end
    )
    const materializedRecurringIds = new Set(
      eventsForDay.flatMap((event) =>
        event.recurringEventId ? [event.recurringEventId] : []
      )
    )
    const concreteCount = eventsForDay.filter(
      (event) => event.status === 'SCHEDULED'
    ).length
    const virtualCount = recurringEvents.reduce((count, recurringEvent) => {
      if (materializedRecurringIds.has(recurringEvent.id)) return count
      return (
        count +
        expandRRuleDates(recurringEvent.schedulePattern, start, end).length
      )
    }, 0)

    return { day, count: concreteCount + virtualCount }
  })
}

export const getWeekEventCounts = cachePublicData(
  getWeekEventCountsRaw,
  ['week-event-counts'],
  {
    revalidate: PUBLIC_API_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.runs],
  }
)

// Pure business logic functions - let TypeScript infer return types

const DEFAULT_LOOKAHEAD_DAYS = 60

/**
 * Resolves clubSlug → clubId. Returns { ok, clubId } so callers can early-out
 * with their preferred empty shape when the slug doesn't match a known club.
 */
async function resolveClubIdFromSlug(
  clubId: string | undefined,
  clubSlug: string | undefined
): Promise<{ ok: true; clubId: string | undefined } | { ok: false }> {
  if (clubId || !clubSlug) return { ok: true, clubId }
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true },
  })
  return club ? { ok: true, clubId: club.id } : { ok: false }
}

export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const { limit = 50, offset = 0, clubId, clubSlug, search, pacePolicy } = data

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, DEFAULT_LOOKAHEAD_DAYS)

  const resolution = await resolveClubIdFromSlug(clubId, clubSlug)
  if (!resolution.ok) return []
  const resolvedClubId = resolution.clubId

  let events = await getEventsInRange(startDate, endDate, resolvedClubId)

  if (search) {
    const q = search.toLowerCase()
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.address?.toLowerCase().includes(q) ?? false)
    )
  }

  if (pacePolicy) {
    events = events.filter((e) => e.pacePolicy === pacePolicy)
  }

  if (data.timeOfDay) {
    events = events.filter((e) => {
      const hour = Number(e.time.split(':')[0])
      if (Number.isNaN(hour)) return false
      return data.timeOfDay === 'morning' ? hour < 12 : hour >= 17
    })
  }

  if (data.weekend) {
    events = events.filter((e) => {
      const day = e.date.getDay()
      return day === 0 || day === 6
    })
  }

  if (data.clubVibe) {
    events = events.filter((e) => e.club?.vibe === data.clubVibe)
  }

  if (data.beginner === '1') {
    events = events.filter((e) => e.club?.beginnerFriendly === true)
  }

  // Default: hide past events. Opt-in via showPast=1.
  if (data.showPast !== '1') {
    const nowDate = new Date()
    events = events.filter((e) => {
      const [h, m] = e.time.split(':').map(Number)
      const start = new Date(e.date)
      start.setHours(h || 0, m || 0, 0, 0)
      return start >= nowDate
    })
  }

  return events.slice(offset, offset + limit)
}

export type GetAllEventsReturn = Awaited<ReturnType<typeof getAllEvents>>[0]

function matchesFilters(event: GetAllEventsReturn, data: EventsQuery): boolean {
  if (data.search) {
    const q = data.search.toLowerCase()
    const titleHit = event.title.toLowerCase().includes(q)
    const addrHit = event.address?.toLowerCase().includes(q) ?? false
    if (!titleHit && !addrHit) return false
  }
  if (data.pacePolicy && event.pacePolicy !== data.pacePolicy) return false
  if (data.timeOfDay) {
    const hour = Number(event.time.split(':')[0])
    if (Number.isNaN(hour)) return false
    if (data.timeOfDay === 'morning' && hour >= 12) return false
    if (data.timeOfDay === 'evening' && hour < 17) return false
  }
  if (data.weekend) {
    const day = event.date.getDay()
    if (day !== 0 && day !== 6) return false
  }
  if (data.clubVibe && event.club?.vibe !== data.clubVibe) return false
  if (data.beginner === '1' && !event.club?.beginnerFriendly) return false
  // Hide past events by default; opt-in to keep them via showPast=1.
  if (data.showPast !== '1') {
    const [h, m] = event.time.split(':').map(Number)
    const start = new Date(event.date)
    start.setHours(h || 0, m || 0, 0, 0)
    if (start < new Date()) return false
  }
  return true
}

export type EventLocation = {
  key: string
  club: NonNullable<GetAllEventsReturn['club']>
  title: string
  address: string | null
  latitude: number | null
  longitude: number | null
  weekdays: number[]
  occurrenceCount: number
  isRecurring: boolean
  next: GetAllEventsReturn
}

export type FacetCounts = {
  openPace: number
  morning: number
  evening: number
  weekend: number
  social: number
  training: number
  beginner: number
  showPast: number
}

const EMPTY_FACET_COUNTS: FacetCounts = createEmptyFacetCounts(EVENT_FACETS)

export type EventListing = {
  buckets: EventLocation[]
  overrides: GetAllEventsReturn[]
  facetCounts: FacetCounts
}

// Bucket by recurring pattern id when available so same-club same-location
// patterns with distinct schedules stay distinct. One-off concrete events
// (no recurring parent) get their own bucket keyed by event id.
const bucketKeyFor = (event: GetAllEventsReturn): string =>
  event.recurringEventId
    ? `pattern:${event.recurringEventId}`
    : `oneoff:${event.id}`

// Virtual events synthesized from recurring patterns use a slug-based id
// format containing `--YYYY-MM-DD`; that's how we identify the pattern's
// canonical title within a bucket.
const isVirtualEvent = (event: GetAllEventsReturn): boolean =>
  event.id.includes('--')

function buildListing(
  events: GetAllEventsReturn[],
  data: EventsQuery
): { buckets: EventLocation[]; overrides: GetAllEventsReturn[] } {
  const bucketEvents = new Map<string, GetAllEventsReturn[]>()
  const bucketMap = new Map<string, EventLocation>()

  for (const event of events) {
    if (!event.club) continue
    if (!matchesFilters(event, data)) continue
    const key = bucketKeyFor(event)
    const day = event.date.getDay()

    let list = bucketEvents.get(key)
    if (!list) {
      list = []
      bucketEvents.set(key, list)
    }
    list.push(event)

    const existing = bucketMap.get(key)
    if (!existing) {
      bucketMap.set(key, {
        key,
        club: event.club,
        title: event.title,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
        weekdays: [day],
        occurrenceCount: 1,
        isRecurring: Boolean(event.recurringEventId),
        next: event,
      })
    } else {
      if (!existing.weekdays.includes(day)) existing.weekdays.push(day)
      existing.occurrenceCount += 1
      existing.isRecurring =
        existing.isRecurring || Boolean(event.recurringEventId)
      if (event.date < existing.next.date) existing.next = event
    }
  }

  const overrides: GetAllEventsReturn[] = []

  for (const bucket of bucketMap.values()) {
    bucket.weekdays.sort((a, b) => compareWeekdays(a as Weekday, b as Weekday))

    const all = bucketEvents.get(bucket.key) ?? []
    const canonicalSample = all.find(isVirtualEvent) ?? all[0]
    if (!canonicalSample) continue
    const canonicalTitle = canonicalSample.title
    bucket.title = canonicalTitle

    for (const event of all) {
      if (event.title !== canonicalTitle) {
        overrides.push(event)
        bucket.occurrenceCount -= 1
        if (bucket.next.id === event.id) {
          const remaining = all
            .filter(
              (candidate) =>
                candidate.id !== event.id && candidate.title === canonicalTitle
            )
            .sort((a, b) => a.date.getTime() - b.date.getTime())
          if (remaining[0]) bucket.next = remaining[0]
        }
      }
    }
  }

  const buckets = Array.from(bucketMap.values())
    .filter((bucket) => bucket.occurrenceCount > 0)
    .sort((a, b) => a.next.date.getTime() - b.next.date.getTime())

  overrides.sort((a, b) => a.date.getTime() - b.date.getTime())

  return { buckets, overrides }
}

// Compute all four facet counts in a single walk over the event stream.
// For each event we check membership against the four "what if this facet were
// added" filters; surviving events contribute to either the bucket set (canonical
// title) or the override count for the matching facet.
function computeFacetCounts(
  events: GetAllEventsReturn[],
  data: EventsQuery,
  canonicalTitles: Map<string, string>
): FacetCounts {
  const bucketKeys: Record<FacetKey, Set<string>> = {
    openPace: new Set(),
    morning: new Set(),
    evening: new Set(),
    weekend: new Set(),
    social: new Set(),
    training: new Set(),
    beginner: new Set(),
    showPast: new Set(),
  }
  const overrideCounts: Record<FacetKey, number> = {
    openPace: 0,
    morning: 0,
    evening: 0,
    weekend: 0,
    social: 0,
    training: 0,
    beginner: 0,
    showPast: 0,
  }

  for (const event of events) {
    if (!event.club) continue
    const key = bucketKeyFor(event)
    const canonical = canonicalTitles.get(key) ?? event.title
    const isOverride = event.title !== canonical
    for (const facet of EVENT_FACETS) {
      if (matchesFilters(event, { ...data, [facet.param]: facet.value })) {
        if (isOverride) overrideCounts[facet.key] += 1
        else bucketKeys[facet.key].add(key)
      }
    }
  }

  return {
    openPace: bucketKeys.openPace.size + overrideCounts.openPace,
    morning: bucketKeys.morning.size + overrideCounts.morning,
    evening: bucketKeys.evening.size + overrideCounts.evening,
    weekend: bucketKeys.weekend.size + overrideCounts.weekend,
    social: bucketKeys.social.size + overrideCounts.social,
    training: bucketKeys.training.size + overrideCounts.training,
    beginner: bucketKeys.beginner.size + overrideCounts.beginner,
    showPast: bucketKeys.showPast.size + overrideCounts.showPast,
  }
}

function canonicalTitlesByBucket(
  events: GetAllEventsReturn[]
): Map<string, string> {
  // Pattern title comes from the recurring source; virtual events synthesized
  // from the pattern hold it. For one-off buckets, the event's own title is
  // canonical.
  const titles = new Map<string, string>()
  for (const event of events) {
    if (!event.club) continue
    const key = bucketKeyFor(event)
    if (isVirtualEvent(event) || !titles.has(key)) titles.set(key, event.title)
  }
  return titles
}

export async function getEventLocations({
  data,
}: PublicPayload<EventsQuery>): Promise<EventListing> {
  const { clubId, clubSlug } = data

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, DEFAULT_LOOKAHEAD_DAYS)

  const resolution = await resolveClubIdFromSlug(clubId, clubSlug)
  if (!resolution.ok) {
    return { buckets: [], overrides: [], facetCounts: EMPTY_FACET_COUNTS }
  }

  const events = await getEventsInRange(startDate, endDate, resolution.clubId)

  const { buckets, overrides } = buildListing(events, data)

  // Counts simulate "if I add this facet on top of current other filters,
  // how many results would I see?" Single-pass over the event stream; the
  // canonical titles per bucket are computed once and reused.
  const canonicalTitles = canonicalTitlesByBucket(events)
  const facetCounts = computeFacetCounts(events, data, canonicalTitles)

  return { buckets, overrides, facetCounts }
}

export type CalendarListing = {
  events: GetAllEventsReturn[]
  facetCounts: FacetCounts
}

// Calendar surface: events kept as a flat list (no bucketing) grouped client-side
// by date. Filters honor the same EVENT_FACETS as /events; counts simulate
// "add this facet on top of current filters".
export async function getCalendarListing({
  data,
}: PublicPayload<EventsQuery>): Promise<CalendarListing> {
  const { limit = 200, offset = 0, clubId, clubSlug } = data

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, DEFAULT_LOOKAHEAD_DAYS)

  const resolution = await resolveClubIdFromSlug(clubId, clubSlug)
  if (!resolution.ok) {
    return { events: [], facetCounts: EMPTY_FACET_COUNTS }
  }

  const all = await getEventsInRange(startDate, endDate, resolution.clubId)
  const filtered = all.filter((event) => matchesFilters(event, data))
  const facetCounts = countEventFacets(all, data)

  return {
    events: filtered.slice(offset, offset + limit),
    facetCounts,
  }
}

// Shared "if I added this facet on top of current filters" counter for surfaces
// that don't need the bucket/override split (calendar list, future flat lists).
function countEventFacets(
  events: GetAllEventsReturn[],
  data: EventsQuery
): FacetCounts {
  const counts: FacetCounts = { ...EMPTY_FACET_COUNTS }
  for (const event of events) {
    if (!event.club) continue
    for (const facet of EVENT_FACETS) {
      if (matchesFilters(event, { ...data, [facet.param]: facet.value })) {
        counts[facet.key] += 1
      }
    }
  }
  return counts
}

async function getEventByIdRaw(id: string) {
  // Virtual event ID formats:
  // New: slug--YYYY-MM-DD (e.g., 6am-club-beauport--2026-03-18)
  // Legacy: cuid:YYYY-MM-DD (e.g., cmj8zbj20000cpt9z:2026-03-18)
  const slugMatch = id.match(/^(.+)--(\d{4}-\d{2}-\d{2})$/)
  const legacyMatch = !slugMatch && id.match(/^(.+):(\d{4}-\d{2}-\d{2})$/)
  const virtualMatch = slugMatch || legacyMatch

  if (virtualMatch) {
    const [, identifier, dateKey] = virtualMatch

    let recurringEvent = null
    if (slugMatch) {
      // New virtual IDs are `${club.slug}-${event.slug}--date`.
      // Try all possible club/event slug splits since both contain hyphens.
      const parts = identifier.split('-')
      const splitCandidates = parts.slice(0, -1).map((_, i) => ({
        clubSlug: parts.slice(0, i + 1).join('-'),
        eventSlug: parts.slice(i + 1).join('-'),
      }))
      recurringEvent = await prisma.recurringEvent.findFirst({
        where: {
          OR: [
            { slug: identifier },
            ...splitCandidates.map((c) => ({
              AND: [{ slug: c.eventSlug }, { club: { slug: c.clubSlug } }],
            })),
          ],
        },
        include: { club: true },
      })
    } else {
      recurringEvent = await prisma.recurringEvent.findUnique({
        where: { id: identifier },
        include: { club: true },
      })
    }

    if (!recurringEvent) {
      return null
    }

    const date = new Date(`${dateKey}T12:00:00`)
    const event = createVirtualEvent(recurringEvent, date)
    const description = recurringEvent.club.description
      ?.replace(/\s+/g, ' ')
      .trim()
    return {
      ...event,
      club: {
        ...event.club,
        description: description || null,
      },
    }
  }

  return await prisma.event.findUnique({
    where: { id },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          vibe: true,
          beginnerFriendly: true,
          paceMin: true,
          paceMax: true,
          description: true,
        },
      },
    },
  })
}

const getCachedEventById = cachePublicData(
  getEventByIdRaw,
  ['event-by-id-v3'],
  {
    revalidate: PUBLIC_API_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.runs],
  }
)

export const getEventById = async ({ data }: PublicPayload<EventId>) => {
  return getCachedEventById(data.id)
}

async function getEventByClubAndSlugRaw(
  clubSlug: string,
  eventSlug: string,
  date: string
) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true },
  })
  if (!club) return null

  const recurringEvent = await prisma.recurringEvent.findUnique({
    where: { clubId_slug: { clubId: club.id, slug: eventSlug } },
    include: { club: true },
  })
  if (!recurringEvent) return null

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)

  const concrete = await prisma.event.findFirst({
    where: {
      recurringEventId: recurringEvent.id,
      date: { gte: dayStart, lte: dayEnd },
    },
    include: {
      club: { select: { id: true, name: true, slug: true } },
    },
  })
  if (concrete) return concrete

  const occurrences = expandRRuleDates(
    recurringEvent.schedulePattern,
    dayStart,
    dayEnd
  )
  if (occurrences.length === 0) return null

  return createVirtualEvent(recurringEvent, new Date(`${date}T12:00:00`))
}

const getCachedEventByClubAndSlug = cachePublicData(
  getEventByClubAndSlugRaw,
  ['event-by-club-and-slug'],
  {
    revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.runs],
  }
)

export const getEventByClubAndSlug = async ({
  data,
}: PublicPayload<EventByClubAndSlug>) => {
  const { clubSlug, eventSlug, date } = data
  return getCachedEventByClubAndSlug(clubSlug, eventSlug, date)
}

async function getNextOccurrenceDateRaw(clubSlug: string, eventSlug: string) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true },
  })
  if (!club) return null

  const recurringEvent = await prisma.recurringEvent.findUnique({
    where: { clubId_slug: { clubId: club.id, slug: eventSlug } },
    select: { schedulePattern: true },
  })
  if (!recurringEvent) return null

  const now = new Date()
  const upper = addDays(now, 365)
  const [next] = expandRRuleDates(recurringEvent.schedulePattern, now, upper)
  return next ?? null
}

const getCachedNextOccurrenceDate = cachePublicData(
  getNextOccurrenceDateRaw,
  ['next-occurrence-date'],
  {
    revalidate: PUBLIC_API_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.runs],
  }
)

export const getNextOccurrenceDate = async ({
  data,
}: PublicPayload<EventByClubAndSlugBare>) => {
  return getCachedNextOccurrenceDate(data.clubSlug, data.eventSlug)
}

export const createEvent = async ({ data }: AuthPayload<EventCreate>) => {
  // Geocode address if provided
  let latitude: number | null = null
  let longitude: number | null = null
  let geocodedAt: Date | null = null

  if (data.address) {
    const coords = await geocodeAddress(data.address)
    if (coords) {
      latitude = coords.lat
      longitude = coords.lng
      geocodedAt = new Date()
    }
  }

  const event = await prisma.event.create({
    data: {
      ...data,
      date: new Date(data.date),
      latitude,
      longitude,
      geocodedAt,
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs)

  return event
}

export const updateEvent = async ({ user, data }: AuthPayload<EventUpdate>) => {
  const { id, ...updateData } = data

  // Check permissions: must be admin OR own the event's club/org
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      address: true,
      club: {
        select: { ownerId: true },
      },
      organization: {
        select: { ownerId: true },
      },
    },
  })

  if (!event) {
    throw new NotFoundError('Event not found')
  }

  const ownerId = event.club?.ownerId ?? event.organization?.ownerId
  if (!user.isStaff && ownerId !== user.id) {
    throw new UnauthorizedError('Unauthorized')
  }

  // Re-geocode if address changed
  let geocodeUpdate: {
    latitude?: number | null
    longitude?: number | null
    geocodedAt?: Date | null
  } = {}

  if (updateData.address && updateData.address !== event.address) {
    const coords = await geocodeAddress(updateData.address)
    if (coords) {
      geocodeUpdate = {
        latitude: coords.lat,
        longitude: coords.lng,
        geocodedAt: new Date(),
      }
    } else {
      geocodeUpdate = {
        latitude: null,
        longitude: null,
        geocodedAt: null,
      }
    }
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      ...updateData,
      ...geocodeUpdate,
      date: updateData.date ? new Date(updateData.date) : undefined,
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs)
  return updatedEvent
}

export const deleteEvent = async ({ user, data }: AuthPayload<EventId>) => {
  const { id } = data

  // Check permissions: must be admin OR own the event's club/org
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      club: {
        select: { ownerId: true },
      },
      organization: {
        select: { ownerId: true },
      },
    },
  })

  if (!event) {
    throw new NotFoundError('Event not found')
  }

  const ownerId = event.club?.ownerId ?? event.organization?.ownerId
  if (!user.isStaff && ownerId !== user.id) {
    throw new UnauthorizedError('Unauthorized')
  }

  const deletedEvent = await prisma.event.delete({
    where: { id },
  })

  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs)
  return deletedEvent
}
