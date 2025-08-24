import { prisma } from '@/lib/prisma'
import type {
  EventsQuery,
  EventCreate,
  EventId,
  PublicPayload,
  AuthPayload,
} from '@/lib/schemas'

// Pure business logic functions - let TypeScript infer return types

export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const { limit = 50, offset = 0, clubId } = data

  const where = clubId ? { clubId } : {}

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: 'asc' },
    take: limit,
    skip: offset,
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return events
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
    throw new Error('Event not found')
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
