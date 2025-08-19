import { describe, it, expect, beforeEach, afterEach, assert } from 'vitest'
import { seedTestData, testPrisma, teardownTestData } from '@/lib/test-seed'
import { getAllClubs, createClub, updateClub, deleteClub, getClubById } from './clubs'

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
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('upcomingRuns')
    })

    it('respects limit parameter', async () => {
      // Create additional clubs
      await testPrisma.club.create({
        data: {
          name: 'Extra Club 1',
          address: '111 Extra St',
          createdBy: testUserId,
        },
      })
      await testPrisma.club.create({
        data: {
          name: 'Extra Club 2', 
          address: '222 Extra St',
          createdBy: testUserId,
        },
      })

      const result = await getAllClubs({ data: { limit: 1, offset: 0 } })
      expect(result.length).toBe(1)
    })
  })

  describe('getClubById', () => {
    it('returns a specific club with upcoming runs', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const result = await getClubById({ data: { id: testClub.id } })
      
      assert(result)
      expect(result.id).toBe(testClub.id)
      expect(result.name).toBe(testClub.name)
      expect(result).toHaveProperty('upcomingRuns')
      expect(Array.isArray(result.upcomingRuns)).toBe(true)
    })

    it('throws error for non-existent club', async () => {
      await expect(getClubById({ data: { id: 'non-existent' } })).rejects.toThrow('Club not found')
    })
  })

  describe('createClub', () => {
    it('creates a new club', async () => {
      const clubData = {
        name: 'Integration Test Club',
        description: 'A club created in integration test',
        address: '123 Integration St, Quebec City',
        website: 'https://integration-test.com',
      }

      const mockUser = { id: testUserId, isAdmin: false }
      const result = await createClub({ user: mockUser, data: clubData })
      
      expect(result).toBeDefined()
      expect(result.name).toBe(clubData.name)
      expect(result.description).toBe(clubData.description)
      expect(result.address).toBe(clubData.address)
      expect(result.website).toBe(clubData.website)
      expect(result.createdBy).toBe(mockUser.id)
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

      const mockUser = { id: testClub.createdBy, isAdmin: false }
      const result = await deleteClub({ user: mockUser, data: { id: testClub.id } })
      
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

      const mockUser = { id: 'different-user', isAdmin: false }
      
      await expect(
        deleteClub({ user: mockUser, data: { id: testClub.id } })
      ).rejects.toThrow('Unauthorized to delete this club')
    })

    it('allows admin to delete any club', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const mockAdmin = { id: 'admin-user', isAdmin: true }
      const result = await deleteClub({ user: mockAdmin, data: { id: testClub.id } })
      
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