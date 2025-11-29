import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  PublicPayload,
  ToggleUserStaff,
  UserId,
  UsersQuery,
} from '@/lib/schemas'

// Pure business logic functions - let TypeScript infer return types

export const getAllUsersForAdmin = async ({
  data,
}: PublicPayload<UsersQuery>) => {
  const { limit = 50, offset = 0, isStaff } = data

  // Build where clause for optional staff filter
  const where = isStaff !== undefined ? { isStaff: isStaff === 'true' } : {}

  return await prisma.user.findMany({
    skip: offset,
    take: limit,
    orderBy: { createdAt: 'desc' },
    where,
    select: {
      id: true,
      email: true,
      name: true,
      isStaff: true,
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
      isStaff: true,
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

export const toggleUserStaff = async ({
  user,
  data,
}: AuthPayload<ToggleUserStaff>) => {
  const { id, isStaff } = data

  // Prevent self-demotion
  if (user.id === id && user.isStaff && !isStaff) {
    throw new Error('Cannot remove your own staff access')
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
    data: { isStaff },
  })
}
