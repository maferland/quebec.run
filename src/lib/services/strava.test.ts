// src/lib/services/strava.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { fetchStravaClub, fetchStravaEvents } from './strava'
import * as stravaLib from '@/lib/strava'

vi.mock('@/lib/strava')

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

    const mockListEvents = vi.fn().mockResolvedValue(mockEvents)
    vi.mocked(stravaLib.stravaClient).clubs = {
      ...vi.mocked(stravaLib.stravaClient).clubs,
      listEvents: mockListEvents,
    }

    const result = await fetchStravaEvents(123)

    expect(result).toEqual(mockEvents)
    expect(mockListEvents).toHaveBeenCalledWith({ id: 123 })
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

    const mockListEvents = vi.fn().mockResolvedValue(mockEvents)
    vi.mocked(stravaLib.stravaClient).clubs = {
      ...vi.mocked(stravaLib.stravaClient).clubs,
      listEvents: mockListEvents,
    }

    const result = await fetchStravaEvents(123)

    expect(result).toEqual(mockEvents)
  })
})
