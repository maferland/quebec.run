// src/app/api/admin/clubs/[id]/unlink-strava/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const unlinkSchema = z.object({
  deleteEvents: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const { deleteEvents } = unlinkSchema.parse(body)

    let eventsDeleted = 0

    if (deleteEvents) {
      // Delete Strava-sourced events
      const deleted = await prisma.event.deleteMany({
        where: {
          clubId: id,
          stravaEventId: { not: null },
        },
      })
      eventsDeleted = deleted.count
    } else {
      // Convert to manual events
      await prisma.event.updateMany({
        where: {
          clubId: id,
          stravaEventId: { not: null },
        },
        data: {
          stravaEventId: null,
        },
      })
    }

    // Unlink club
    const club = await prisma.club.update({
      where: { id },
      data: {
        stravaSlug: null,
        stravaClubId: null,
        isManual: true,
        manualOverrides: [],
        lastSyncStatus: null,
        lastSyncError: null,
        lastSyncAttempt: null,
        lastSynced: null,
      },
    })

    return NextResponse.json({
      club,
      eventsDeleted,
    })
  } catch (error: unknown) {
    console.error('Unlink Strava error:', error)

    return NextResponse.json(
      { error: 'Failed to unlink Strava club' },
      { status: 500 }
    )
  }
}
