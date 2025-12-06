import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type {
  EventsQuery,
  EventCreate,
  EventUpdate,
  EventId,
  PublicPayload,
  AuthPayload,
} from '@/lib/schemas'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'

// Type definitions for service returns
export type GetAllEventsReturn = Prisma.EventGetPayload<{
  select: {
    id: true
    title: true
    date: true
    time: true
    distance: true
    pace: true
    address: true
    club: {
      select: {
        name: true
      }
    }
  }
}>

// Pure business logic functions - let TypeScript infer return types

export const getAllEvents = async ({
  data,
}: PublicPayload<EventsQuery>): Promise<GetAllEventsReturn[]> => {
  const {
    limit = 50,
    offset = 0,
    clubId,
    search,
    dateFrom,
    dateTo,
    sortBy = 'date',
    sortOrder = 'asc',
  } = data

  // Get today's date at midnight to include today's events but exclude past days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Prisma.EventWhereInput = {
    ...(clubId && { clubId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ],
    }),
    // Combine today boundary with optional dateFrom/dateTo filters
    date: {
      gte: dateFrom
        ? new Date(Math.max(today.getTime(), new Date(dateFrom).getTime()))
        : today,
      ...(dateTo && { lte: new Date(dateTo) }),
    },
  }

  const orderBy: Prisma.EventOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const events = await prisma.event.findMany({
    where,
    orderBy,
    take: Number(limit),
    skip: Number(offset),
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      distance: true,
      pace: true,
      address: true,
      club: {
        select: {
          name: true,
        },
      },
    },
  })

  return events
}

export const getAllEventsForAdmin = async ({
  user,
  data,
}: AuthPayload<EventsQuery>) => {
  if (!user.isAdmin) {
    throw new UnauthorizedError('Admin access required')
  }

  const { clubId, search, sortBy = 'date', sortOrder = 'desc' } = data

  const where: Prisma.EventWhereInput = {
    // NO date restriction - admins see all history
    ...(clubId && { clubId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy: Prisma.EventOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  return await prisma.event.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      time: true,
      address: true,
      club: {
        select: { name: true, slug: true },
      },
    },
  })
}

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
  const event = await prisma.event.create({
    data: {
      ...data,
      date: new Date(data.date),
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

  // Check permissions: must be admin OR own the event's club
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      club: {
        select: { ownerId: true },
      },
    },
  })

  if (!event) {
    throw new NotFoundError('Event not found')
  }

  if (!user.isAdmin && event.club.ownerId !== user.id) {
    throw new UnauthorizedError('Unauthorized')
  }

  return await prisma.event.update({
    where: { id },
    data: {
      ...updateData,
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

  // Check permissions: must be admin OR own the event's club
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      club: {
        select: { ownerId: true },
      },
    },
  })

  if (!event) {
    throw new NotFoundError('Event not found')
  }

  if (!user.isAdmin && event.club.ownerId !== user.id) {
    throw new UnauthorizedError('Unauthorized')
  }

  return await prisma.event.delete({
    where: { id },
  })
}
