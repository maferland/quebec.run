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
  if (!env.STRAVA_ACCESS_TOKEN) {
    throw new Error(
      'STRAVA_ACCESS_TOKEN is not configured. Add it to .env to enable Strava integration.'
    )
  }
  // Work around strava-v3's incorrect void return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (strava.client as any)(env.STRAVA_ACCESS_TOKEN) as StravaClient
}

// Lazy client - only created when first accessed
let _stravaClient: StravaClient | null = null
export const stravaClient = new Proxy({} as StravaClient, {
  get(_target, prop: keyof StravaClient) {
    if (!_stravaClient) {
      _stravaClient = createStravaClient()
    }
    return _stravaClient[prop]
  },
})
