import { prisma } from '@/lib/prisma'
import { RRule } from 'rrule'
import { addDays, min, format } from 'date-fns'
import type { RecurringEvent, Club } from '@prisma/client'

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
  const rule = RRule.fromString(recurringEvent.schedulePattern)
  const opts = rule.options

  // Extract time from RRule options
  const hour = String(opts.byhour?.[0] ?? 0).padStart(2, '0')
  const minute = String(opts.byminute?.[0] ?? 0).padStart(2, '0')
  const eventTime = `${hour}:${minute}`

  // 2. Calculate date range
  const now = new Date()
  const horizon = addDays(now, daysAhead)
  const until = recurringEvent.generateUntil
    ? min([horizon, recurringEvent.generateUntil])
    : horizon

  // 3. Generate dates within range
  const dates = rule.between(now, until, true)

  if (dates.length === 0) {
    return 0
  }

  // 4. Check existing events (idempotency)
  const existing = await prisma.event.findMany({
    where: {
      recurringEventId: recurringEvent.id,
      date: { in: dates },
    },
    select: { date: true },
  })

  const existingDates = new Set(existing.map((e) => e.date.toISOString()))

  // 5. Filter to only new dates
  const newDates = dates.filter((d) => !existingDates.has(d.toISOString()))

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
    clubId: recurringEvent.clubId,
    recurringEventId: recurringEvent.id,
  }))

  await prisma.event.createMany({ data: events })

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
  const rule = RRule.fromString(pattern)
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
  const rule = RRule.fromString(recurringEvent.schedulePattern)
  const opts = rule.options

  const hour = String(opts.byhour?.[0] ?? 0).padStart(2, '0')
  const minute = String(opts.byminute?.[0] ?? 0).padStart(2, '0')
  const eventTime = `${hour}:${minute}`

  const dateKey = format(date, 'yyyy-MM-dd')

  return {
    id: `${recurringEvent.id}:${dateKey}`,
    title: recurringEvent.title,
    description: recurringEvent.description,
    date,
    time: eventTime,
    address: recurringEvent.address,
    latitude: recurringEvent.latitude,
    longitude: recurringEvent.longitude,
    distance: recurringEvent.distance,
    pace: recurringEvent.pace,
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
    },
  }
}
