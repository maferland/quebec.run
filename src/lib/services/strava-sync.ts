// src/lib/services/strava-sync.ts
import { prisma } from '@/lib/prisma'
import {
  fetchStravaClub,
  fetchStravaEvents,
  mapStravaClubToDb,
  mapStravaEventToDb,
} from './strava'
import type { SyncSummary } from './strava-types'

export async function syncStravaClub(clubId: string): Promise<SyncSummary> {
  // Fetch club with current state
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      stravaClubId: true,
      stravaSlug: true,
      manualOverrides: true,
    },
  })

  if (!club?.stravaClubId) {
    throw new Error('Club not linked to Strava')
  }

  const summary: SyncSummary = {
    eventsAdded: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    fieldsUpdated: [],
  }

  try {
    // Mark sync in progress
    await prisma.club.update({
      where: { id: clubId },
      data: {
        lastSyncStatus: 'in_progress',
        lastSyncAttempt: new Date(),
      },
    })

    // Fetch from Strava
    const stravaClubId = parseInt(club.stravaClubId, 10)
    const [stravaClub, stravaEvents] = await Promise.all([
      fetchStravaClub(stravaClubId),
      fetchStravaEvents(stravaClubId),
    ])

    // Update club info (respecting overrides)
    const clubUpdate = mapStravaClubToDb(stravaClub, club.manualOverrides)

    // Only update if there are fields to update
    const { stravaClubId: _, ...fieldsToUpdate } = clubUpdate
    const hasFieldsToUpdate = Object.values(fieldsToUpdate).some(
      (val) => val !== undefined
    )

    if (hasFieldsToUpdate) {
      await prisma.club.update({
        where: { id: clubId },
        data: clubUpdate,
      })

      if (clubUpdate.name) summary.fieldsUpdated.push('name')
      if (clubUpdate.description !== undefined)
        summary.fieldsUpdated.push('description')
      if (clubUpdate.website) summary.fieldsUpdated.push('website')
    }

    // Sync events (create/update)
    for (const stravaEvent of stravaEvents) {
      const eventData = mapStravaEventToDb(stravaEvent, clubId)

      const existing = await prisma.event.findUnique({
        where: { stravaEventId: eventData.stravaEventId },
      })

      if (existing) {
        await prisma.event.update({
          where: { stravaEventId: eventData.stravaEventId },
          data: eventData,
        })
        summary.eventsUpdated++
      } else {
        await prisma.event.create({ data: eventData })
        summary.eventsAdded++
      }
    }

    // Delete events removed from Strava
    const stravaEventIds = stravaEvents.map((e) => e.id.toString())
    const deleted = await prisma.event.deleteMany({
      where: {
        clubId,
        stravaEventId: {
          not: null,
          notIn: stravaEventIds,
        },
      },
    })
    summary.eventsDeleted = deleted.count

    // Mark success
    await prisma.club.update({
      where: { id: clubId },
      data: {
        lastSyncStatus: 'success',
        lastSynced: new Date(),
        lastSyncError: null,
      },
    })

    return summary
  } catch (error: unknown) {
    // Mark failure
    await prisma.club.update({
      where: { id: clubId },
      data: {
        lastSyncStatus: 'failed',
        lastSyncError: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    throw error
  }
}
