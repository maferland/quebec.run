// src/lib/strava.ts
import strava from 'strava-v3'
import { env } from '@/lib/env'

export type StravaClient = ReturnType<typeof strava.client>

export function createStravaClient(): StravaClient {
  return new strava.client(env.STRAVA_ACCESS_TOKEN)
}

export const stravaClient = createStravaClient()
