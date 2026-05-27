import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  ClubCreate,
  ClubDelete,
  ClubsQuery,
  ClubUpdate,
  PublicPayload,
  ServiceUser,
} from '@/lib/schemas'
import { createSlug, createUniqueSlug } from '@/lib/utils/slug'
import { getEventsInRange, expandRRuleDates } from './recurring-events'
import { addDays } from 'date-fns'
import { CLUB_FACETS, type ClubFacetKey } from '@/lib/facets'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/lib/errors'

// We need the ClubId type for getClubById
import { clubIdSchema, clubSlugSchema } from '@/lib/schemas'
import type { z } from 'zod'
type ClubId = z.infer<typeof clubIdSchema>
type ClubSlug = z.infer<typeof clubSlugSchema>

// Pure business logic functions - let TypeScript infer return types

const CLUB_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  stravaSlug: true,
  type: true,
  vibe: true,
  beginnerFriendly: true,
  _count: {
    select: {
      recurringEvents: { where: { isActive: true } },
    },
  },
} as const

type ClubListItem = Awaited<
  ReturnType<typeof prisma.club.findFirst<{ select: typeof CLUB_LIST_SELECT }>>
>

function matchesClubFilters(
  club: NonNullable<ClubListItem>,
  data: ClubsQuery
): boolean {
  if (data.search) {
    const q = data.search.toLowerCase()
    const nameHit = club.name.toLowerCase().includes(q)
    const descHit = club.description?.toLowerCase().includes(q) ?? false
    if (!nameHit && !descHit) return false
  }
  if (data.type === 'ROAD' && club.type !== 'ROAD' && club.type !== 'MIXED') {
    return false
  }
  if (data.type === 'TRAIL' && club.type !== 'TRAIL' && club.type !== 'MIXED') {
    return false
  }
  if (data.vibe && club.vibe !== data.vibe) return false
  if (data.beginner === '1' && !club.beginnerFriendly) return false
  return true
}

export type ClubFacetCounts = Record<ClubFacetKey, number>

const EMPTY_CLUB_FACET_COUNTS: ClubFacetCounts = {
  road: 0,
  trail: 0,
  social: 0,
  training: 0,
  beginner: 0,
}

function computeClubFacetCounts(
  clubs: NonNullable<ClubListItem>[],
  data: ClubsQuery
): ClubFacetCounts {
  const counts: ClubFacetCounts = { ...EMPTY_CLUB_FACET_COUNTS }
  for (const club of clubs) {
    for (const facet of CLUB_FACETS) {
      if (matchesClubFilters(club, { ...data, [facet.param]: facet.value })) {
        counts[facet.key] += 1
      }
    }
  }
  return counts
}

async function fetchClubList(): Promise<NonNullable<ClubListItem>[]> {
  return prisma.club.findMany({
    orderBy: { createdAt: 'desc' },
    select: CLUB_LIST_SELECT,
  })
}

export const getAllClubs = async ({ data }: PublicPayload<ClubsQuery>) => {
  const { limit = 50, offset = 0 } = data
  const all = await fetchClubList()
  const filtered = all.filter((club) => matchesClubFilters(club, data))
  return filtered.slice(offset, offset + limit)
}

export type GetAllClubsReturn = Awaited<ReturnType<typeof getAllClubs>>[0]

export type ClubListing = {
  clubs: GetAllClubsReturn[]
  facetCounts: ClubFacetCounts
}

export const getClubListing = async ({
  data,
}: PublicPayload<ClubsQuery>): Promise<ClubListing> => {
  const { limit = 50, offset = 0 } = data
  const all = await fetchClubList()
  const filtered = all.filter((club) => matchesClubFilters(club, data))
  const facetCounts = computeClubFacetCounts(all, data)
  return {
    clubs: filtered.slice(offset, offset + limit),
    facetCounts,
  }
}

/**
 * Throws if `user` neither owns the club nor is staff. Used by API routes
 * that mutate club-scoped resources (events, recurring events, etc).
 */
export async function assertClubOwnership(
  clubId: string,
  user: ServiceUser
): Promise<void> {
  if (user.isStaff) return
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { ownerId: true },
  })
  if (!club) throw new NotFoundError('Club not found')
  if (club.ownerId !== user.id) {
    throw new UnauthorizedError('Not authorized for this club')
  }
}

