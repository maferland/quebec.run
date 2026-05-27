import { seedTestData, teardownTestData, testPrisma } from '@/lib/test-seed'
import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest'
import {
  assertClubOwnership,
  createClub,
  deleteClub,
  getAllClubs,
  getClubById,
  getClubListing,
  updateClub,
} from './clubs'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'

// Test helpers
const expectValidClub = (overrides = {}) =>
  expect.objectContaining({
    id: expect.stringMatching(/^c[a-z0-9]+$/), // CUID pattern
    name: expect.any(String),
    slug: expect.any(String),
    description: expect.any(String),
    ...overrides,
  })

const expectValidEvent = (overrides = {}) =>
  expect.objectContaining({
    id: expect.stringMatching(/^c[a-z0-9]+$/), // CUID pattern
    title: expect.any(String),
    date: expect.any(Date),
    time: expect.any(String),
    distance: expect.any(String),
    pace: expect.any(String),
    ...overrides,
  })

const expectValidClubWithCount = (overrides = {}) =>
  expectValidClub({
    _count: expect.objectContaining({
      recurringEvents: expect.any(Number),
    }),
    ...overrides,
  })

const expectValidClubWithUpcomingEvents = (
  expectedEventCount = 0,
  overrides = {}
) =>
  expectValidClub({
    upcomingEvents:
      expectedEventCount > 0
        ? expect.arrayContaining([expectValidEvent()])
        : expect.arrayContaining([]),
    ...overrides,
  })

