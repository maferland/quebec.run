import { seedTestData, teardownTestData, testPrisma } from '@/lib/test-seed'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  toggleUserAdmin,
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
  let adminUserId: string

  beforeEach(async () => {
    await seedTestData()
    // Get the user ID from the created test data
    const testUser = await testPrisma.user.findFirst({
      where: { email: { contains: 'test-' } },
    })
    testUserId = testUser!.id

    // Create an admin user for testing
    const adminUser = await testPrisma.user.create({
      data: {
        email: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
        name: 'Admin User',
        isAdmin: true,
      },
    })
    adminUserId = adminUser.id
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
          isAdmin: expect.any(Boolean),
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

      const adminWithoutClub = result.find((u) => u.id === adminUserId)
      expect(adminWithoutClub?._count.clubs).toBe(0)
    })

    it('filters by admin status when specified', async () => {
      const result = await getAllUsersForAdmin({
        data: { limit: 10, offset: 0, isAdmin: 'true' },
      })

      expect(result).toHaveLength(1)
      expect(result[0].isAdmin).toBe(true)
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

  describe('toggleUserAdmin', () => {
    it('toggles user admin status to true', async () => {
      const mockAdmin = { id: adminUserId, isAdmin: true }
      const result = await toggleUserAdmin({
        user: mockAdmin,
        data: { id: testUserId, isAdmin: true },
      })

      expect(result.id).toBe(testUserId)
      expect(result.isAdmin).toBe(true)

      // Verify in database
      const dbUser = await testPrisma.user.findUnique({
        where: { id: testUserId },
      })
      expect(dbUser?.isAdmin).toBe(true)
    })

    it('toggles user admin status to false', async () => {
      const mockAdmin = { id: testUserId, isAdmin: true }
      const result = await toggleUserAdmin({
        user: mockAdmin,
        data: { id: adminUserId, isAdmin: false },
      })

      expect(result.id).toBe(adminUserId)
      expect(result.isAdmin).toBe(false)

      // Verify in database
      const dbUser = await testPrisma.user.findUnique({
        where: { id: adminUserId },
      })
      expect(dbUser?.isAdmin).toBe(false)
    })

    it('prevents self-demotion', async () => {
      const mockAdmin = { id: adminUserId, isAdmin: true }

      await expect(
        toggleUserAdmin({
          user: mockAdmin,
          data: { id: adminUserId, isAdmin: false },
        })
      ).rejects.toThrow('Cannot demote yourself')
    })

    it('allows self-promotion', async () => {
      const mockUser = { id: testUserId, isAdmin: false }
      const result = await toggleUserAdmin({
        user: mockUser,
        data: { id: testUserId, isAdmin: true },
      })

      expect(result.isAdmin).toBe(true)
    })

    it('throws error for non-existent user', async () => {
      const mockAdmin = { id: adminUserId, isAdmin: true }

      await expect(
        toggleUserAdmin({
          user: mockAdmin,
          data: { id: 'non-existent', isAdmin: true },
        })
      ).rejects.toThrow('User not found')
    })
  })
})
