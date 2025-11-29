// src/lib/strava.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createStravaClient } from './strava'
import * as envModule from '@/lib/env'

vi.mock('@/lib/env', () => ({
  env: {
    STRAVA_ACCESS_TOKEN: 'test-token',
  },
}))

describe('createStravaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns strava client instance', () => {
    const client = createStravaClient()
    expect(client).toBeDefined()
    expect(typeof client.clubs.get).toBe('function')
  })

  test('throws error when token not configured', () => {
    vi.mocked(envModule.env).STRAVA_ACCESS_TOKEN = undefined

    expect(() => createStravaClient()).toThrow(
      'STRAVA_ACCESS_TOKEN is not configured'
    )
  })
})
