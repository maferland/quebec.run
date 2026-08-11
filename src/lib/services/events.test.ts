import { describe, it, expect, beforeEach, afterEach, assert, vi } from 'vitest'
import { seedTestData, testPrisma, teardownTestData } from '@/lib/test-seed'
import {
  getAllEvents,
  getCalendarListing,
  getEventLocations,
  getEventById,
  getEventByClubAndSlug,
  getNextOccurrenceDate,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsForDay,
  getWeekEventCounts,
  getTorontoDayBounds,
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

    it('derives a slug from the title, counting up past collisions', async () => {
      const testClub = (await testPrisma.club.findMany())[0]
      const runData = {
        title: 'Sortie Limonade Sunrise',
        date: '2025-04-01',
        time: '18:00',
        clubId: testClub.id,
      }

      const first = await createEvent({
        user: { id: testUserId, isStaff: false },
        data: runData,
      })
      const second = await createEvent({
        user: { id: testUserId, isStaff: false },
        data: runData,
      })

      expect(first.slug).toBe('sortie-limonade-sunrise')
      expect(second.slug).toBe('sortie-limonade-sunrise-2')
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

    it('resolves a one-off event by its slug', async () => {
      const testClub = (await testPrisma.club.findMany())[0]
      const event = await testPrisma.event.create({
        data: {
          title: 'Sortie spéciale',
          slug: 'sortie-speciale',
          date: new Date('2025-12-01'),
          time: '18:00',
          clubId: testClub.id,
        },
      })

      const bySlug = await getEventById({ data: { id: 'sortie-speciale' } })
      const byId = await getEventById({ data: { id: event.id } })

      expect(bySlug!.id).toBe(event.id)
      expect(byId!.id).toBe(event.id)
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

      const { buckets } = await getEventLocations({ data: {} })
      const weeklyBuckets = buckets.filter((loc) => loc.title === 'Weekly Run')
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

      const { buckets } = await getEventLocations({ data: {} })
      const sameClubBuckets = buckets.filter((loc) => loc.club.id === club.id)
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
      const { buckets } = await getEventLocations({ data: {} })
      for (let i = 1; i < buckets.length; i++) {
        expect(buckets[i].next.date.getTime()).toBeGreaterThanOrEqual(
          buckets[i - 1].next.date.getTime()
        )
      }
    })

    it('applies search filter at the bucket level', async () => {
      const { buckets, overrides } = await getEventLocations({
        data: { search: 'absolutely-no-match-zzz' },
      })
      expect(buckets).toEqual([])
      expect(overrides).toEqual([])
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

      const { buckets } = await getEventLocations({
        data: { pacePolicy: 'OPEN_PACE' },
      })
      expect(buckets.length).toBeGreaterThan(0)
      buckets.forEach((loc) => expect(loc.next.pacePolicy).toBe('OPEN_PACE'))
    })

    it('lifts events whose title differs from the bucket into overrides', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      const pattern = await testPrisma.recurringEvent.create({
        data: {
          title: 'Steady Run',
          slug: 'steady-run-override-test',
          address: '900 Override Way',
          latitude: 46.86,
          longitude: -71.28,
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=18;BYMINUTE=0',
          isActive: true,
        },
      })

      const targetDate = addDays(new Date(), 10)
      await testPrisma.event.create({
        data: {
          title: 'Pizza Run',
          date: targetDate,
          time: '18:00',
          address: '900 Override Way',
          latitude: 46.86,
          longitude: -71.28,
          clubId: club.id,
          recurringEventId: pattern.id,
        },
      })

      const { buckets, overrides } = await getEventLocations({ data: {} })
      const steadyBucket = buckets.find((b) => b.title === 'Steady Run')
      expect(steadyBucket).toBeDefined()
      expect(overrides.some((o) => o.title === 'Pizza Run')).toBe(true)
      expect(steadyBucket!.next.title).toBe('Steady Run')
    })

    it('returns facet counts for the four facets', async () => {
      const { facetCounts } = await getEventLocations({ data: {} })
      expect(facetCounts).toEqual(
        expect.objectContaining({
          openPace: expect.any(Number),
          morning: expect.any(Number),
          evening: expect.any(Number),
          weekend: expect.any(Number),
        })
      )
    })

    it('counts a facet as if it were added on top of current filters', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      const saturday = addDays(
        new Date(),
        (6 - new Date().getDay() + 7) % 7 || 7
      )
      await testPrisma.event.create({
        data: {
          title: 'Saturday Evening Run',
          date: saturday,
          time: '18:00',
          address: '500 Facet Way',
          latitude: 46.85,
          longitude: -71.27,
          clubId: club.id,
        },
      })

      const eveningOnly = await getEventLocations({
        data: { timeOfDay: 'evening' },
      })
      const withWeekendAdded = await getEventLocations({
        data: { timeOfDay: 'evening', weekend: '1' },
      })

      expect(eveningOnly.facetCounts.weekend).toBe(
        withWeekendAdded.buckets.length + withWeekendAdded.overrides.length
      )
    })

    it('reports zero counts when nothing matches the current filter', async () => {
      const { facetCounts } = await getEventLocations({
        data: { search: 'absolutely-no-match-zzz' },
      })
      expect(facetCounts.openPace).toBe(0)
      expect(facetCounts.morning).toBe(0)
      expect(facetCounts.evening).toBe(0)
      expect(facetCounts.weekend).toBe(0)
    })

    it('returns zero counts when clubSlug does not resolve to a club', async () => {
      const { facetCounts } = await getEventLocations({
        data: { clubSlug: 'no-such-club-xyz' },
      })
      expect(facetCounts).toEqual({
        openPace: 0,
        morning: 0,
        evening: 0,
        weekend: 0,
        social: 0,
        training: 0,
        beginner: 0,
        showPast: 0,
      })
    })

    it('honors the search filter when computing facet counts', async () => {
      const club = await testPrisma.club.findFirst()
      assert(club, 'expected seeded club')

      // Two recurring patterns at distinct addresses; only one matches the search
      await testPrisma.recurringEvent.createMany({
        data: [
          {
            title: 'Search-Match Run',
            slug: 'search-facet-match',
            address: '111 Match Way',
            latitude: 46.9,
            longitude: -71.3,
            clubId: club.id,
            schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=7;BYMINUTE=0',
            isActive: true,
          },
          {
            title: 'Other Run',
            slug: 'search-facet-other',
            address: '222 Other Lane',
            latitude: 46.91,
            longitude: -71.31,
            clubId: club.id,
            schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=7;BYMINUTE=0',
            isActive: true,
          },
        ],
      })

      const { facetCounts } = await getEventLocations({
        data: { search: 'Search-Match' },
      })
      // Morning matches only the search-filtered bucket (7am = morning)
      expect(facetCounts.morning).toBe(1)
    })
  })

  describe('getCalendarListing', () => {
    it('returns events + facet counts shaped for the calendar surface', async () => {
      const { events, facetCounts } = await getCalendarListing({ data: {} })

      expect(events.length).toBeGreaterThan(0)
      // Seed has one 07:00 and one 18:00 event → morning + evening each ≥ 1
      expect(facetCounts.morning).toBeGreaterThanOrEqual(1)
      expect(facetCounts.evening).toBeGreaterThanOrEqual(1)
    })

    it('filters events by search term against title and address', async () => {
      const { events } = await getCalendarListing({
        data: { search: 'morning' },
      })
      expect(events.length).toBeGreaterThan(0)
      events.forEach((event) =>
        expect(event.title.toLowerCase()).toContain('morning')
      )
    })

    it('returns empty events but defined facet counts when no match', async () => {
      const { events, facetCounts } = await getCalendarListing({
        data: { search: 'absolutely-no-match-zzzz' },
      })
      expect(events).toEqual([])
      // Facet counts still computed against the underlying event stream
      // (independent of the active search filter)
      expect(facetCounts.morning).toBeGreaterThanOrEqual(0)
    })

    it('returns empty listing when clubSlug does not resolve', async () => {
      const result = await getCalendarListing({
        data: { clubSlug: 'no-such-club-zzzz' },
      })
      expect(result.events).toEqual([])
      expect(result.facetCounts).toEqual({
        openPace: 0,
        morning: 0,
        evening: 0,
        weekend: 0,
        social: 0,
        training: 0,
        beginner: 0,
        showPast: 0,
      })
    })

    it('applies weekend filter', async () => {
      const { events } = await getCalendarListing({ data: { weekend: '1' } })
      events.forEach((event) => {
        const day = event.date.getDay()
        expect([0, 6]).toContain(day)
      })
    })
  })

  describe('getEventsForDay', () => {
    it('returns runs for the correct day offset', async () => {
      // Seed creates "Morning Test Run" at offset +1 (tomorrow)
      const runs = await getEventsForDay(1)
      expect(runs.length).toBeGreaterThanOrEqual(1)
      const titles = runs.map((r) => r.title)
      expect(titles).toContain('Morning Test Run')
    })

    it('returns empty array when no events fall on the given offset', async () => {
      // Seed has nothing on day 0 (today)
      const runs = await getEventsForDay(0)
      expect(runs).toEqual([])
    })

    it('returns ExploreRun shape', async () => {
      const runs = await getEventsForDay(1)
      expect(runs.length).toBeGreaterThan(0)
      const run = runs[0]
      expect(run).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        time: expect.any(String),
        status: expect.stringMatching(/^(SCHEDULED|CANCELLED)$/),
        isPast: expect.any(Boolean),
        club: expect.objectContaining({
          id: expect.any(String),
          slug: expect.any(String),
          name: expect.any(String),
        }),
      })
    })

    it('does not return events from a different day', async () => {
      // Day 2 has "Evening Test Run", day 1 should not contain it
      const day1 = await getEventsForDay(1)
      const day2 = await getEventsForDay(2)
      const day1Titles = day1.map((r) => r.title)
      const day2Titles = day2.map((r) => r.title)
      expect(day1Titles).not.toContain('Evening Test Run')
      expect(day2Titles).toContain('Evening Test Run')
    })

    it('hands out the slug as the run id when a one-off has one', async () => {
      const testClub = (await testPrisma.club.findMany())[0]
      await testPrisma.event.create({
        data: {
          title: 'Sortie Limonade',
          slug: 'sortie-limonade',
          date: getTorontoDayBounds(3).start,
          time: '18:00',
          clubId: testClub.id,
        },
      })

      const runs = await getEventsForDay(3)

      expect(runs.map((run) => run.id)).toContain('sortie-limonade')
    })

    it("carries a one-off's own pace instead of only the club's range", async () => {
      const testClub = (await testPrisma.club.findMany())[0]
      await testPrisma.event.create({
        data: {
          title: 'Sortie 6:30',
          slug: 'sortie-six-trente',
          date: getTorontoDayBounds(4).start,
          time: '18:00',
          pace: '6:30',
          clubId: testClub.id,
        },
      })

      const runs = await getEventsForDay(4)

      expect(runs.find((run) => run.id === 'sortie-six-trente')?.pace).toBe(
        '6:30'
      )
    })

    it("carries a one-off's place name", async () => {
      const testClub = (await testPrisma.club.findMany())[0]
      await testPrisma.event.create({
        data: {
          title: 'Sortie Café',
          slug: 'sortie-cafe',
          date: getTorontoDayBounds(5).start,
          time: '18:00',
          address: '100 Rue Principale',
          placeName: 'Café Central',
          clubId: testClub.id,
        },
      })

      const runs = await getEventsForDay(5)

      expect(runs.find((run) => run.id === 'sortie-cafe')?.placeName).toBe(
        'Café Central'
      )
    })
  })

  describe('getTorontoDayBounds', () => {
    it.each([
      {
        name: 'spring DST transition',
        now: '2026-03-08T12:00:00Z',
        start: '2026-03-08T05:00:00.000Z',
        end: '2026-03-09T03:59:59.999Z',
        hours: 23,
      },
      {
        name: 'fall DST transition',
        now: '2026-11-01T12:00:00Z',
        start: '2026-11-01T04:00:00.000Z',
        end: '2026-11-02T04:59:59.999Z',
        hours: 25,
      },
    ])(
      'returns the full $hours-hour $name day',
      ({ now, start, end, hours }) => {
        const bounds = getTorontoDayBounds(0, new Date(now))

        expect(bounds.start.toISOString()).toBe(start)
        expect(bounds.end.toISOString()).toBe(end)
        expect(bounds.end.getTime() - bounds.start.getTime() + 1).toBe(
          hours * 60 * 60 * 1000
        )
      }
    )
  })

  describe('getWeekEventCounts', () => {
    it('returns exactly 7 entries', async () => {
      const counts = await getWeekEventCounts()
      expect(counts).toHaveLength(7)
    })

    it('entries have day (0-6) and count shape', async () => {
      const counts = await getWeekEventCounts()
      counts.forEach(({ day, count }) => {
        expect(day).toBeGreaterThanOrEqual(0)
        expect(day).toBeLessThanOrEqual(6)
        expect(typeof count).toBe('number')
        expect(count).toBeGreaterThanOrEqual(0)
      })
    })

    it('reflects seed data counts', async () => {
      const counts = await getWeekEventCounts()
      const byDay = Object.fromEntries(
        counts.map(({ day, count }) => [day, count])
      )
      // Seed has 1 event at offset 1 and 1 event at offset 2
      expect(byDay[1]).toBe(1)
      expect(byDay[2]).toBe(1)
      expect(byDay[0]).toBe(0)
    })
  })
})
