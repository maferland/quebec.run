import { prisma } from '@/lib/prisma'
import type {
  ClubWithRuns,
  ClubsQuery,
  ClubCreate,
  ClubUpdate,
  ClubDelete,
  PublicPayload,
  AuthPayload,
} from '@/lib/schemas'

// We need the ClubId type for getClubById
import type { z } from 'zod'
import { clubIdSchema } from '@/lib/schemas'
type ClubId = z.infer<typeof clubIdSchema>

// Pure business logic functions - let TypeScript infer return types

export const getAllClubs = async ({ data }: PublicPayload<ClubsQuery>) => {
  const { limit = 50, offset = 0 } = data

  const clubs = await prisma.club.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  const clubsWithRuns: ClubWithRuns[] = await Promise.all(
    clubs.map(async (club) => {
      const upcomingRuns = await prisma.run.findMany({
        where: {
          clubId: club.id,
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 5,
      })

      return {
        ...club,
        upcomingRuns,
      }
    })
  )

  return clubsWithRuns
}

export const getClubById = async ({ data }: PublicPayload<ClubId>) => {
  const { id } = data
  const club = await prisma.club.findUnique({
    where: { id },
  })

  if (!club) {
    throw new Error('Club not found')
  }

  const upcomingRuns = await prisma.run.findMany({
    where: {
      clubId: id,
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
    take: 5,
  })

  return {
    ...club,
    upcomingRuns,
  }
}

export const createClub = async ({ user, data }: AuthPayload<ClubCreate>) => {
  return await prisma.club.create({
    data: {
      ...data,
      createdBy: user.id,
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
    select: { createdBy: true },
  })

  if (!club) return null

  if (club.createdBy !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized to delete this club')
  }

  return await prisma.club.delete({
    where: { id },
  })
}

// Helper functions that take ID from route params
export async function getClubByIdWithParams(id: string): Promise<ClubWithRuns | null> {
  const club = await prisma.club.findUnique({
    where: { id },
  })

  if (!club) return null

  const upcomingRuns = await prisma.run.findMany({
    where: {
      clubId: id,
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
  })

  return {
    ...club,
    upcomingRuns,
  }
}

export const updateClubById = async ({ user, data }: AuthPayload<ClubUpdate & { id: string }>) => {
  const club = await prisma.club.findUnique({
    where: { id: data.id },
    select: { createdBy: true },
  })

  if (!club) {
    throw new Error('Club not found')
  }

  if (club.createdBy !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized to update this club')
  }

  const { id, ...updateData } = data
  
  return await prisma.club.update({
    where: { id },
    data: updateData,
  })
}