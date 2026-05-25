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

  return events.slice(offset, offset + limit)
}

export type GetAllEventsReturn = Awaited<ReturnType<typeof getAllEvents>>[0]

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