export const getClubById = async ({ data }: PublicPayload<ClubId>) => {
  const { id } = data
  const club = await prisma.club.findUnique({
    where: { id },
  })

  if (!club) {
    throw new NotFoundError('Club not found')
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
  // Validate unique stravaSlug if provided
  if (data.stravaSlug) {
    const existingClub = await prisma.club.findUnique({
      where: { stravaSlug: data.stravaSlug },
    })
    if (existingClub) {
      throw new ConflictError(
        'A club with this Strava slug already exists. Please use a different slug or unlink the existing club.'
      )
    }
  }

  // Generate unique slug from club name
  const baseSlug = createSlug(data.name)

  // Get all existing slugs to ensure uniqueness (both clubs and orgs)
  const [existingClubSlugs, existingOrgSlugs] = await Promise.all([
    prisma.club
      .findMany({ select: { slug: true } })
      .then((clubs) => clubs.map((c) => c.slug)),
    prisma.organization
      .findMany({ select: { slug: true } })
      .then((orgs) => orgs.map((o) => o.slug)),
  ])
  const existingSlugs = [...existingClubSlugs, ...existingOrgSlugs]

  const uniqueSlug = createUniqueSlug(baseSlug, existingSlugs)

  // Create Organization and Club in a transaction
  // Every Club gets a hidden Organization (isVisible=false)
  return await prisma.$transaction(async (tx) => {
    // Create hidden organization for this club
    const org = await tx.organization.create({
      data: {
        name: data.name,
        slug: `${uniqueSlug}-org`,
        description: data.description,
        website: data.website,
        instagram: data.instagram,
        facebook: data.facebook,
        isVisible: false, // Hidden for simple clubs
        ownerId: user.id,
      },
    })

    // Create club linked to organization
    return await tx.club.create({
      data: {
        ...data,
        slug: uniqueSlug,
        ownerId: user.id,
        organizationId: org.id,
      },
      include: {
        organization: true,
        events: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 5,
        },
      },
    })
  })
}

export const updateClub = async ({ data }: PublicPayload<ClubUpdate>) => {
  const { id, ...updateData } = data

  // Validate unique stravaSlug if being updated to a non-null value
  if (updateData.stravaSlug) {
    const existingClub = await prisma.club.findUnique({
      where: { stravaSlug: updateData.stravaSlug },
    })
    if (existingClub && existingClub.id !== id) {
      throw new ConflictError(
        'A club with this Strava slug already exists. Please use a different slug or unlink the existing club.'
      )
    }
  }

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
    select: { ownerId: true, organizationId: true },
  })

  if (!club) return null

  if (club.ownerId !== user.id && !user.isStaff) {
    throw new UnauthorizedError('Unauthorized to delete this club')
  }

  // Delete club and potentially orphaned organization in transaction
  return await prisma.$transaction(async (tx) => {
    const deletedClub = await tx.club.delete({
      where: { id },
    })

    // If club had an org, check if org has other clubs
    if (club.organizationId) {
      const remainingClubs = await tx.club.count({
        where: { organizationId: club.organizationId },
      })

      // If no clubs left, delete the organization too
      if (remainingClubs === 0) {
        await tx.organization.delete({
          where: { id: club.organizationId },
        })
      }
    }

    return deletedClub
  })
}

// Helper functions that take ID/slug from route params
export async function getClubByIdWithParams(id: string) {
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      instagram: true,
      facebook: true,
      stravaSlug: true,
    },
  })

  if (!club) return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const endDate = addDays(now, 30)
  const events = await getEventsInRange(now, endDate, club.id)

  return { ...club, events }
}

export async function getClubBySlug({ slug }: ClubSlug) {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      instagram: true,
      facebook: true,
      stravaSlug: true,
      recurringEvents: {
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          address: true,
          schedulePattern: true,
          pace: true,
          pacePolicy: true,
        },
      },
    },
  })

  if (!club) return null

  const now = new Date()
  const upper = addDays(now, 365)
  const patterns = club.recurringEvents
    .map((re) => {
      const [next] = expandRRuleDates(re.schedulePattern, now, upper)
      return { ...re, nextOccurrence: next ?? null }
    })
    .sort((a, b) => {
      if (!a.nextOccurrence) return 1
      if (!b.nextOccurrence) return -1
      return a.nextOccurrence.getTime() - b.nextOccurrence.getTime()
    })

  return { ...club, patterns }
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
    throw new NotFoundError('Club not found')
  }

  if (club.ownerId !== user.id && !user.isStaff) {
    throw new UnauthorizedError('Unauthorized to update this club')
  }

  const { id, ...updateData } = data

  return await prisma.club.update({
    where: { id },
    data: updateData,
  })
}
