import { seedTestData, teardownTestData, testPrisma } from '@/lib/test-seed'
import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest'
import {
  createClub,
  deleteClub,
  getAllClubs,
  getClubById,
  updateClub,
} from './clubs'

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

const expectValidClubWithEvents = (expectedEventCount = 0, overrides = {}) =>
  expectValidClub({
    events:
      expectedEventCount > 0
        ? expect.arrayContaining([expectValidEvent()])
        : expect.arrayContaining([]),
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
        expectValidClubWithEvents(2, {
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
