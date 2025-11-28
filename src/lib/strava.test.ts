// src/lib/strava.test.ts
import { describe, test, expect } from 'vitest'
import { createStravaClient } from './strava'

describe('createStravaClient', () => {
  test('returns strava client instance', () => {
    const client = createStravaClient()
    expect(client).toBeDefined()
    expect(typeof client.clubs.get).toBe('function')
  })
})
