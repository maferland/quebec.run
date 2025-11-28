import { seedTestData, teardownTestData, testPrisma } from '@/lib/test-seed'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  toggleUserStaff,
} from './users'

// Test helpers
const expectValidUser = (overrides = {}) =>
  expect.objectContaining({
    id: expect.stringMatching(/^c[a-z0-9]+$/), // CUID pattern
    email: expect.any(String),
    name: expect.any(String),
    ...overrides,
  })

describe('Users Service Integration Tests', () => {
  let testUserId: string
  let staffUserId: string

  beforeEach(async () => {
    await seedTestData()
    // Get the user ID from the created test data
    const testUser = await testPrisma.user.findFirst({
      where: { email: { contains: 'test-' } },
    })
    testUserId = testUser!.id

    // Create a staff user for testing
    const staffUser = await testPrisma.user.create({
      data: {
        email: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
        name: 'Staff User',
        isStaff: true,
      },
    })
    staffUserId = staffUser.id
  })

  afterEach(async () => {
    await teardownTestData()
  })

  describe('getAllUsersForAdmin', () => {
    it('returns all users with pagination', async () => {
      const result = await getAllUsersForAdmin({
        data: { limit: 10, offset: 0 },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(
        expectValidUser({
          isStaff: expect.any(Boolean),
          _count: expect.objectContaining({
            clubs: expect.any(Number),
          }),
        })
      )
    })

    it('respects limit parameter', async () => {
      const result = await getAllUsersForAdmin({
        data: { limit: 1, offset: 0 },
      })
      expect(result).toHaveLength(1)
    })

    it('includes club count', async () => {
      const result = await getAllUsersForAdmin({
        data: { limit: 10, offset: 0 },
      })

      const userWithClub = result.find((u) => u.id === testUserId)
      expect(userWithClub?._count.clubs).toBe(1)

      const staffWithoutClub = result.find((u) => u.id === staffUserId)
      expect(staffWithoutClub?._count.clubs).toBe(0)
    })

    it('filters by staff status when specified', async () => {
      const result = await getAllUsersForAdmin({
        data: { limit: 10, offset: 0, isStaff: 'true' },
      })

      expect(result).toHaveLength(1)
      expect(result[0].isStaff).toBe(true)
    })
  })

  describe('getUserByIdForAdmin', () => {
    it('returns a specific user with club count', async () => {
      const result = await getUserByIdForAdmin({ data: { id: testUserId } })

      expect(result).toEqual(
        expectValidUser({
          id: testUserId,
          _count: expect.objectContaining({
            clubs: 1,
          }),
        })
      )
    })

    it('throws error for non-existent user', async () => {
      await expect(
        getUserByIdForAdmin({ data: { id: 'non-existent' } })
      ).rejects.toThrow('User not found')
    })
  })

  describe('toggleUserStaff', () => {
    it('toggles user staff status to true', async () => {
      const mockStaff = { id: staffUserId, isStaff: true }
      const result = await toggleUserStaff({
        user: mockStaff,
        data: { id: testUserId, isStaff: true },
      })

      expect(result.id).toBe(testUserId)
      expect(result.isStaff).toBe(true)

      // Verify in database
      const dbUser = await testPrisma.user.findUnique({
        where: { id: testUserId },
      })
      expect(dbUser?.isStaff).toBe(true)
    })

    it('toggles user staff status to false', async () => {
      const mockStaff = { id: testUserId, isStaff: true }
      const result = await toggleUserStaff({
        user: mockStaff,
        data: { id: staffUserId, isStaff: false },
      })

      expect(result.id).toBe(staffUserId)
      expect(result.isStaff).toBe(false)

      // Verify in database
      const dbUser = await testPrisma.user.findUnique({
        where: { id: staffUserId },
      })
      expect(dbUser?.isStaff).toBe(false)
    })

    it('prevents self-demotion', async () => {
      const mockStaff = { id: staffUserId, isStaff: true }

      await expect(
        toggleUserStaff({
          user: mockStaff,
          data: { id: staffUserId, isStaff: false },
        })
      ).rejects.toThrow('Cannot remove your own staff access')
    })

    it('allows self-promotion', async () => {
      const mockUser = { id: testUserId, isStaff: false }
      const result = await toggleUserStaff({
        user: mockUser,
        data: { id: testUserId, isStaff: true },
      })

      expect(result.isStaff).toBe(true)
    })

    it('throws error for non-existent user', async () => {
      const mockStaff = { id: staffUserId, isStaff: true }

      await expect(
        toggleUserStaff({
          user: mockStaff,
          data: { id: 'non-existent', isStaff: true },
        })
      ).rejects.toThrow('User not found')
    })
  })
})
