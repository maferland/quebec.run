import { prisma } from '@/lib/prisma'
import { RRule } from 'rrule'
import { addDays, min, format } from 'date-fns'
import type { RecurringEvent, Club, Prisma } from '@client'
import { createSlug } from '@/lib/utils/slug'
import { invalidatePublicCache, PUBLIC_CACHE_TAGS } from '@/lib/public-cache'

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
