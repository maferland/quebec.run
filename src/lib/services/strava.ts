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
