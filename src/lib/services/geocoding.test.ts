import { describe, test, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupMSW } from '../test-msw-setup'
import { server } from '../test-msw'
import { geocodeAddress } from './geocoding'

describe('geocodeAddress', () => {
  setupMSW()

  test('returns lat/lng for valid address', async () => {
    const result = await geocodeAddress('123 Rue Principale, Quebec City, QC')

    expect(result).toEqual({ lat: 45.5017, lng: -73.5673 })
  })

  test('returns null for failed geocoding', async () => {
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json([])
      })
    )

    const result = await geocodeAddress('Invalid Address')

    expect(result).toBeNull()
  })

  test('returns null on network error', async () => {
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.error()
      })
    )

    const result = await geocodeAddress('123 Rue Principale')

    expect(result).toBeNull()
  })

  test('returns null on HTTP error response', async () => {
    server.use(
      http.get('https://nominatim.openstreetmap.org/search', () => {
        return HttpResponse.json({}, { status: 500 })
      })
    )

    const result = await geocodeAddress('123 Rue Principale')

    expect(result).toBeNull()
  })

  test('enforces rate limit of 1 req/sec', async () => {
    const startTime = Date.now()

    await geocodeAddress('Address 1')
    await geocodeAddress('Address 2')

    const elapsed = Date.now() - startTime

    // Should take at least 1000ms due to rate limiting
    expect(elapsed).toBeGreaterThanOrEqual(1000)
  })
})
