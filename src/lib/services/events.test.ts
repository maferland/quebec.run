import { describe, it, expect, beforeEach, afterEach, assert } from 'vitest'
import { seedTestData, testPrisma, teardownTestData } from '@/lib/test-seed'
import { getAllEvents, createEvent, updateEvent } from './events'

describe('Events Service Integration Tests', () => {
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

  describe('getAllEvents', () => {
    it('returns all runs with pagination', async () => {
      const result = await getAllEvents({ data: { limit: 10, offset: 0 } })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('club')
      expect(result[0].club).toHaveProperty('name')
    })

    it('filters by clubId when provided', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const result = await getAllEvents({ data: { clubId: testClub.id } })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      result.forEach((run) => {
        expect(run.club.name).toBe(testClub.name)
      })
    })

    it('respects limit parameter', async () => {
      const result = await getAllEvents({ data: { limit: 1, offset: 0 } })
      expect(result.length).toBe(1)
    })

    it('orders runs by date ascending', async () => {
      const result = await getAllEvents({ data: { limit: 10, offset: 0 } })

      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          const prevDate = new Date(result[i - 1].date)
          const currDate = new Date(result[i].date)
          expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime())
        }
      }
    })
  })

  describe('createEvent', () => {
    it('creates a new run', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      if (!testClub) {
        throw new Error('No test club found - seeding may have failed')
      }

      const runData = {
        title: 'Integration Test Run',
        description: 'A run created in integration test',
        date: '2025-02-15',
        time: '07:30',
        address: '456 Integration Ave, Quebec City',
        distance: '8km',
        pace: '5:15/km',
        clubId: testClub.id,
      }

      const result = await createEvent({
        user: { id: testUserId, isAdmin: false },
        data: runData,
      })

      expect(result).toBeDefined()
      expect(result.title).toBe(runData.title)
      expect(result.description).toBe(runData.description)
      expect(result.time).toBe(runData.time)
      expect(result.address).toBe(runData.address)
      expect(result.distance).toBe(runData.distance)
      expect(result.pace).toBe(runData.pace)
      expect(result.clubId).toBe(runData.clubId)
      expect(result.id).toBeDefined()
      expect(result.club).toBeDefined()
      expect(result.club.name).toBe(testClub.name)

      // Verify it was actually created in database
      const dbEvent = await testPrisma.event.findUnique({
        where: { id: result.id },
        include: { club: true },
      })
      assert(dbEvent)
      expect(dbEvent.title).toBe(runData.title)
      expect(dbEvent.club.id).toBe(testClub.id)
    })

    it('includes club information in response', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const runData = {
        title: 'Test Run with Club Info',
        date: '2025-03-01',
        time: '18:00',
        address: '789 Test Blvd',
        clubId: testClub.id,
      }

      const result = await createEvent({
        user: { id: testUserId, isAdmin: false },
        data: runData,
      })

      expect(result.club).toBeDefined()
      expect(result.club.id).toBe(testClub.id)
      expect(result.club.name).toBe(testClub.name)
    })
  })

  describe('updateEvent', () => {
    it('updates event when user is admin', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const adminUser = await testPrisma.user.create({
        data: { email: 'admin@test.com', isAdmin: true },
      })

      const event = await testPrisma.event.create({
        data: {
          title: 'Old Title',
          date: new Date('2025-12-01'),
          time: '10:00',
          address: 'Old Address',
          clubId: testClub.id,
        },
      })

      const result = await updateEvent({
        user: { id: adminUser.id, isAdmin: true },
        data: {
          id: event.id,
          title: 'New Title',
          date: '2025-12-02',
          time: '11:00',
          address: 'New Address',
          clubId: testClub.id,
        },
      })

      expect(result.title).toBe('New Title')
      expect(result.address).toBe('New Address')
    })

    it('updates event when user owns the club', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await testPrisma.event.create({
        data: {
          title: 'Old Title',
          date: new Date('2025-12-01'),
          time: '10:00',
          address: 'Address',
          clubId: testClub.id,
        },
      })

      const result = await updateEvent({
        user: { id: testUserId, isAdmin: false },
        data: {
          id: event.id,
          title: 'New Title',
          date: '2025-12-02',
          time: '11:00',
          address: 'Address',
          clubId: testClub.id,
        },
      })

      expect(result.title).toBe('New Title')
    })

    it('throws error when user does not own club and is not admin', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const otherUser = await testPrisma.user.create({
        data: { email: 'other@test.com', isAdmin: false },
      })

      const event = await testPrisma.event.create({
        data: {
          title: 'Title',
          date: new Date('2025-12-01'),
          time: '10:00',
          address: 'Address',
          clubId: testClub.id,
        },
      })

      await expect(
        updateEvent({
          user: { id: otherUser.id, isAdmin: false },
          data: {
            id: event.id,
            title: 'New Title',
            date: '2025-12-02',
            time: '11:00',
            address: 'Address',
            clubId: testClub.id,
          },
        })
      ).rejects.toThrow('Unauthorized')
    })
  })
})
