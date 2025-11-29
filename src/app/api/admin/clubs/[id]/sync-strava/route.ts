// src/app/api/admin/clubs/[id]/sync-strava/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncStravaClub } from '@/lib/services/strava-sync'

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
    const summary = await syncStravaClub(id)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: unknown) {
    console.error('Sync Strava error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to sync Strava club',
      },
      { status: 500 }
    )
  }
}
