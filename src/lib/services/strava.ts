// src/lib/services/strava.ts
import { stravaClient } from '@/lib/strava'
import type { StravaClub, StravaGroupEvent } from './strava-types'

export class StravaError extends Error {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'StravaError'
  }
}

export class StravaNotFoundError extends StravaError {
  constructor() {
    super('Club not found or private')
    this.name = 'StravaNotFoundError'
  }
}

export class StravaRateLimitError extends StravaError {
  constructor() {
    super('Rate limit exceeded, retry in 15 minutes')
    this.name = 'StravaRateLimitError'
  }
}

export class StravaAuthError extends StravaError {
  constructor() {
    super('Invalid API credentials')
    this.name = 'StravaAuthError'
  }
}

export async function fetchStravaClub(clubId: number): Promise<StravaClub> {
  try {
    const club = await stravaClient.clubs.get({ id: clubId })
    return club as StravaClub
  } catch (error: unknown) {
    const err = error as { statusCode?: number }
    if (err.statusCode === 404) {
      throw new StravaNotFoundError()
    }
    if (err.statusCode === 429) {
      throw new StravaRateLimitError()
    }
    if (err.statusCode === 401) {
      throw new StravaAuthError()
    }
    throw new StravaError('Failed to fetch club', error)
  }
}

export async function fetchStravaEvents(
  clubId: number
): Promise<StravaGroupEvent[]> {
  try {
    const events = await stravaClient.clubs.listEvents({ id: clubId })
    return events as StravaGroupEvent[]
  } catch (error: unknown) {
    const err = error as { statusCode?: number }
    if (err.statusCode === 404) {
      throw new StravaNotFoundError()
    }
    if (err.statusCode === 429) {
      throw new StravaRateLimitError()
    }
    if (err.statusCode === 401) {
      throw new StravaAuthError()
    }
    throw new StravaError('Failed to fetch events', error)
  }
}

type ClubUpdateData = {
  stravaClubId: string
  name?: string
  description?: string | null
  website?: string
}

export function mapStravaClubToDb(
  club: StravaClub,
  manualOverrides: string[]
): ClubUpdateData {
  const data: ClubUpdateData = {
    stravaClubId: club.id.toString(),
  }

  if (!manualOverrides.includes('name')) {
    data.name = club.name
  }

  if (!manualOverrides.includes('description')) {
    data.description = club.description || null
  }

  if (!manualOverrides.includes('website')) {
    data.website = club.url
  }

  return data
}

type EventCreateData = {
  stravaEventId: string
  clubId: string
  title: string
  description: string | null
  address: string
  date: Date
  time: string
  distance: string | null
}

export function mapStravaEventToDb(
  event: StravaGroupEvent,
  clubId: string
): EventCreateData {
  const startDate = new Date(event.upcoming_occurrences[0].start_date)
  const hours = startDate.getUTCHours().toString().padStart(2, '0')
  const minutes = startDate.getUTCMinutes().toString().padStart(2, '0')
  const time = `${hours}:${minutes}`

  let distance: string | null = null
  if (event.route?.distance) {
    distance = `${(event.route.distance / 1000).toFixed(1)} km`
  }

  return {
    stravaEventId: event.id.toString(),
    clubId,
    title: event.title,
    description: event.description || null,
    address: event.address,
    date: startDate,
    time,
    distance,
  }
}
