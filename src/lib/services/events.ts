import { prisma } from '@/lib/prisma'
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

// Pure business logic functions - let TypeScript infer return types

export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const { limit = 50, offset = 0, clubId, clubSlug, search, pacePolicy } = data

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, 60)

  let resolvedClubId = clubId
  if (!resolvedClubId && clubSlug) {
    const club = await prisma.club.findUnique({
      where: { slug: clubSlug },
      select: { id: true },
    })
    if (!club) return []
    resolvedClubId = club.id
  }

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

  return events.slice(offset, offset + limit)
}

export type GetAllEventsReturn = Awaited<ReturnType<typeof getAllEvents>>[0]

const WEEKDAY_ORDER: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5, 6, 0]

function locationKey(event: GetAllEventsReturn): string {
  if (event.latitude !== null && event.longitude !== null) {
    return `${event.latitude.toFixed(4)},${event.longitude.toFixed(4)}`
  }
  return (event.address ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

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
  next: GetAllEventsReturn
}

export async function getEventLocations({
  data,
}: PublicPayload<EventsQuery>): Promise<EventLocation[]> {
  const { clubId, clubSlug } = data

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, 60)

  let resolvedClubId = clubId
  if (!resolvedClubId && clubSlug) {
    const club = await prisma.club.findUnique({
      where: { slug: clubSlug },
      select: { id: true },
    })
    if (!club) return []
    resolvedClubId = club.id
  }

  const events = await getEventsInRange(startDate, endDate, resolvedClubId)

  const buckets = new Map<string, EventLocation>()
  for (const event of events) {
    if (!event.club) continue
    if (!matchesFilters(event, data)) continue
    const key = `${event.club.id}|${locationKey(event)}`
    const day = event.date.getDay()
    const existing = buckets.get(key)
    if (!existing) {
      buckets.set(key, {
        key,
        club: event.club,
        title: event.title,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
        weekdays: [day],
        occurrenceCount: 1,
        next: event,
      })
    } else {
      if (!existing.weekdays.includes(day)) existing.weekdays.push(day)
      existing.occurrenceCount += 1
      if (event.date < existing.next.date) existing.next = event
    }
  }

  const result = Array.from(buckets.values())
  for (const bucket of result) {
    bucket.weekdays.sort(
      (a, b) =>
        WEEKDAY_ORDER.indexOf(a as 0 | 1 | 2 | 3 | 4 | 5 | 6) -
        WEEKDAY_ORDER.indexOf(b as 0 | 1 | 2 | 3 | 4 | 5 | 6)
    )
  }
  return result.sort((a, b) => a.next.date.getTime() - b.next.date.getTime())
}

export const getEventById = async ({ data }: PublicPayload<EventId>) => {
  const { id } = data

  // Virtual event ID formats:
  // New: slug--YYYY-MM-DD (e.g., 6am-club-beauport--2026-03-18)
  // Legacy: cuid:YYYY-MM-DD (e.g., cmj8zbj20000cpt9z:2026-03-18)
  const slugMatch = id.match(/^(.+)--(\d{4}-\d{2}-\d{2})$/)
  const legacyMatch = !slugMatch && id.match(/^(.+):(\d{4}-\d{2}-\d{2})$/)
  const virtualMatch = slugMatch || legacyMatch

  if (virtualMatch) {
    const [, identifier, dateKey] = virtualMatch
    const recurringEvent = slugMatch
      ? await prisma.recurringEvent.findFirst({
          where: { slug: identifier },
          include: { club: true },
        })
      : await prisma.recurringEvent.findUnique({
          where: { id: identifier },
          include: { club: true },
        })

    if (!recurringEvent) {
      return null
    }

    const date = new Date(`${dateKey}T12:00:00`)
    return createVirtualEvent(recurringEvent, date)
  }

  return await prisma.event.findUnique({
    where: { id },
    include: {
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

export const getEventByClubAndSlug = async ({
  data,
}: PublicPayload<EventByClubAndSlug>) => {
  const { clubSlug, eventSlug, date } = data

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

export const getNextOccurrenceDate = async ({
  data,
}: PublicPayload<EventByClubAndSlugBare>) => {
  const { clubSlug, eventSlug } = data

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

  return await prisma.event.update({
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

  return await prisma.event.delete({
    where: { id },
  })
}
