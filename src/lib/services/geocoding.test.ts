import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest'
import { geocodeAddress } from './geocoding'

describe('geocodeAddress', () => {
  let mockFetch: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  test('returns lat/lng for valid address', async () => {
    const mockResponse = [{ lat: '46.8139', lon: '-71.2080' }]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await geocodeAddress('123 Rue Principale, Quebec City, QC')

    expect(result).toEqual({ lat: 46.8139, lng: -71.208 })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.any(Object)
    )
  })

  test('returns null for failed geocoding', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    const result = await geocodeAddress('Invalid Address')

    expect(result).toBeNull()
  })

  test('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await geocodeAddress('123 Rue Principale')

    expect(result).toBeNull()
  })
})
