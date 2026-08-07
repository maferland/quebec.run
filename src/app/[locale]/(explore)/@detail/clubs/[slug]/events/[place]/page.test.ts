import { expect, it, vi } from 'vitest'
import { getPlacePage } from '@/lib/services/recurring-events'
import PlaceDetailSlot from './page'

vi.mock('@/lib/services/recurring-events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/recurring-events')>()),
  getPlacePage: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound')
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

const place = {
  club: {
    id: 'club-1',
    slug: 'fauxmouvement',
    name: 'Faux Mouvement',
    description: null,
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
      schedulePattern: 'DTSTART:20260101T180000Z\nRRULE:FREQ=WEEKLY;BYDAY=TU',
      occurrences: [new Date('2026-08-11T22:00:00.000Z')],
    },
  ],
  otherPlaces: [],
}

it('renders the place panel with the resolved place', async () => {
  vi.mocked(getPlacePage).mockResolvedValue(place)

  const element = await PlaceDetailSlot({
    params: Promise.resolve({
      locale: 'fr',
      slug: 'fauxmouvement',
      place: 'mardi',
    }),
  })

  expect(element.props.place.heading).toBe('Faux Mouvement')
  expect(element.props.place.clubSlug).toBe('fauxmouvement')
})

it('404s when the place cannot be resolved', async () => {
  vi.mocked(getPlacePage).mockResolvedValue(null)

  await expect(
    PlaceDetailSlot({
      params: Promise.resolve({
        locale: 'fr',
        slug: 'fauxmouvement',
        place: 'missing',
      }),
    })
  ).rejects.toThrow('notFound')
})

it('redirects a non-primary slug to the canonical place', async () => {
  vi.mocked(getPlacePage).mockResolvedValue(place)

  await expect(
    PlaceDetailSlot({
      params: Promise.resolve({
        locale: 'fr',
        slug: 'fauxmouvement',
        place: 'jeudi',
      }),
    })
  ).rejects.toThrow('redirect:/fr/clubs/fauxmouvement/events/mardi')
})
