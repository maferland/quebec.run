import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { getPlacePage } from '@/lib/services/recurring-events'

vi.mock('@/lib/services/recurring-events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/recurring-events')>()),
  getPlacePage: vi.fn(),
}))

function request(clubSlug: string, placeSlug: string, locale = 'fr') {
  return new Request(
    `http://localhost/api/explore/places/${clubSlug}/${placeSlug}?locale=${locale}`
  )
}

function context(clubSlug: string, placeSlug: string) {
  return { params: Promise.resolve({ clubSlug, placeSlug }) }
}

describe('GET /api/explore/places/[clubSlug]/[placeSlug]', () => {
  beforeEach(() => {
    vi.mocked(getPlacePage).mockReset()
  })

  it('returns the place shaped for the detail panel', async () => {
    vi.mocked(getPlacePage).mockResolvedValue({
      club: {
        id: 'club-1',
        slug: 'fauxmouvement',
        name: 'Faux Mouvement',
        description: 'A trail crew.',
      },
      primarySlug: 'mardi',
      place: {
        address: '123 Rue Principale',
        neighborhood: 'Limoilou',
        latitude: 46.8,
        longitude: -71.2,
      },
      slots: [
        {
          id: 'slot-1',
          slug: 'mardi',
          title: 'Faux Mouvement',
          description: null,
          address: '123 Rue Principale',
          neighborhood: 'Limoilou',
          latitude: 46.8,
          longitude: -71.2,
          distance: '5',
          pace: null,
          pacePolicy: null,
          schedulePattern:
            'DTSTART:20260101T180000Z\nRRULE:FREQ=WEEKLY;BYDAY=TU',
          occurrences: [new Date('2026-08-11T22:00:00.000Z')],
        },
      ],
      otherPlaces: [
        { slug: 'jeudi', title: 'Faux Mouvement', neighborhood: null },
      ],
    })

    const response = await GET(
      request('fauxmouvement', 'mardi'),
      context('fauxmouvement', 'mardi')
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.clubSlug).toBe('fauxmouvement')
    expect(data.heading).toBe('Faux Mouvement')
    expect(data.address).toBe('123 Rue Principale')
    expect(data.otherPlaces).toEqual([
      { slug: 'jeudi', label: 'Faux Mouvement' },
    ])
  })

  it('returns 404 when the place is not found', async () => {
    vi.mocked(getPlacePage).mockResolvedValue(null)

    const response = await GET(
      request('fauxmouvement', 'missing'),
      context('fauxmouvement', 'missing')
    )
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Not found')
  })
})
