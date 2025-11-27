import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  PublicPayload,
  ToggleUserAdmin,
  UserId,
  UsersQuery,
} from '@/lib/schemas'

// Pure business logic functions - let TypeScript infer return types

export const getAllUsersForAdmin = async ({
  data,
}: PublicPayload<UsersQuery>) => {
  const { limit = 50, offset = 0, isAdmin } = data

  // Build where clause for optional admin filter
  const where = isAdmin !== undefined ? { isAdmin: isAdmin === 'true' } : {}

  return await prisma.user.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
    where,
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          clubs: true,
        },
      },
    },
  })
}

export const getUserByIdForAdmin = async ({ data }: PublicPayload<UserId>) => {
  const { id } = data
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          clubs: true,
        },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

export const toggleUserAdmin = async ({
  user,
  data,
}: AuthPayload<ToggleUserAdmin>) => {
  const { id, isAdmin } = data

  // Prevent self-demotion
  if (user.id === id && user.isAdmin && !isAdmin) {
    throw new Error('Cannot demote yourself')
  }

  // Verify user exists
  const targetUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!targetUser) {
    throw new Error('User not found')
  }

  return await prisma.user.update({
    where: { id },
    data: { isAdmin },
  })
}
