import { prisma } from '@/lib/prisma'
import { RRule } from 'rrule'
import { addDays, min, format } from 'date-fns'
import type { RecurringEvent, Club, Prisma } from '@client'
import { createSlug } from '@/lib/utils/slug'
import {
  cachePublicData,
  invalidatePublicCache,
  PUBLIC_CACHE_TAGS,
  PUBLIC_PAGE_REVALIDATE_SECONDS,
} from '@/lib/public-cache'
import { weekdaySlugOrder } from '@/lib/utils/weekday-slug'
import { parseRRuleToForm } from '@/lib/utils/rrule-builder'

/**
 * Generate Event records from RecurringEvent pattern
 * @param recurringEvent - RecurringEvent record from DB
 * @param daysAhead - How many days ahead to generate (default: 7)
 * @returns Number of events created
 */
export async function generateEventsFromRecurring(
  recurringEvent: RecurringEvent,
  daysAhead: number = 7
): Promise<number> {
  // 1. Parse RRule
  const pattern = recurringEvent.schedulePattern.toUpperCase()
  const hasByhour = pattern.includes('BYHOUR')
  const rule = RRule.fromString(recurringEvent.schedulePattern)
  const opts = rule.options

  // Extract time from RRule options (only if explicitly set)
  const hour = String(hasByhour ? (opts.byhour?.[0] ?? 0) : 0).padStart(2, '0')
  const minute = String(hasByhour ? (opts.byminute?.[0] ?? 0) : 0).padStart(
    2,
    '0'
  )
  const eventTime = `${hour}:${minute}`

  // 2. Calculate date range
  const now = new Date()
  const horizon = addDays(now, daysAhead)
  const until = recurringEvent.generateUntil
    ? min([horizon, recurringEvent.generateUntil])
    : horizon

  // 3. Generate dates within range and normalize to clean timestamps
  const dates = rule.between(now, until, true).map((d) => {
    d.setSeconds(0, 0)
    return d
  })

  if (dates.length === 0) {
    return 0
  }

  // 4. Check existing events by date string (idempotency)
  const existing = await prisma.event.findMany({
    where: {
      recurringEventId: recurringEvent.id,
      date: {
        gte: dates[0],
        lte: addDays(dates[dates.length - 1], 1),
      },
    },
    select: { date: true },
  })

  const existingKeys = new Set(
    existing.map((e) => format(e.date, 'yyyy-MM-dd'))
  )

  // 5. Filter to only new dates
  const newDates = dates.filter(
    (d) => !existingKeys.has(format(d, 'yyyy-MM-dd'))
  )

  if (newDates.length === 0) {
    return 0
  }

  // 6. Create Event records
  const events = newDates.map((date) => ({
    title: recurringEvent.title,
    description: recurringEvent.description,
    date,
    time: eventTime,
    address: recurringEvent.address,
    placeName: recurringEvent.placeName,
    latitude: recurringEvent.latitude,
    longitude: recurringEvent.longitude,
    distance: recurringEvent.distance,
    pace: recurringEvent.pace,
    pacePolicy: recurringEvent.pacePolicy,
    clubId: recurringEvent.clubId,
    recurringEventId: recurringEvent.id,
  }))

  await prisma.event.createMany({ data: events })
  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs)

  return events.length
}

/**
 * Generate events for all active recurring events
 * Called by cron job
 * @param daysAhead - How many days ahead to generate (default: 7)
 * @returns Summary with processed count, created count, and errors
 */
