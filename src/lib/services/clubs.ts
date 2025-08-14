import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPublic, withAuth } from '@/lib/api-middleware'
import {
  ClubsQuerySchema,
  ClubCreateSchema,
  ClubUpdateSchema,
  type ClubWithRuns,
} from '@/lib/schemas'

// Schema for delete operation
const ClubDeleteSchema = z.object({
  id: z.string().min(1, 'Club ID is required'),
})

// Public routes
export const getAllClubs = withPublic(ClubsQuerySchema)(async (query) => {
  const { limit = 50, offset = 0 } = query

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
})

export const getClubById = withPublic()(async (): Promise<ClubWithRuns | null> => {
  // This will need the ID from route params in the API handler
  throw new Error('getClubById needs ID from route params')
})

// Authenticated routes
export const createClub = withAuth(ClubCreateSchema)(async ({ user, data }) => {
  return await prisma.club.create({
    data: {
      ...data,
      createdBy: user.id,
    },
  })
})

export const updateClub = withAuth(ClubUpdateSchema)(async ({ user, data }) => {
  // This will need the ID from route params in the API handler
  throw new Error('updateClub needs ID from route params')
})

export const deleteClub = withAuth(ClubDeleteSchema)(async ({ user, data }) => {
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
})

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

export const updateClubWithParams = (id: string) => withAuth(ClubUpdateSchema)(async ({ user, data }) => {
  const club = await prisma.club.findUnique({
    where: { id },
    select: { createdBy: true },
  })

  if (!club) return null

  if (club.createdBy !== user.id && !user.isAdmin) {
    throw new Error('Unauthorized to update this club')
  }

  return await prisma.club.update({
    where: { id },
    data,
  })
})