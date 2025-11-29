// src/lib/services/strava.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  fetchStravaClub,
  fetchStravaEvents,
  mapStravaClubToDb,
  mapStravaEventToDb,
} from './strava'
import * as stravaLib from '@/lib/strava'
import type { StravaClub, StravaGroupEvent } from './strava-types'

vi.mock('@/lib/strava', () => ({
  stravaClient: {
    clubs: {
      get: vi.fn(),
      listEvents: vi.fn(),
    },
  },
}))

describe('fetchStravaClub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('fetches club data from Strava API', async () => {
    const mockClub = {
      id: 123,
      name: 'Test Club',
      description: 'Test Description',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      url: 'https://strava.com/clubs/test',
      profile: 'https://strava.com/photo.jpg',
      cover_photo: 'https://strava.com/cover.jpg',
      cover_photo_small: 'https://strava.com/cover-small.jpg',
    }

    vi.mocked(stravaLib.stravaClient.clubs.get).mockResolvedValue(mockClub)

    const result = await fetchStravaClub(123)

    expect(result).toEqual(mockClub)
    expect(stravaLib.stravaClient.clubs.get).toHaveBeenCalledWith({ id: 123 })
  })

  test('throws StravaNotFoundError on 404', async () => {
    const error = Object.assign(new Error('Not found'), { statusCode: 404 })
    vi.mocked(stravaLib.stravaClient.clubs.get).mockRejectedValue(error)

    await expect(fetchStravaClub(123)).rejects.toThrow(
      'Club not found or private'
    )
  })

  test('throws StravaRateLimitError on 429', async () => {
    const error = Object.assign(new Error('Rate limited'), { statusCode: 429 })
    vi.mocked(stravaLib.stravaClient.clubs.get).mockRejectedValue(error)

    await expect(fetchStravaClub(123)).rejects.toThrow('Rate limit exceeded')
  })
})

describe('fetchStravaEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('fetches group events from Strava API', async () => {
    const mockEvents = [
      {
        id: 1,
        title: 'Morning Run',
        description: 'Test run',
        club_id: 123,
        address: '123 Main St, Quebec',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
        route: { distance: 5000 },
      },
    ]

    vi.mocked(stravaLib.stravaClient.clubs.listEvents).mockResolvedValue(
      mockEvents
    )

    const result = await fetchStravaEvents(123)

    expect(result).toEqual(mockEvents)
    expect(stravaLib.stravaClient.clubs.listEvents).toHaveBeenCalledWith({
      id: 123,
    })
  })

  test('handles missing route gracefully', async () => {
    const mockEvents = [
      {
        id: 1,
        title: 'Morning Run',
        description: 'Test run',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
      },
    ]

    vi.mocked(stravaLib.stravaClient.clubs.listEvents).mockResolvedValue(
      mockEvents
    )

    const result = await fetchStravaEvents(123)

    expect(result).toEqual(mockEvents)
  })
})

describe('mapStravaClubToDb', () => {
  const mockClub: StravaClub = {
    id: 123,
    name: 'Test Club',
    description: 'Test Description',
    sport_type: 'running',
    city: 'Quebec',
    country: 'Canada',
    member_count: 50,
    url: 'https://strava.com/clubs/test',
    profile: 'photo.jpg',
    cover_photo: 'cover.jpg',
    cover_photo_small: 'cover-small.jpg',
  }

  test('maps all fields when no overrides', () => {
    const result = mapStravaClubToDb(mockClub, [])

    expect(result).toEqual({
      stravaClubId: '123',
      name: 'Test Club',
      description: 'Test Description',
      website: 'https://strava.com/clubs/test',
    })
  })

  test('skips fields in manualOverrides', () => {
    const result = mapStravaClubToDb(mockClub, ['description', 'website'])

    expect(result).toEqual({
      stravaClubId: '123',
      name: 'Test Club',
      description: undefined,
      website: undefined,
    })
  })

  test('handles empty description', () => {
    const clubNoDesc = { ...mockClub, description: '' }
    const result = mapStravaClubToDb(clubNoDesc, [])

    expect(result.description).toBeNull()
  })
})

describe('mapStravaEventToDb', () => {
  const mockEvent: StravaGroupEvent = {
    id: 1,
    title: 'Morning Run',
    description: 'Test run description',
    club_id: 123,
    address: '123 Main St, Quebec',
    upcoming_occurrences: [{ start_date: '2025-12-01T08:30:00Z' }],
    route: { distance: 5000 },
  }

  test('maps Strava event to DB format', () => {
    const result = mapStravaEventToDb(mockEvent, 'club123')

    expect(result).toEqual({
      stravaEventId: '1',
      clubId: 'club123',
      title: 'Morning Run',
      description: 'Test run description',
      address: '123 Main St, Quebec',
      date: new Date('2025-12-01T08:30:00Z'),
      time: '08:30',
      distance: '5.0 km',
    })
  })

  test('handles missing route distance', () => {
    const eventNoRoute = { ...mockEvent, route: undefined }
    const result = mapStravaEventToDb(eventNoRoute, 'club123')

    expect(result.distance).toBeNull()
  })

  test('handles empty description', () => {
    const eventNoDesc = { ...mockEvent, description: '' }
    const result = mapStravaEventToDb(eventNoDesc, 'club123')

    expect(result.description).toBeNull()
  })
})
