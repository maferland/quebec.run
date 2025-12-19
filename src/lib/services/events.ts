import { prisma } from '@/lib/prisma'
import type {
  EventsQuery,
  EventCreate,
  EventUpdate,
  EventId,
  PublicPayload,
  AuthPayload,
} from '@/lib/schemas'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'
import { geocodeAddress } from './geocoding'
import { getEventsInRange } from './recurring-events'
import { addDays } from 'date-fns'

// Pure business logic functions - let TypeScript infer return types

export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const { limit = 50, offset = 0, clubId } = data

  // Calculate date range (today + next 60 days for good coverage)
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, 60)

  // Use hybrid query to get concrete + virtual events
  const events = await getEventsInRange(startDate, endDate, clubId)

  // Apply pagination
  const paginatedEvents = events.slice(offset, offset + limit)

  return paginatedEvents
}

export type GetAllEventsReturn = Awaited<ReturnType<typeof getAllEvents>>[0]

export const getEventById = async ({ data }: PublicPayload<EventId>) => {
  const { id } = data
  const event = await prisma.event.findUnique({
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

  if (!event) {
    throw new NotFoundError('Event not found')
  }

  return event
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
