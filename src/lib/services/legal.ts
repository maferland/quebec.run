import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  ConsentCreate,
  DataExport,
  DeletionRequest,
} from '@/lib/schemas'

export const createUserConsent = async ({
  user,
  ipAddress,
}: {
  user: AuthPayload<ConsentCreate>['user']
  ipAddress: string
}) => {
  // Check if consent already exists
  const existing = await prisma.userConsent.findUnique({
    where: { userId: user.id },
  })

  if (existing) {
    throw new Error('Consent already exists')
  }

  return await prisma.userConsent.create({
    data: {
      userId: user.id,
      ipAddress,
    },
  })
}

export const getUserConsent = async ({ userId }: { userId: string }) => {
  return await prisma.userConsent.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      acceptedAt: true,
      ipAddress: true,
    },
  })
}

export const exportUserData = async ({ user }: AuthPayload<DataExport>) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
    },
  })

  const clubs = await prisma.club.findMany({
    where: { ownerId: user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      createdAt: true,
    },
  })

  const events = await prisma.event.findMany({
    where: { club: { ownerId: user.id } },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      time: true,
      address: true,
      createdAt: true,
    },
  })

  const consents = await prisma.userConsent.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      acceptedAt: true,
      ipAddress: true,
    },
  })

  if (!userData) {
    throw new Error('User not found')
  }

  return {
    user: userData,
    clubs,
    events,
    consents,
  }
}

export const deleteUserAccount = async ({
  user,
}: AuthPayload<DeletionRequest>) => {
  // Delete user (cascade will handle related data)
  await prisma.user.delete({
    where: { id: user.id },
  })

  return { success: true }
}
