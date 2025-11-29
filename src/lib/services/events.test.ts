import { describe, it, expect, beforeEach, afterEach, assert } from 'vitest'
import { seedTestData, testPrisma, teardownTestData } from '@/lib/test-seed'
import {
  getAllEvents,
  getAllEventsForAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
} from './events'
import { UnauthorizedError } from '@/lib/errors'
import type { User, Club } from '@prisma/client'

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

  describe('deleteEvent', () => {
    it('deletes event when user is admin', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const adminUser = await testPrisma.user.create({
        data: { email: 'admin2@test.com', isAdmin: true },
      })

      const event = await testPrisma.event.create({
        data: {
          title: 'Event',
          date: new Date('2025-12-01'),
          time: '10:00',
          address: 'Address',
          clubId: testClub.id,
        },
      })

      await deleteEvent({
        user: { id: adminUser.id, isAdmin: true },
        data: { id: event.id },
      })

      const deleted = await testPrisma.event.findUnique({
        where: { id: event.id },
      })
      expect(deleted).toBeNull()
    })

    it('deletes event when user owns the club', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await testPrisma.event.create({
        data: {
          title: 'Event',
          date: new Date('2025-12-01'),
          time: '10:00',
          address: 'Address',
          clubId: testClub.id,
        },
      })

      await deleteEvent({
        user: { id: testUserId, isAdmin: false },
        data: { id: event.id },
      })

      const deleted = await testPrisma.event.findUnique({
        where: { id: event.id },
      })
      expect(deleted).toBeNull()
    })

    it('throws error when user unauthorized', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const otherUser = await testPrisma.user.create({
        data: { email: 'other2@test.com', isAdmin: false },
      })

      const event = await testPrisma.event.create({
        data: {
          title: 'Event',
          date: new Date('2025-12-01'),
          time: '10:00',
          address: 'Address',
          clubId: testClub.id,
        },
      })

      await expect(
        deleteEvent({
          user: { id: otherUser.id, isAdmin: false },
          data: { id: event.id },
        })
      ).rejects.toThrow('Unauthorized')
    })
  })

  describe('getAllEvents with filtering', () => {
    beforeEach(async () => {
      await testPrisma.event.deleteMany()
      await testPrisma.club.deleteMany()
      await testPrisma.user.deleteMany()

      const user = await testPrisma.user.create({
        data: { email: 'owner@test.com', name: 'Owner' },
      })

      const club1 = await testPrisma.club.create({
        data: {
          name: 'Montreal Runners',
          slug: 'montreal-runners',
          ownerId: user.id,
        },
      })

      const club2 = await testPrisma.club.create({
        data: {
          name: 'Quebec Joggers',
          slug: 'quebec-joggers',
          ownerId: user.id,
        },
      })

      // Future event 1 - Montreal
      await testPrisma.event.create({
        data: {
          title: 'Montreal Morning Run',
          date: new Date('2025-12-15'),
          time: '08:00',
          address: '123 Montreal Street',
          clubId: club1.id,
        },
      })

      // Future event 2 - Quebec
      await testPrisma.event.create({
        data: {
          title: 'Quebec Trail Run',
          date: new Date('2025-12-20'),
          time: '09:00',
          address: '456 Quebec Avenue',
          clubId: club2.id,
        },
      })

      // Past event (should be excluded)
      await testPrisma.event.create({
        data: {
          title: 'Past Event',
          date: new Date('2020-01-01'),
          time: '10:00',
          clubId: club1.id,
        },
      })
    })

    it('filters by search term matching title', async () => {
      const result = await getAllEvents({ data: { search: 'Montreal' } })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Montreal Morning Run')
    })

    it('filters by search term matching address', async () => {
      const result = await getAllEvents({ data: { search: 'Quebec Avenue' } })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Quebec Trail Run')
    })

    it('filters by search term case-insensitive', async () => {
      const result = await getAllEvents({ data: { search: 'MONTREAL' } })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Montreal Morning Run')
    })

    it('filters by clubId', async () => {
      const club = await testPrisma.club.findFirst({
        where: { slug: 'montreal-runners' },
      })
      const result = await getAllEvents({ data: { clubId: club!.id } })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Montreal Morning Run')
    })

    it('filters by dateFrom', async () => {
      const result = await getAllEvents({
        data: { dateFrom: '2025-12-18T00:00:00Z' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Quebec Trail Run')
    })

    it('filters by dateFrom and dateTo range', async () => {
      const result = await getAllEvents({
        data: {
          dateFrom: '2025-12-14T00:00:00Z',
          dateTo: '2025-12-16T00:00:00Z',
        },
      })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Montreal Morning Run')
    })

    it('combines multiple filters', async () => {
      const club = await testPrisma.club.findFirst({
        where: { slug: 'montreal-runners' },
      })
      const result = await getAllEvents({
        data: { search: 'Montreal', clubId: club!.id },
      })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Montreal Morning Run')
    })

    it('returns empty array when no matches', async () => {
      const result = await getAllEvents({ data: { search: 'NonExistent' } })
      expect(result).toHaveLength(0)
    })

    it('excludes past events even with filters', async () => {
      const result = await getAllEvents({ data: { search: 'Past' } })
      expect(result).toHaveLength(0)
    })

    it('sorts by date ascending by default', async () => {
      const result = await getAllEvents({ data: {} })
      expect(result[0].title).toBe('Montreal Morning Run')
      expect(result[1].title).toBe('Quebec Trail Run')
    })

    it('sorts by date descending when specified', async () => {
      const result = await getAllEvents({
        data: { sortBy: 'date', sortOrder: 'desc' },
      })
      expect(result[0].title).toBe('Quebec Trail Run')
      expect(result[1].title).toBe('Montreal Morning Run')
    })

    it('enforces today boundary even when dateFrom is in past', async () => {
      const result = await getAllEvents({
        data: {
          dateFrom: '2020-01-01T00:00:00Z',
          dateTo: '2020-12-31T23:59:59Z',
        },
      })
      expect(result).toHaveLength(0)
    })
  })

  describe('getAllEventsForAdmin', () => {
    let adminUser: User
    let regularUser: User
    let club: Club

    beforeEach(async () => {
      await testPrisma.event.deleteMany()
      await testPrisma.club.deleteMany()
      await testPrisma.user.deleteMany()

      adminUser = await testPrisma.user.create({
        data: { email: 'admin@test.com', name: 'Admin', isAdmin: true },
      })

      regularUser = await testPrisma.user.create({
        data: { email: 'user@test.com', name: 'User', isAdmin: false },
      })

      club = await testPrisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: adminUser.id,
        },
      })

      // Past event
      await testPrisma.event.create({
        data: {
          title: 'Past Event',
          date: new Date('2020-01-01'),
          time: '10:00',
          address: 'Past Location',
          clubId: club.id,
        },
      })

      // Future event
      await testPrisma.event.create({
        data: {
          title: 'Future Event',
          date: new Date('2025-12-15'),
          time: '09:00',
          address: 'Future Location',
          clubId: club.id,
        },
      })
    })

    it('throws UnauthorizedError for non-admin users', async () => {
      await expect(
        getAllEventsForAdmin({ user: regularUser, data: {} })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('returns all events including past for admin', async () => {
      const result = await getAllEventsForAdmin({ user: adminUser, data: {} })
      expect(result).toHaveLength(2)
      expect(result.some((e) => e.title === 'Past Event')).toBe(true)
      expect(result.some((e) => e.title === 'Future Event')).toBe(true)
    })

    it('filters by search term', async () => {
      const result = await getAllEventsForAdmin({
        user: adminUser,
        data: { search: 'Past' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Past Event')
    })

    it('filters by clubId', async () => {
      const result = await getAllEventsForAdmin({
        user: adminUser,
        data: { clubId: club.id },
      })
      expect(result).toHaveLength(2)
    })

    it('sorts by date descending by default for admin', async () => {
      const result = await getAllEventsForAdmin({ user: adminUser, data: {} })
      expect(result[0].title).toBe('Future Event') // More recent first
      expect(result[1].title).toBe('Past Event')
    })
  })
})
