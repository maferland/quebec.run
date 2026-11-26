import { prisma } from '@/lib/prisma'
import { invalidatePublicCache, PUBLIC_CACHE_TAGS } from '@/lib/public-cache'
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
  // Organization ownership can cascade through clubs owned by another user.
  // Capture the old public identities in the same transaction as the delete:
  // once the cascade commits they can no longer be discovered for eviction.
  const affected = await prisma.$transaction(
    async (tx) => {
      const deletedClubWhere = {
        OR: [{ ownerId: user.id }, { organization: { ownerId: user.id } }],
      }
      const [clubs, events, linkedClubs] = await Promise.all([
        tx.club.findMany({
          where: deletedClubWhere,
          select: {
            id: true,
            slug: true,
            recurringEvents: { select: { id: true, slug: true } },
          },
        }),
        tx.event.findMany({
          where: {
            OR: [
              { club: deletedClubWhere },
              { organization: { ownerId: user.id } },
              { recurringEvent: { club: deletedClubWhere } },
            ],
          },
          select: {
            id: true,
            slug: true,
          },
        }),
        // Events/addresses can disappear from a surviving club, or a surviving
        // run can lose a cascaded schedule through its SetNull foreign key.
        tx.club.findMany({
          where: {
            OR: [
              { events: { some: { organization: { ownerId: user.id } } } },
              { addresses: { some: { organization: { ownerId: user.id } } } },
              {
                events: {
                  some: { recurringEvent: { club: deletedClubWhere } },
                },
              },
            ],
          },
          select: { id: true, slug: true },
        }),
      ])
      await tx.user.delete({ where: { id: user.id } })
      return { clubs, events, linkedClubs }
    },
    { isolationLevel: 'Serializable' }
  )

  // Evict only after successful commit. A failed delete must leave public
  // content and its cache entries intact.
  invalidatePublicCache(
    PUBLIC_CACHE_TAGS.clubs,
    PUBLIC_CACHE_TAGS.explore,
    PUBLIC_CACHE_TAGS.sitemap,
    ...affected.clubs.flatMap((club) => [
      PUBLIC_CACHE_TAGS.clubId(club.id),
      PUBLIC_CACHE_TAGS.club(club.slug),
      PUBLIC_CACHE_TAGS.clubImage(club.slug),
      ...club.recurringEvents.flatMap((schedule) => [
        PUBLIC_CACHE_TAGS.schedule(schedule.id),
        PUBLIC_CACHE_TAGS.schedule(schedule.slug),
        PUBLIC_CACHE_TAGS.schedule(`${club.slug}-${schedule.slug}`),
      ]),
    ]),
    ...affected.events.flatMap((event) => [
      PUBLIC_CACHE_TAGS.run(event.id),
      ...(event.slug ? [PUBLIC_CACHE_TAGS.run(event.slug)] : []),
    ]),
    ...affected.linkedClubs.flatMap((club) => [
      PUBLIC_CACHE_TAGS.clubId(club.id),
      PUBLIC_CACHE_TAGS.club(club.slug),
    ])
  )

  return { success: true }
}
