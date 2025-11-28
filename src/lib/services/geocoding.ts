const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const RATE_LIMIT_MS = 1000 // 1 req/sec per Nominatim usage policy

let lastRequestTime = 0

async function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const delay = RATE_LIMIT_MS - timeSinceLastRequest
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  lastRequestTime = Date.now()
  return fetch(url, options)
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`)
    url.searchParams.set('q', address)
    url.searchParams.set('format', 'json')
    url.searchParams.set('countrycodes', 'ca')
    url.searchParams.set('limit', '1')

    const response = await rateLimitedFetch(url.toString(), {
      headers: {
        'User-Agent': 'quebec.run (https://quebec.run)',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn(`Geocoding failed for address: ${address}`, response.status)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.warn(`No geocoding results for address: ${address}`)
      return null
    }

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    }
  } catch (error) {
    console.error(`Geocoding error for address: ${address}`, error)
    return null
  }
}
