import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  ClubCreate,
  ClubDelete,
  ClubsQuery,
  ClubUpdate,
  PublicPayload,
} from '@/lib/schemas'
import { createSlug, createUniqueSlug } from '@/lib/utils/slug'

// We need the ClubId type for getClubById
import { clubIdSchema, clubSlugSchema } from '@/lib/schemas'
import type { z } from 'zod'
type ClubId = z.infer<typeof clubIdSchema>
type ClubSlug = z.infer<typeof clubSlugSchema>

// Pure business logic functions - let TypeScript infer return types

export const getAllClubs = async ({ data }: PublicPayload<ClubsQuery>) => {
  const { limit = 50, offset = 0 } = data

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  return await prisma.club.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      events: {
        where: {
          date: {
            gte: new Date(),
            lte: nextWeek,
          },
        },
        orderBy: { date: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          distance: true,
          pace: true,
        },
      },
    },
  })
}

export type GetAllClubsReturn = Awaited<ReturnType<typeof getAllClubs>>[0]

export const getClubById = async ({ data }: PublicPayload<ClubId>) => {
  const { id } = data
  const club = await prisma.club.findUnique({
    where: { id },
  })

  if (!club) {
    throw new Error('Club not found')
  }

  const upcomingEvents = await prisma.event.findMany({
    where: {
      clubId: id,
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
    take: 5,
  })

  return {
    ...club,
    upcomingEvents,
  }
}

export const createClub = async ({ user, data }: AuthPayload<ClubCreate>) => {
  // Generate unique slug from club name
  const baseSlug = createSlug(data.name)

  // Get all existing slugs to ensure uniqueness
  const existingSlugs = await prisma.club
    .findMany({
      select: { slug: true },
    })
    .then((clubs) => clubs.map((c) => c.slug))

  const uniqueSlug = createUniqueSlug(baseSlug, existingSlugs)

  return await prisma.club.create({
    data: {
      ...data,
      slug: uniqueSlug,
      ownerId: user.id,
    },
    include: {
      events: {
        where: {
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 5,
      },
    },
  })
}

export const updateClub = async ({ data }: PublicPayload<ClubUpdate>) => {
  const { id, ...updateData } = data

  const club = await prisma.club.update({
    where: { id },
    data: updateData,
  })

  return club
}

export const deleteClub = async ({ user, data }: AuthPayload<ClubDelete>) => {
  const { id } = data
  const club = await prisma.club.findUnique({
    where: { id },
    select: { ownerId: true },
  })

  if (!club) return null

  if (club.ownerId !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized to delete this club')
  }

  return await prisma.club.delete({
    where: { id },
  })
}

// Helper functions that take ID/slug from route params
export async function getClubByIdWithParams(id: string) {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  return await prisma.club.findUnique({
    where: { id },
    include: {
      events: {
        where: {
          date: {
            gte: new Date(),
            lte: nextWeek,
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  })
}

export async function getClubBySlug({ slug }: ClubSlug) {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  return await prisma.club.findUnique({
    where: { slug },
    include: {
      events: {
        where: {
          date: {
            gte: new Date(),
            lte: nextWeek,
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  })
}

export const updateClubById = async ({
  user,
  data,
}: AuthPayload<ClubUpdate & { id: string }>) => {
  const club = await prisma.club.findUnique({
    where: { id: data.id },
    select: { ownerId: true },
  })

  if (!club) {
    throw new Error('Club not found')
  }

  if (club.ownerId !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized to update this club')
  }

  const { id, ...updateData } = data

  return await prisma.club.update({
    where: { id },
    data: updateData,
  })
}
