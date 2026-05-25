import { describe, it, expect, beforeEach, afterEach, assert, vi } from 'vitest'
import { seedTestData, testPrisma, teardownTestData } from '@/lib/test-seed'
import {
  getAllEvents,
  getEventLocations,
  getEventById,
  getEventByClubAndSlug,
  getNextOccurrenceDate,
  createEvent,
  updateEvent,
  deleteEvent,
} from './events'
import { geocodeAddress } from './geocoding'
import { addDays } from 'date-fns'

vi.mock('./geocoding')

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
        expect(run.club).not.toBeNull()
        expect(run.club!.name).toBe(testClub.name)
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
        user: { id: testUserId, isStaff: false },
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
      expect(result.club).not.toBeNull()
      expect(result.club!.name).toBe(testClub.name)

      // Verify it was actually created in database
      const dbEvent = await testPrisma.event.findUnique({
        where: { id: result.id },
        include: { club: true },
      })
      assert(dbEvent)
      expect(dbEvent.title).toBe(runData.title)
      expect(dbEvent.club).not.toBeNull()
      expect(dbEvent.club!.id).toBe(testClub.id)
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
        user: { id: testUserId, isStaff: false },
        data: runData,
      })

      expect(result.club).not.toBeNull()
      expect(result.club!.id).toBe(testClub.id)
      expect(result.club!.name).toBe(testClub.name)
    })
  })

  describe('updateEvent', () => {
    it('updates event when user is admin', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const adminUser = await testPrisma.user.create({
        data: { email: 'admin@test.com', isStaff: true },
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
        user: { id: adminUser.id, isStaff: true },
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
        user: { id: testUserId, isStaff: false },
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
        data: { email: 'other@test.com', isStaff: false },
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
          user: { id: otherUser.id, isStaff: false },
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
        data: { email: 'admin2@test.com', isStaff: true },
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
        user: { id: adminUser.id, isStaff: true },
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
        user: { id: testUserId, isStaff: false },
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
        data: { email: 'other2@test.com', isStaff: false },
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
          user: { id: otherUser.id, isStaff: false },
          data: { id: event.id },
        })
      ).rejects.toThrow('Unauthorized')
    })
  })

  describe('createEvent with geocoding', () => {
    it('geocodes address on event create', async () => {
      vi.mocked(geocodeAddress).mockResolvedValueOnce({
        lat: 46.8139,
        lng: -71.208,
      })

      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await createEvent({
        user: { id: testUserId, isStaff: false },
        data: {
          title: 'Test Event',
          date: '2025-12-01',
          time: '18:00',
          address: '123 Rue Principale, Quebec City, QC',
          clubId: testClub.id,
        },
      })

      expect(geocodeAddress).toHaveBeenCalledWith(
        '123 Rue Principale, Quebec City, QC'
      )
      expect(event.latitude).toBe(46.8139)
      expect(event.longitude).toBe(-71.208)
      expect(event.geocodedAt).toBeInstanceOf(Date)
    })

    it('saves event without coords if geocoding fails', async () => {
      vi.mocked(geocodeAddress).mockResolvedValueOnce(null)

      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await createEvent({
        user: { id: testUserId, isStaff: false },
        data: {
          title: 'Test Event',
          date: '2025-12-01',
          time: '18:00',
          address: 'Invalid Address',
          clubId: testClub.id,
        },
      })

      expect(event.latitude).toBeNull()
      expect(event.longitude).toBeNull()
      expect(event.geocodedAt).toBeNull()
    })
  })

  describe('updateEvent with geocoding', () => {
    it('re-geocodes when address changes', async () => {
      vi.mocked(geocodeAddress).mockResolvedValueOnce({
        lat: 45.5017,
        lng: -73.5673,
      })

      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await testPrisma.event.create({
        data: {
          title: 'Test Event',
          date: new Date('2025-12-01'),
          time: '18:00',
          address: 'Old Address',
          latitude: 46.8139,
          longitude: -71.208,
          geocodedAt: new Date(),
          clubId: testClub.id,
        },
      })

      const updated = await updateEvent({
        user: { id: testUserId, isStaff: false },
        data: {
          id: event.id,
          address: 'New Address, Montreal',
          clubId: testClub.id,
        },
      })

      expect(geocodeAddress).toHaveBeenCalledWith('New Address, Montreal')
      expect(updated.latitude).toBe(45.5017)
      expect(updated.longitude).toBe(-73.5673)
    })

    it('does not re-geocode if address unchanged', async () => {
      vi.mocked(geocodeAddress).mockClear()

      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await testPrisma.event.create({
        data: {
          title: 'Test Event',
          date: new Date('2025-12-01'),
          time: '18:00',
          address: 'Same Address',
          latitude: 46.8139,
          longitude: -71.208,
          geocodedAt: new Date(),
          clubId: testClub.id,
        },
      })

      await updateEvent({
        user: { id: testUserId, isStaff: false },
        data: {
          id: event.id,
          title: 'Updated Title',
          clubId: testClub.id,
        },
      })

      expect(geocodeAddress).not.toHaveBeenCalled()
    })
  })

  describe('getEventById', () => {
    it('returns a concrete event by ID', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const event = await testPrisma.event.create({
        data: {
          title: 'Concrete Event',
          date: new Date('2025-12-01'),
          time: '18:00',
          address: '123 Main St',
          clubId: testClub.id,
        },
      })

      const result = await getEventById({ data: { id: event.id } })

      expect(result!.id).toBe(event.id)
      expect(result!.title).toBe('Concrete Event')
      expect(result!.club).not.toBeNull()
      expect(result!.club!.slug).toBe(testClub.slug)
    })

    it('returns a virtual event for slug-based ID (slug--date)', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      const recurring = await testPrisma.recurringEvent.create({
        data: {
          title: 'Weekly Run',
          slug: 'weekly-run',
          description: 'A recurring run',
          address: '456 Park Ave',
          distance: '10km',
          pace: '5:30/km',
          clubId: testClub.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      const result = await getEventById({
        data: { id: `${recurring.slug}--2026-03-13` },
      })

      expect(result!.id).toBe(`${testClub.slug}-weekly-run--2026-03-13`)
      expect(result!.title).toBe('Weekly Run')
      expect(result!.description).toBe('A recurring run')
      expect(result!.address).toBe('456 Park Ave')
      expect(result!.distance).toBe('10km')
      expect(result!.pace).toBe('5:30/km')
      expect(result!.time).toBe('18:00')
      expect(result!.club).not.toBeNull()
      expect(result!.club!.name).toBe(testClub.name)
      expect(result!.club!.slug).toBe(testClub.slug)
    })

    it('returns null for non-existent virtual event', async () => {
      const result = await getEventById({
        data: { id: 'non-existent-slug--2026-03-13' },
      })
      expect(result).toBeNull()
    })

    it('returns null for non-existent concrete event', async () => {
      const result = await getEventById({
        data: { id: 'non-existent-id' },
      })
      expect(result).toBeNull()
    })
  })

  describe('getEventByClubAndSlug', () => {
    it('returns a virtual event for a valid (club, slug, date) on a rrule day', async () => {
      const club = (await testPrisma.club.findMany())[0]
      const recurring = await testPrisma.recurringEvent.create({
        data: {
          title: 'Mardi run',
          slug: 'mardi',
          description: 'Tuesday weekly',
          clubId: club.id,
          // Tuesday 18:00
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      // 2026-05-19 is a Tuesday
      const result = await getEventByClubAndSlug({
        data: { clubSlug: club.slug, eventSlug: 'mardi', date: '2026-05-19' },
      })

      expect(result).not.toBeNull()
      expect(result!.title).toBe('Mardi run')
      expect(result!.club!.slug).toBe(club.slug)
      expect(result!.recurringEventId).toBe(recurring.id)
    })

    it('prefers a concrete override row over the virtual occurrence', async () => {
      const club = (await testPrisma.club.findMany())[0]
      const recurring = await testPrisma.recurringEvent.create({
        data: {
          title: 'Mardi run',
          slug: 'mardi-override',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })
      await testPrisma.event.create({
        data: {
          title: 'Special Mardi (overridden)',
          date: new Date('2026-05-19T12:00:00'),
          time: '19:00',
          clubId: club.id,
          recurringEventId: recurring.id,
        },
      })

      const result = await getEventByClubAndSlug({
        data: {
          clubSlug: club.slug,
          eventSlug: 'mardi-override',
          date: '2026-05-19',
        },
      })

      expect(result!.title).toBe('Special Mardi (overridden)')
      expect(result!.time).toBe('19:00')
    })

    it('returns null when the date is not produced by the rrule', async () => {
      const club = (await testPrisma.club.findMany())[0]
      await testPrisma.recurringEvent.create({
        data: {
          title: 'Mardi only',
          slug: 'mardi-only',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      // 2026-05-20 is a Wednesday — not produced by BYDAY=TU
      const result = await getEventByClubAndSlug({
        data: {
          clubSlug: club.slug,
          eventSlug: 'mardi-only',
          date: '2026-05-20',
        },
      })

      expect(result).toBeNull()
    })

    it('returns null when the club does not exist', async () => {
      const result = await getEventByClubAndSlug({
        data: {
          clubSlug: 'no-such-club',
          eventSlug: 'mardi',
          date: '2026-05-19',
        },
      })
      expect(result).toBeNull()
    })

    it('returns null when the event slug does not exist under that club', async () => {
      const club = (await testPrisma.club.findMany())[0]
      const result = await getEventByClubAndSlug({
        data: {
          clubSlug: club.slug,
          eventSlug: 'no-such-slug',
          date: '2026-05-19',
        },
      })
      expect(result).toBeNull()
    })
  })

  describe('getNextOccurrenceDate', () => {
    it('returns the next future occurrence for a known club + slug', async () => {
      const club = (await testPrisma.club.findMany())[0]
      await testPrisma.recurringEvent.create({
        data: {
          title: 'Mardi run',
          slug: 'mardi-next',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      const next = await getNextOccurrenceDate({
        data: { clubSlug: club.slug, eventSlug: 'mardi-next' },
      })

      expect(next).not.toBeNull()
      expect(next!.getUTCDay()).toBe(2) // Tuesday
      expect(next!.getTime()).toBeGreaterThan(Date.now())
    })

    it('returns null for unknown club/slug', async () => {
      const result = await getNextOccurrenceDate({
        data: { clubSlug: 'nope', eventSlug: 'nope' },
      })
      expect(result).toBeNull()
    })
  })

  describe('getAllEvents with hybrid query', () => {
    it('returns hybrid events (concrete + virtual from recurring patterns)', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]

      // Count existing events before adding recurring pattern
      const existingEventsCount = await testPrisma.event.count()

      // Create recurring pattern (weekly on Tuesdays)
      const recurring = await testPrisma.recurringEvent.create({
        data: {
          title: 'Weekly Run',
          slug: 'weekly-run',
          address: '123 Main St',
          clubId: testClub.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      // Create one concrete event from the pattern
      const concreteDate = addDays(new Date(), 2)
      await testPrisma.event.create({
        data: {
          title: 'Weekly Run',
          date: concreteDate,
          time: '18:00',
          address: '123 Main St',
          clubId: testClub.id,
          recurringEventId: recurring.id,
        },
      })

      const result = await getAllEvents({ data: { limit: 50, offset: 0 } })

      // Should have more events than just concrete ones (virtual events expanded)
      // At minimum: existing events + 1 concrete + at least 1 virtual occurrence
      expect(result.length).toBeGreaterThan(existingEventsCount + 1)

      // Virtual events should have slug-based IDs (format: "slug--YYYY-MM-DD")
      const virtualEvents = result.filter((e) => e.id.includes('--'))
      expect(virtualEvents.length).toBeGreaterThan(0)
    })

    it('filters hybrid events by clubId at DB level', async () => {
      const clubs = await testPrisma.club.findMany()
      const testClub = clubs[0]
      const otherClub =
        clubs[1] ||
        (await testPrisma.club.create({
          data: {
            name: 'Other Club',
            slug: 'other-club',
            ownerId: await testPrisma.user.findFirst().then((u) => u!.id),
          },
        }))

      // Create recurring patterns for both clubs
      await testPrisma.recurringEvent.create({
        data: {
          title: 'Club 1 Weekly Run',
          slug: 'club-1-weekly-run',
          address: '123 Main St',
          clubId: testClub.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      await testPrisma.recurringEvent.create({
        data: {
          title: 'Club 2 Weekly Run',
          slug: 'club-2-weekly-run',
          address: '456 Other St',
          clubId: otherClub.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0',
          isActive: true,
        },
      })

      // Get events filtered by testClub
      const result = await getAllEvents({ data: { clubId: testClub.id } })

      // All returned events should belong to testClub
      expect(result.length).toBeGreaterThan(0)
      result.forEach((event) => {
        expect(event.clubId).toBe(testClub.id)
        expect(event.club?.id).toBe(testClub.id)
      })
    })
  })

  describe('getAllEvents filters', () => {
    it('resolves clubSlug to clubId', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      const result = await getAllEvents({ data: { clubSlug: club.slug } })

      expect(result.length).toBeGreaterThan(0)
      result.forEach((event) => expect(event.clubId).toBe(club.id))
    })

    it('returns empty array when clubSlug does not match a club', async () => {
      const result = await getAllEvents({
        data: { clubSlug: 'no-such-club-9999' },
      })
      expect(result).toEqual([])
    })

    it('filters by case-insensitive title match', async () => {
      const result = await getAllEvents({ data: { search: 'MORNING' } })
      expect(result.length).toBeGreaterThan(0)
      result.forEach((event) =>
        expect(event.title.toLowerCase()).toContain('morning')
      )
    })

    it('filters by address match', async () => {
      const result = await getAllEvents({ data: { search: 'jog avenue' } })
      expect(result.length).toBeGreaterThan(0)
      result.forEach((event) =>
        expect(event.address?.toLowerCase()).toContain('jog avenue')
      )
    })

    it('returns empty array when nothing matches search', async () => {
      const result = await getAllEvents({
        data: { search: 'absolutely-no-match-zzzzzzzz' },
      })
      expect(result).toEqual([])
    })

    it('filters by pacePolicy', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')
      const tomorrow = addDays(new Date(), 1)

      await testPrisma.event.create({
        data: {
          title: 'Flexible pace run',
          date: tomorrow,
          time: '18:00',
          address: '999 Flexible Way',
          clubId: club.id,
          pacePolicy: 'OPEN_PACE',
        },
      })

      const result = await getAllEvents({
        data: { pacePolicy: 'OPEN_PACE' },
      })
      expect(result.length).toBeGreaterThan(0)
      result.forEach((event) => expect(event.pacePolicy).toBe('OPEN_PACE'))
    })

    it('filters by morning time of day', async () => {
      const result = await getAllEvents({ data: { timeOfDay: 'morning' } })
      result.forEach((event) => {
        const hour = Number(event.time.split(':')[0])
        expect(hour).toBeLessThan(12)
      })
    })

    it('filters by evening time of day', async () => {
      const result = await getAllEvents({ data: { timeOfDay: 'evening' } })
      result.forEach((event) => {
        const hour = Number(event.time.split(':')[0])
        expect(hour).toBeGreaterThanOrEqual(17)
      })
    })

    it('filters by weekend', async () => {
      const result = await getAllEvents({ data: { weekend: '1' } })
      result.forEach((event) => {
        const day = event.date.getDay()
        expect([0, 6]).toContain(day)
      })
    })

    it('combines search and clubSlug filters', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      const result = await getAllEvents({
        data: { clubSlug: club.slug, search: 'morning' },
      })

      result.forEach((event) => {
        expect(event.clubId).toBe(club.id)
        expect(event.title.toLowerCase()).toContain('morning')
      })
    })
  })

  describe('getEventLocations', () => {
    it('collapses repeated occurrences into a single bucket per (club, address)', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      await testPrisma.recurringEvent.create({
        data: {
          title: 'Weekly Run',
          slug: 'weekly-run-loc',
          address: '500 Bucket Lane',
          latitude: 46.81,
          longitude: -71.22,
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      const result = await getEventLocations({ data: {} })

      const weeklyBuckets = result.filter((loc) => loc.title === 'Weekly Run')
      expect(weeklyBuckets.length).toBe(1)
      expect(weeklyBuckets[0].occurrenceCount).toBeGreaterThan(1)
      expect(weeklyBuckets[0].weekdays).toEqual([2])
    })

    it('separates buckets when the same club runs at different addresses', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      await testPrisma.recurringEvent.createMany({
        data: [
          {
            title: 'East Location',
            slug: 'east-location',
            address: '100 East St',
            latitude: 46.82,
            longitude: -71.23,
            clubId: club.id,
            schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=0',
            isActive: true,
          },
          {
            title: 'West Location',
            slug: 'west-location',
            address: '200 West St',
            latitude: 46.83,
            longitude: -71.25,
            clubId: club.id,
            schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
            isActive: true,
          },
        ],
      })

      const result = await getEventLocations({ data: {} })
      const sameClubBuckets = result.filter((loc) => loc.club.id === club.id)
      const eastBucket = sameClubBuckets.find(
        (loc) => loc.title === 'East Location'
      )
      const westBucket = sameClubBuckets.find(
        (loc) => loc.title === 'West Location'
      )
      expect(eastBucket).toBeDefined()
      expect(westBucket).toBeDefined()
      expect(eastBucket!.key).not.toBe(westBucket!.key)
    })

    it('sorts buckets by next occurrence date', async () => {
      const result = await getEventLocations({ data: {} })
      for (let i = 1; i < result.length; i++) {
        expect(result[i].next.date.getTime()).toBeGreaterThanOrEqual(
          result[i - 1].next.date.getTime()
        )
      }
    })

    it('applies search filter at the bucket level', async () => {
      const result = await getEventLocations({
        data: { search: 'absolutely-no-match-zzz' },
      })
      expect(result).toEqual([])
    })

    it('applies pacePolicy filter at the bucket level', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')
      const tomorrow = addDays(new Date(), 1)

      await testPrisma.event.create({
        data: {
          title: 'Open Pace Run',
          date: tomorrow,
          time: '18:00',
          address: '777 Flex Way',
          latitude: 46.85,
          longitude: -71.27,
          clubId: club.id,
          pacePolicy: 'OPEN_PACE',
        },
      })

      const result = await getEventLocations({
        data: { pacePolicy: 'OPEN_PACE' },
      })
      expect(result.length).toBeGreaterThan(0)
      result.forEach((loc) => expect(loc.next.pacePolicy).toBe('OPEN_PACE'))
    })
  })
})
