// src/lib/strava.test.ts
import { describe, test, expect, vi } from 'vitest'
import { createStravaClient } from './strava'

vi.mock('@/lib/env', () => ({
  env: {
    STRAVA_ACCESS_TOKEN: 'test-token',
  },
}))

describe('createStravaClient', () => {
  test('returns strava client instance', () => {
    const client = createStravaClient()
    expect(client).toBeDefined()
    expect(typeof client.clubs.get).toBe('function')
  })
})
