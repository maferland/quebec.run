// src/lib/strava.ts
import strava from 'strava-v3'
import { env } from '@/lib/env'

// Define the actual runtime shape of the Strava client
interface StravaClientMethods {
  clubs: {
    get: (params: { id: number }) => Promise<unknown>
    listEvents: (params: { id: number }) => Promise<unknown>
  }
}

export type StravaClient = StravaClientMethods

export function createStravaClient(): StravaClient {
  // Work around strava-v3's incorrect void return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (strava.client as any)(env.STRAVA_ACCESS_TOKEN) as StravaClient
}

export const stravaClient = createStravaClient()
