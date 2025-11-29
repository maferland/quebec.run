// src/lib/services/strava-sync.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { syncStravaClub } from './strava-sync'
import { testPrisma, teardownTestData } from '@/lib/test-seed'
import * as stravaService from './strava'

// Mock only the API calls, not the mappers
vi.mock('./strava', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof stravaService
  return {
    ...actual,
    fetchStravaClub: vi.fn(),
    fetchStravaEvents: vi.fn(),
  }
})

describe('syncStravaClub', () => {
  let testUserId: string

  beforeEach(async () => {
    vi.clearAllMocks()
    await testPrisma.event.deleteMany()
    await testPrisma.club.deleteMany()
    await testPrisma.user.deleteMany()

    // Create test user for all tests
    const user = await testPrisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })
    testUserId = user.id
  })

  afterEach(async () => {
    await teardownTestData()
  })

  test('syncs club and creates events', async () => {
    // Create test club
    const club = await testPrisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        ownerId: testUserId,
      },
    })

    // Mock Strava responses
    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'Updated Club Name',
      description: 'Updated description',
      url: 'https://strava.com/clubs/test',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      profile: 'photo.jpg',
      cover_photo: 'cover.jpg',
      cover_photo_small: 'cover-small.jpg',
    })

    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([
      {
        id: 1,
        title: 'Morning Run',
        description: 'Test run',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
        route: { distance: 5000 },
      },
    ])

    // Sync
    const result = await syncStravaClub(club.id)

    // Verify club updated
    const updatedClub = await testPrisma.club.findUnique({
      where: { id: club.id },
    })
    expect(updatedClub?.name).toBe('Updated Club Name')
    expect(updatedClub?.lastSyncStatus).toBe('success')

    // Verify event created
    const events = await testPrisma.event.findMany({
      where: { clubId: club.id },
    })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Morning Run')

    // Verify summary
    expect(result.eventsAdded).toBe(1)
    expect(result.eventsUpdated).toBe(0)
    expect(result.eventsDeleted).toBe(0)
  })

  test('respects manualOverrides', async () => {
    const club = await testPrisma.club.create({
      data: {
        name: 'Original Name',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        manualOverrides: ['name'],
        ownerId: testUserId,
      },
    })

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'New Name',
      description: 'Description',
      url: 'https://strava.com/clubs/test',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      profile: 'photo.jpg',
      cover_photo: 'cover.jpg',
      cover_photo_small: 'cover-small.jpg',
    })
    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([])

    await syncStravaClub(club.id)

    const updated = await testPrisma.club.findUnique({
      where: { id: club.id },
    })
    expect(updated?.name).toBe('Original Name') // Not updated
    expect(updated?.description).toBe('Description') // Updated
  })

  test('updates existing events', async () => {
    const club = await testPrisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        ownerId: testUserId,
      },
    })

    // Create existing event
    await testPrisma.event.create({
      data: {
        clubId: club.id,
        stravaEventId: '1',
        title: 'Old Title',
        date: new Date('2025-12-01T08:00:00Z'),
        time: '08:00',
      },
    })

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'Test Club',
      description: 'Description',
      url: 'https://strava.com/clubs/test',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      profile: 'photo.jpg',
      cover_photo: 'cover.jpg',
      cover_photo_small: 'cover-small.jpg',
    })

    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([
      {
        id: 1,
        title: 'Updated Title',
        description: 'Updated description',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
      },
    ])

    const result = await syncStravaClub(club.id)

    // Verify event updated
    const events = await testPrisma.event.findMany({
      where: { clubId: club.id },
    })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Updated Title')

    // Verify summary
    expect(result.eventsAdded).toBe(0)
    expect(result.eventsUpdated).toBe(1)
    expect(result.eventsDeleted).toBe(0)
  })

  test('deletes events removed from Strava', async () => {
    const club = await testPrisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        ownerId: testUserId,
      },
    })

    // Create events: one that will remain, one that will be deleted
    await testPrisma.event.createMany({
      data: [
        {
          clubId: club.id,
          stravaEventId: '1',
          title: 'Event to keep',
          date: new Date('2025-12-01T08:00:00Z'),
          time: '08:00',
        },
        {
          clubId: club.id,
          stravaEventId: '2',
          title: 'Event to delete',
          date: new Date('2025-12-02T08:00:00Z'),
          time: '08:00',
        },
      ],
    })

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'Test Club',
      description: 'Description',
      url: 'https://strava.com/clubs/test',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      profile: 'photo.jpg',
      cover_photo: 'cover.jpg',
      cover_photo_small: 'cover-small.jpg',
    })

    // Only return event 1
    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([
      {
        id: 1,
        title: 'Event to keep',
        description: 'Description',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
      },
    ])

    const result = await syncStravaClub(club.id)

    // Verify event deleted
    const events = await testPrisma.event.findMany({
      where: { clubId: club.id },
    })
    expect(events).toHaveLength(1)
    expect(events[0].stravaEventId).toBe('1')

    // Verify summary
    expect(result.eventsDeleted).toBe(1)
  })

  test('tracks sync status in_progress then success', async () => {
    const club = await testPrisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        ownerId: testUserId,
      },
    })

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'Test Club',
      description: 'Description',
      url: 'https://strava.com/clubs/test',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      profile: 'photo.jpg',
      cover_photo: 'cover.jpg',
      cover_photo_small: 'cover-small.jpg',
    })
    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([])

    await syncStravaClub(club.id)

    const updated = await testPrisma.club.findUnique({
      where: { id: club.id },
    })
    expect(updated?.lastSyncStatus).toBe('success')
    expect(updated?.lastSynced).toBeTruthy()
    expect(updated?.lastSyncAttempt).toBeTruthy()
    expect(updated?.lastSyncError).toBeNull()
  })

  test('tracks sync failure and error message', async () => {
    const club = await testPrisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        ownerId: testUserId,
      },
    })

    vi.mocked(stravaService.fetchStravaClub).mockRejectedValue(
      new Error('Network timeout')
    )

    await expect(syncStravaClub(club.id)).rejects.toThrow('Network timeout')

    const updated = await testPrisma.club.findUnique({
      where: { id: club.id },
    })
    expect(updated?.lastSyncStatus).toBe('failed')
    expect(updated?.lastSyncError).toBe('Network timeout')
    expect(updated?.lastSynced).toBeNull()
  })

  test('throws error when club not linked to Strava', async () => {
    const club = await testPrisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: testUserId,
      },
    })

    await expect(syncStravaClub(club.id)).rejects.toThrow(
      'Club not linked to Strava'
    )
  })
})
