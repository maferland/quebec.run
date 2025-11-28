// src/app/api/admin/strava/preview/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import * as stravaService from '@/lib/services/strava'
import type { StravaClub, StravaGroupEvent } from '@/lib/services/strava-types'
import type { Session } from 'next-auth'

vi.mock('next-auth')
vi.mock('@/lib/services/strava')

describe('GET /api/admin/strava/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not admin', async () => {
    const mockSession = {
      user: { id: '1', email: 'user@test.com', isAdmin: false },
      expires: '2024-12-31',
    } as Session

    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const request = new Request(
      'http://localhost/api/admin/strava/preview?slug=test-club'
    )
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toContain('Admin access required')
  })

  test('returns 400 when slug missing', async () => {
    const mockSession = {
      user: { id: '1', email: 'admin@test.com', isAdmin: true },
      expires: '2024-12-31',
    } as Session

    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const request = new Request('http://localhost/api/admin/strava/preview')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('slug is required')
  })

  test('returns club and event preview', async () => {
    const mockSession = {
      user: { id: '1', email: 'admin@test.com', isAdmin: true },
      expires: '2024-12-31',
    } as Session

    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const mockClub: StravaClub = {
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

    const mockEvents: StravaGroupEvent[] = [
      {
        id: 1,
        title: 'Run',
        description: 'Morning run',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
      },
    ]

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue(mockClub)
    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue(mockEvents)

    const request = new Request(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.club).toEqual(mockClub)
    expect(json.upcomingEvents).toEqual(mockEvents)
  })
})
