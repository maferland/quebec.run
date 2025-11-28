// src/app/api/admin/clubs/[id]/link-strava/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncStravaClub } from '@/lib/services/strava-sync'
import { z } from 'zod'

const linkSchema = z.object({
  stravaSlug: z.string().min(1),
  importEvents: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { stravaSlug, importEvents } = linkSchema.parse(body)

    // Extract club ID from slug
    const clubIdMatch = stravaSlug.match(/-(\d+)$/)
    if (!clubIdMatch) {
      return NextResponse.json(
        { error: 'Invalid slug format (expected: club-name-123456)' },
        { status: 400 }
      )
    }

    const stravaClubId = clubIdMatch[1]

    // Update club with Strava slug
    await prisma.club.update({
      where: { id: params.id },
      data: {
        stravaSlug,
        stravaClubId,
        isManual: false,
      },
    })

    // Sync if importEvents=true
    let summary = {
      eventsImported: 0,
      fieldsUpdated: [] as string[],
    }

    if (importEvents) {
      const syncResult = await syncStravaClub(params.id)
      summary = {
        eventsImported: syncResult.eventsAdded,
        fieldsUpdated: syncResult.fieldsUpdated,
      }
    }

    // Fetch updated club
    const club = await prisma.club.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json({
      club,
      summary,
    })
  } catch (error: unknown) {
    console.error('Link Strava error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to link Strava club' },
      { status: 500 }
    )
  }
}