export async function generateAllRecurringEvents(
  daysAhead: number = 7
): Promise<{ processed: number; created: number; errors: string[] }> {
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: { isActive: true },
  })

  let totalCreated = 0
  const errors: string[] = []

  for (const re of recurringEvents) {
    try {
      const created = await generateEventsFromRecurring(re, daysAhead)
      totalCreated += created
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Failed for ${re.id}: ${message}`)
      console.error(`Generation failed for ${re.id}:`, error)
    }
  }

  return {
    processed: recurringEvents.length,
    created: totalCreated,
    errors,
  }
}

/**
 * Expand RRule pattern to concrete dates within range
 * @param pattern - RRule string
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Array of dates
 */
export function expandRRuleDates(
  pattern: string,
  startDate: Date,
  endDate: Date
): Date[] {
  // If pattern has no DTSTART, anchor it to the query start so
  // rrule generates occurrences within the requested range
  const hasStart = pattern.toUpperCase().includes('DTSTART')
  const fullPattern = hasStart
    ? pattern
    : `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n${pattern}`
  const rule = RRule.fromString(fullPattern)
  return rule.between(startDate, endDate, true)
}

/**
 * Create virtual event object from RecurringEvent + date
 * @param recurringEvent - RecurringEvent with club relation
 * @param date - Specific occurrence date
 * @returns Virtual event object
 */
export function createVirtualEvent(
  recurringEvent: RecurringEvent & { club: Club },
  date: Date
) {
  const pattern = recurringEvent.schedulePattern.toUpperCase()
  const hasByhour = pattern.includes('BYHOUR')

  const rule = RRule.fromString(recurringEvent.schedulePattern)
  const opts = rule.options

  const hour = String(hasByhour ? (opts.byhour?.[0] ?? 0) : 0).padStart(2, '0')
  const minute = String(hasByhour ? (opts.byminute?.[0] ?? 0) : 0).padStart(
    2,
    '0'
  )
  const eventTime = `${hour}:${minute}`

  const dateKey = format(date, 'yyyy-MM-dd')

  return {
    // Club slug prefix keeps the id globally unique now that event slugs
    // are only unique within a club (e.g. multiple clubs have `mardi`).
    id: `${recurringEvent.club.slug}-${recurringEvent.slug}--${dateKey}`,
    recurringSlug: recurringEvent.slug,
    title: recurringEvent.title,
    description: recurringEvent.description,
    date,
    time: eventTime,
    address: recurringEvent.address,
    placeName: recurringEvent.placeName,
    latitude: recurringEvent.latitude,
    longitude: recurringEvent.longitude,
    distance: recurringEvent.distance,
    pace: recurringEvent.pace,
    pacePolicy: recurringEvent.pacePolicy,
    status: 'SCHEDULED' as const,
    clubId: recurringEvent.clubId,
    organizationId: null,
    recurringEventId: recurringEvent.id,
    createdAt: recurringEvent.createdAt,
    updatedAt: recurringEvent.updatedAt,
    geocodedAt: null,
    club: {
      id: recurringEvent.club.id,
      name: recurringEvent.club.name,
      slug: recurringEvent.club.slug,
      type: recurringEvent.club.type,
      vibe: recurringEvent.club.vibe,
      beginnerFriendly: recurringEvent.club.beginnerFriendly,
      paceMin: recurringEvent.club.paceMin,
      paceMax: recurringEvent.club.paceMax,
    },
  }
}

/**
 * Get events in date range using hybrid approach
 * @param startDate - Start of range
 * @param endDate - End of range
 * @param clubId - Optional club filter
 * @returns Array of concrete + virtual events, sorted by date
 */
export async function getEventsInRange(
  startDate: Date,
  endDate: Date,
  clubId?: string
) {
  // 1. Fetch concrete Events in range (exclude cancelled). Skip concretes whose
  //    parent recurring pattern is paused so the listing matches what virtual
  //    expansion produces.
  const concreteEvents = await prisma.event.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'SCHEDULED',
      ...(clubId && { clubId }),
      OR: [{ recurringEventId: null }, { recurringEvent: { isActive: true } }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      date: true,
      time: true,
      distance: true,
      pace: true,
      pacePolicy: true,
      address: true,
      latitude: true,
      longitude: true,
      clubId: true,
      recurringEventId: true,
      status: true,
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
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  // 2. Fetch active RecurringEvents with club relation
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: {
      isActive: true,
      ...(clubId && { clubId }),
    },
    include: {
      club: true,
    },
  })

  // 3. Expand patterns, excluding materialized dates
  const expandedEvents = recurringEvents.flatMap((re) => {
    const occurrences = expandRRuleDates(re.schedulePattern, startDate, endDate)

    // Get materialized dates for this pattern
    const materializedDates = concreteEvents
      .filter((e) => e.recurringEventId === re.id)
      .map((e) => format(e.date, 'yyyy-MM-dd'))

    // Only expand dates that aren't materialized
    return occurrences
      .filter((date) => !materializedDates.includes(format(date, 'yyyy-MM-dd')))
      .map((date) => createVirtualEvent(re, date))
  })

  // 4. Merge and sort
  return [...concreteEvents, ...expandedEvents].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
}

/**
 * Create recurring event
 */
export async function createRecurringEvent(
  data: Omit<Prisma.RecurringEventUncheckedCreateInput, 'slug'> & {
    slug?: string
  }
) {
  const recurringEvent = await prisma.recurringEvent.create({
    data: {
      ...data,
      slug: data.slug || createSlug(data.title),
      timezone: data.timezone || 'America/Toronto',
      isActive: data.isActive ?? true,
    },
  })

  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs, PUBLIC_CACHE_TAGS.clubs)
  return recurringEvent
}

/**
 * Update recurring event
 */
export async function updateRecurringEvent(
  id: string,
  data: Partial<Prisma.RecurringEventUncheckedUpdateInput>
) {
  const updateData = { ...data }
  if (typeof data.title === 'string') {
    updateData.slug = createSlug(data.title)
  }
  const recurringEvent = await prisma.recurringEvent.update({
    where: { id },
    data: updateData,
  })

  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs, PUBLIC_CACHE_TAGS.clubs)
  return recurringEvent
}

/**
 * Soft delete recurring event (set isActive = false)
 */
export async function deleteRecurringEvent(id: string) {
  const recurringEvent = await prisma.recurringEvent.update({
    where: { id },
    data: { isActive: false },
  })

  invalidatePublicCache(PUBLIC_CACHE_TAGS.runs, PUBLIC_CACHE_TAGS.clubs)
  return recurringEvent
}

/**
 * Get recurring event by ID with club relation
 */
export async function getRecurringEventById(id: string) {
  return await prisma.recurringEvent.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      distance: true,
      pace: true,
      schedulePattern: true,
      timezone: true,
      generateUntil: true,
      isActive: true,
      clubId: true,
      createdAt: true,
      updatedAt: true,
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

/**
 * Get recurring events by club ID
 */
export async function getRecurringEventsByClub(clubId: string) {
  return await prisma.recurringEvent.findMany({
    where: { clubId },
    select: {
      id: true,
      title: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      distance: true,
      pace: true,
      schedulePattern: true,
      timezone: true,
      generateUntil: true,
      isActive: true,
      clubId: true,
      createdAt: true,
      updatedAt: true,
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Place pages ──────────────────────────────────────────────────────────────

const PLACE_PATTERN_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  address: true,
  neighborhood: true,
  latitude: true,
  longitude: true,
  distance: true,
  pace: true,
  pacePolicy: true,
  schedulePattern: true,
} as const

const PLACE_OCCURRENCE_DAYS = 28

type PlacePattern = Prisma.RecurringEventGetPayload<{
  select: typeof PLACE_PATTERN_SELECT
}>

// Patterns at the same street address are one place; a pattern with no address
// (a club whose meeting spot rotates) is a place of its own.
function placeKey(pattern: { slug: string; address: string | null }): string {
  return pattern.address ?? `slug:${pattern.slug}`
}

const BYDAY_ORDER = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

function weekOrder(schedulePattern: string): string {
  const form = parseRRuleToForm(schedulePattern)
  const day = Math.min(
    ...form.byweekday
      .map((code) => BYDAY_ORDER.indexOf(code))
      .filter((i) => i >= 0)
  )
  return `${Number.isFinite(day) ? day : 9}-${form.time}`
}

// The place answers to every slug in its group, but only one is canonical.
// Slugs naming a location beat slugs naming a weekday; between two weekdays the
// earlier one in the week wins.
export function pickPrimarySlug(slugs: string[]): string {
  return [...slugs].sort((a, b) => {
    const orderA = weekdaySlugOrder(a)
    const orderB = weekdaySlugOrder(b)
    if (orderA === null && orderB !== null) return -1
    if (orderA !== null && orderB === null) return 1
    if (orderA !== null && orderB !== null && orderA !== orderB) {
      return orderA - orderB
    }
    return a.localeCompare(b)
  })[0]
}

async function getPlacePageRaw(clubSlug: string, placeSlug: string) {
  const club = await prisma.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true, name: true, slug: true, description: true },
  })
  if (!club) return null

  const patterns = await prisma.recurringEvent.findMany({
    where: { clubId: club.id, isActive: true },
    select: PLACE_PATTERN_SELECT,
  })

  const requested = patterns.find((pattern) => pattern.slug === placeSlug)
  if (!requested) return null

  const key = placeKey(requested)
  const group = patterns.filter((pattern) => placeKey(pattern) === key)
  const primarySlug = pickPrimarySlug(group.map((pattern) => pattern.slug))

  const now = new Date()
  const upper = addDays(now, PLACE_OCCURRENCE_DAYS)
  // Week order, not next-occurrence order: a place's slots read as a schedule,
  // and it should say the same thing whichever day someone lands on it.
  const slots = group
    .map((pattern) => ({
      ...pattern,
      occurrences: expandRRuleDates(pattern.schedulePattern, now, upper),
    }))
    .sort((first, second) =>
      weekOrder(first.schedulePattern).localeCompare(
        weekOrder(second.schedulePattern)
      )
    )

  // Other places this club meets at, for a short name-only link list. Full
  // addresses stay on the club page: repeating every location on every place
  // page is what made all 16 pages compete for the same neighbourhood queries.
  const others = new Map<string, PlacePattern>()
  for (const pattern of patterns) {
    const otherKey = placeKey(pattern)
    if (otherKey === key) continue
    const seen = others.get(otherKey)
    if (!seen || pickPrimarySlug([seen.slug, pattern.slug]) === pattern.slug) {
      others.set(otherKey, pattern)
    }
  }

  return {
    club,
    primarySlug,
    place: {
      address: requested.address,
      neighborhood: requested.neighborhood,
      latitude: requested.latitude,
      longitude: requested.longitude,
    },
    slots,
    otherPlaces: [...others.values()].map((pattern) => ({
      slug: pattern.slug,
      title: pattern.title,
      neighborhood: pattern.neighborhood,
    })),
  }
}

const getCachedPlacePage = cachePublicData(getPlacePageRaw, ['place-page'], {
  revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
  tags: [PUBLIC_CACHE_TAGS.runs],
})

export async function getPlacePage({
  clubSlug,
  placeSlug,
}: {
  clubSlug: string
  placeSlug: string
}) {
  const place = await getCachedPlacePage(clubSlug, placeSlug)
  if (!place) return null
  // A cache hit hands back JSON, so the occurrence dates arrive as strings even
  // though the type says Date.
  return {
    ...place,
    slots: place.slots.map((slot) => ({
      ...slot,
      occurrences: slot.occurrences.map((date) => new Date(date)),
    })),
  }
}

export type PlacePage = NonNullable<Awaited<ReturnType<typeof getPlacePage>>>

/** Every (club, place) pair, for the sitemap. */
export async function getAllPlaces() {
  const patterns = await prisma.recurringEvent.findMany({
    where: { isActive: true, club: { isActive: true } },
    select: {
      slug: true,
      address: true,
      updatedAt: true,
      club: { select: { slug: true } },
    },
  })

  const places = new Map<
    string,
    { clubSlug: string; slugs: string[]; updatedAt: Date }
  >()
  for (const pattern of patterns) {
    const key = `${pattern.club.slug}/${placeKey(pattern)}`
    const seen = places.get(key)
    if (seen) {
      seen.slugs.push(pattern.slug)
      if (pattern.updatedAt > seen.updatedAt) seen.updatedAt = pattern.updatedAt
    } else {
      places.set(key, {
        clubSlug: pattern.club.slug,
        slugs: [pattern.slug],
        updatedAt: pattern.updatedAt,
      })
    }
  }

  return [...places.values()].map((place) => ({
    clubSlug: place.clubSlug,
    placeSlug: pickPrimarySlug(place.slugs),
    updatedAt: place.updatedAt,
  }))
}
