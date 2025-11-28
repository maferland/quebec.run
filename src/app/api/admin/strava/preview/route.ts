// src/app/api/admin/strava/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import {
  fetchStravaClub,
  fetchStravaEvents,
  StravaNotFoundError,
  StravaRateLimitError,
  StravaAuthError,
} from '@/lib/services/strava'

const slugSchema = z
  .string()
  .min(1, 'slug is required')
  .regex(/-\d+$/, 'Invalid slug format (expected: club-name-123456)')

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

  // Validate slug with Zod
  const parseResult = slugSchema.safeParse(slug)
  if (!parseResult.success) {
    const errorMessage =
      parseResult.error?.issues?.[0]?.message || 'Invalid slug format'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }

  try {
    // Extract club ID from slug (format: club-name-123456)
    const clubIdMatch = slug.match(/-(\d+)$/)
    const clubId = parseInt(clubIdMatch![1], 10)

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

    if (error instanceof StravaNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof StravaRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (error instanceof StravaAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch Strava data' },
      { status: 500 }
    )
  }
}
