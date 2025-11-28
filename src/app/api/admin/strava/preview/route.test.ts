// src/app/api/admin/strava/preview/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import {
  fetchStravaClub,
  fetchStravaEvents,
  StravaNotFoundError,
  StravaRateLimitError,
  StravaAuthError,
} from '@/lib/services/strava'
import type { StravaClub, StravaGroupEvent } from '@/lib/services/strava-types'
import type { Session } from 'next-auth'

vi.mock('next-auth')
vi.mock('@/lib/services/strava', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/strava')>(
    '@/lib/services/strava'
  )
  return {
    ...actual,
    fetchStravaClub: vi.fn(),
    fetchStravaEvents: vi.fn(),
  }
})

describe('GET /api/admin/strava/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockAdminSession: Session = {
    user: { id: '1', email: 'admin@test.com', isAdmin: true },
    expires: '2024-12-31',
  }

  test('returns 401 when not admin', async () => {
    const mockSession = {
      user: { id: '1', email: 'user@test.com', isAdmin: false },
      expires: '2024-12-31',
    } as Session

    vi.mocked(getServerSession).mockResolvedValue(mockSession)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club'
    )
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toContain('Admin access required')
  })

  test('returns 400 when slug missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

    const request = new NextRequest('http://localhost/api/admin/strava/preview')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('slug is required')
  })

  test('returns 400 for invalid slug format', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=invalid-slug-without-number'
    )
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Invalid slug format')
  })

  test('returns club and event preview', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

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

    vi.mocked(fetchStravaClub).mockResolvedValue(mockClub)
    vi.mocked(fetchStravaEvents).mockResolvedValue(mockEvents)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.club).toEqual(mockClub)
    expect(json.upcomingEvents).toEqual(mockEvents)
  })

  test('returns exactly 5 events when more than 5 exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

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

    const mockEvents: StravaGroupEvent[] = Array.from(
      { length: 10 },
      (_, i) => ({
        id: i + 1,
        title: `Event ${i + 1}`,
        description: `Description ${i + 1}`,
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
      })
    )

    vi.mocked(fetchStravaClub).mockResolvedValue(mockClub)
    vi.mocked(fetchStravaEvents).mockResolvedValue(mockEvents)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.upcomingEvents).toHaveLength(5)
    expect(json.upcomingEvents[0].id).toBe(1)
    expect(json.upcomingEvents[4].id).toBe(5)
  })

  test('returns 404 when club not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

    const notFoundError = new StravaNotFoundError()
    vi.mocked(fetchStravaClub).mockRejectedValue(notFoundError)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club-999999'
    )
    const response = await GET(request)

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toContain('Club not found or private')
  })

  test('returns 429 on rate limit', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

    const rateLimitError = new StravaRateLimitError()
    vi.mocked(fetchStravaClub).mockRejectedValue(rateLimitError)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(429)
    const json = await response.json()
    expect(json.error).toContain('Rate limit exceeded')
  })

  test('returns 401 on auth error', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

    const authError = new StravaAuthError()
    vi.mocked(fetchStravaClub).mockRejectedValue(authError)

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toContain('Invalid API credentials')
  })

  test('returns 500 on generic error', async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockAdminSession)

    vi.mocked(fetchStravaClub).mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toContain('Failed to fetch Strava data')
  })
})