describe('Clubs Service Integration Tests', () => {
  let testUserId: string

  beforeEach(async () => {
    await seedTestData()
    // Get the user ID from the created test data
    const testUser = await testPrisma.user.findFirst()
    testUserId = testUser!.id
  })

  afterEach(async () => {
    await teardownTestData()
  })

  describe('getAllClubs', () => {
    it('returns all clubs with pagination', async () => {
      const result = await getAllClubs({ data: { limit: 10, offset: 0 } })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expectValidClubWithCount({
          name: 'Test Running Club',
          slug: 'test-running-club',
          description: 'A club for testing purposes',
        })
      )
    })

    it('respects limit parameter', async () => {
      // Create additional clubs
      await testPrisma.club.create({
        data: {
          name: 'Extra Club 1',
          slug: 'extra-club-1',
          ownerId: testUserId,
        },
      })
      await testPrisma.club.create({
        data: {
          name: 'Extra Club 2',
          slug: 'extra-club-2',
          ownerId: testUserId,
        },
      })

      const result = await getAllClubs({ data: { limit: 1, offset: 0 } })
      expect(result).toHaveLength(1)
    })
  })

  describe('getClubListing', () => {
    async function seedVariety() {
      // Replace single seeded club with a varied set.
      await testPrisma.event.deleteMany({})
      await testPrisma.club.deleteMany({})
      await testPrisma.club.createMany({
        data: [
          {
            name: 'Road Social Beginner',
            slug: 'road-social-beginner',
            description: 'beginner-friendly road club',
            type: 'ROAD',
            vibe: 'SOCIAL',
            beginnerFriendly: true,
            ownerId: testUserId,
          },
          {
            name: 'Road Training',
            slug: 'road-training',
            description: 'serious road training',
            type: 'ROAD',
            vibe: 'TRAINING',
            beginnerFriendly: false,
            ownerId: testUserId,
          },
          {
            name: 'Trail Social',
            slug: 'trail-social',
            description: 'forest trail vibes',
            type: 'TRAIL',
            vibe: 'SOCIAL',
            beginnerFriendly: false,
            ownerId: testUserId,
          },
          {
            name: 'Mixed Social',
            slug: 'mixed-social',
            description: 'both road and trail',
            type: 'MIXED',
            vibe: 'SOCIAL',
            beginnerFriendly: false,
            ownerId: testUserId,
          },
        ],
      })
    }

    it('returns all clubs when no filters provided', async () => {
      await seedVariety()
      const { clubs, facetCounts } = await getClubListing({ data: {} })

      expect(clubs).toHaveLength(4)
      // ROAD chip should match ROAD + MIXED → 3
      expect(facetCounts.road).toBe(3)
      // TRAIL chip should match TRAIL + MIXED → 2
      expect(facetCounts.trail).toBe(2)
      expect(facetCounts.social).toBe(3)
      expect(facetCounts.training).toBe(1)
      expect(facetCounts.beginner).toBe(1)
    })

    it('filters by search term against name and description', async () => {
      await seedVariety()
      const { clubs } = await getClubListing({ data: { search: 'trail' } })

      expect(clubs.map((c) => c.slug).sort()).toEqual([
        'mixed-social',
        'trail-social',
      ])
    })

    it('filters by type=ROAD (includes MIXED)', async () => {
      await seedVariety()
      const { clubs } = await getClubListing({ data: { type: 'ROAD' } })

      expect(clubs.map((c) => c.slug).sort()).toEqual([
        'mixed-social',
        'road-social-beginner',
        'road-training',
      ])
    })

    it('filters by type=TRAIL (includes MIXED)', async () => {
      await seedVariety()
      const { clubs } = await getClubListing({ data: { type: 'TRAIL' } })

      expect(clubs.map((c) => c.slug).sort()).toEqual([
        'mixed-social',
        'trail-social',
      ])
    })

    it('filters by vibe (exact match, MIXED type unaffected)', async () => {
      await seedVariety()
      const { clubs } = await getClubListing({
        data: { vibe: 'TRAINING' },
      })

      expect(clubs).toHaveLength(1)
      expect(clubs[0].slug).toBe('road-training')
    })

    it('filters by beginner=1', async () => {
      await seedVariety()
      const { clubs } = await getClubListing({ data: { beginner: '1' } })

      expect(clubs).toHaveLength(1)
      expect(clubs[0].slug).toBe('road-social-beginner')
    })

    it('computes facet counts assuming "if I added this facet" semantics', async () => {
      await seedVariety()
      // With vibe=SOCIAL active, count what each chip would yield if also active
      const { facetCounts } = await getClubListing({
        data: { vibe: 'SOCIAL' },
      })

      // Facet counts simulate "swap or add this facet on top of current
      // filters" — same param overwrites (matches the /events semantics).
      // With vibe=SOCIAL active:
      //   ROAD chip + SOCIAL: road-social-beginner + mixed-social = 2
      //   TRAIL chip + SOCIAL: trail-social + mixed-social = 2
      //   TRAINING chip swaps vibe → road-training = 1
      //   beginner + SOCIAL: road-social-beginner = 1
      expect(facetCounts.road).toBe(2)
      expect(facetCounts.trail).toBe(2)
      expect(facetCounts.training).toBe(1)
      expect(facetCounts.beginner).toBe(1)
    })
  })

  describe('assertClubOwnership', () => {
    it('resolves silently when the user owns the club', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')
      await expect(
        assertClubOwnership(club.id, { id: testUserId, isStaff: false })
      ).resolves.toBeUndefined()
    })

    it('resolves silently for staff users on any club', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')
      await expect(
        assertClubOwnership(club.id, { id: 'someone-else', isStaff: true })
      ).resolves.toBeUndefined()
    })

    it('throws UnauthorizedError when a non-staff user does not own the club', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')
      await expect(
        assertClubOwnership(club.id, { id: 'not-the-owner', isStaff: false })
      ).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('throws NotFoundError when the club does not exist', async () => {
      await expect(
        assertClubOwnership('no-such-club', { id: testUserId, isStaff: false })
      ).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('getClubById', () => {
    it('returns a specific club with upcoming runs', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const result = await getClubById({ data: { id: testClub.id } })

      expect(result).toEqual(
        expectValidClubWithUpcomingEvents(2, {
          id: testClub.id,
          name: testClub.name,
          slug: testClub.slug,
        })
      )
    })

    it('throws error for non-existent club', async () => {
      await expect(
        getClubById({ data: { id: 'non-existent' } })
      ).rejects.toThrow('Club not found')
    })
  })

  describe('createClub', () => {
    it('creates a new club', async () => {
      const clubData = {
        name: 'Integration Test Club',
        description: 'A club created in integration test',
        website: 'https://integration-test.com',
      }

      const mockUser = { id: testUserId, isStaff: false }
      const result = await createClub({ user: mockUser, data: clubData })

      expect(result).toBeDefined()
      expect(result.name).toBe(clubData.name)
      expect(result.description).toBe(clubData.description)
      expect(result.website).toBe(clubData.website)
      expect(result.ownerId).toBe(mockUser.id)
      expect(result.id).toBeDefined()

      // Verify it was actually created in database
      const dbClub = await testPrisma.club.findUnique({
        where: { id: result.id },
      })
      expect(dbClub).toBeDefined()
      expect(dbClub?.name).toBe(clubData.name)
    })
  })

  describe('updateClub', () => {
    it('updates an existing club', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const updateData = {
        id: testClub.id,
        name: 'Updated Club Name',
        description: 'Updated description',
      }

      const result = await updateClub({ data: updateData })

      assert(result)
      expect(result.id).toBe(testClub.id)
      expect(result.name).toBe(updateData.name)
      expect(result.description).toBe(updateData.description)

      // Verify it was actually updated in database
      const dbClub = await testPrisma.club.findUnique({
        where: { id: testClub.id },
      })
      expect(dbClub?.name).toBe(updateData.name)
      expect(dbClub?.description).toBe(updateData.description)
    })
  })

  describe('deleteClub', () => {
    it('deletes a club when user is owner', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const mockUser = { id: testClub.ownerId, isStaff: false }
      const result = await deleteClub({
        user: mockUser,
        data: { id: testClub.id },
      })

      assert(result)
      expect(result.id).toBe(testClub.id)

      // Verify it was actually deleted from database
      const dbClub = await testPrisma.club.findUnique({
        where: { id: testClub.id },
      })
      expect(dbClub).toBeNull()
    })

    it('throws error when user is not owner and not admin', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const mockUser = { id: 'different-user', isStaff: false }

      await expect(
        deleteClub({ user: mockUser, data: { id: testClub.id } })
      ).rejects.toThrow('Unauthorized to delete this club')
    })

    it('allows admin to delete any club', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const mockAdmin = { id: 'admin-user', isStaff: true }
      const result = await deleteClub({
        user: mockAdmin,
        data: { id: testClub.id },
      })

      assert(result)
      expect(result.id).toBe(testClub.id)

      // Verify it was actually deleted from database
      const dbClub = await testPrisma.club.findUnique({
        where: { id: testClub.id },
      })
      expect(dbClub).toBeNull()
    })
  })
})
