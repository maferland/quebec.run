// src/app/api/admin/strava/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchStravaClub, fetchStravaEvents } from '@/lib/services/strava'

export async function GET(request: NextRequest) {
  // Check admin
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 401 }
    )
  }

  // Get slug from query
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  try {
    // Extract club ID from slug (format: club-name-123456)
    const clubIdMatch = slug.match(/-(\d+)$/)
    if (!clubIdMatch) {
      return NextResponse.json(
        { error: 'Invalid slug format (expected: club-name-123456)' },
        { status: 400 }
      )
    }

    const clubId = parseInt(clubIdMatch[1], 10)

    // Fetch from Strava
    const [club, upcomingEvents] = await Promise.all([
      fetchStravaClub(clubId),
      fetchStravaEvents(clubId),
    ])

    return NextResponse.json({
      club,
      upcomingEvents: upcomingEvents.slice(0, 5), // Preview first 5
    })
  } catch (error: unknown) {
    console.error('Strava preview error:', error)

    const err = error as { name?: string; message?: string }

    if (err.name === 'StravaNotFoundError') {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }

    if (err.name === 'StravaRateLimitError') {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch Strava data' },
      { status: 500 }
    )
  }
}
