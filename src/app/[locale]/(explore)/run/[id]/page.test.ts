import { expect, it, vi } from 'vitest'
import { getEventById } from '@/lib/services/events'
import RunPage, { generateMetadata } from './page'

vi.mock('@/lib/services/events', () => ({ getEventById: vi.fn() }))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(
    async () =>
      (key: string, values: { eventTitle: string; clubName: string }) =>
        `${key}: ${values.eventTitle} | ${values.clubName}`
  ),
}))

it('uses canonical event resolution for virtual run metadata', async () => {
  vi.mocked(getEventById).mockResolvedValue({
    id: 'club-slug-run-slug--2026-03-08',
    title: 'Sunday Run',
    recurringSlug: 'run-slug',
    club: { name: 'Test Club', slug: 'club-slug' },
  } as Awaited<ReturnType<typeof getEventById>>)

  const metadata = await generateMetadata({
    params: Promise.resolve({
      locale: 'en',
      id: 'club-slug-run-slug--2026-03-08',
    }),
  })

  expect(getEventById).toHaveBeenCalledWith({
    data: { id: 'club-slug-run-slug--2026-03-08' },
  })
  expect(metadata.title).toBe('title: Sunday Run | Test Club')
  expect(metadata.alternates?.canonical).toBe(
    'https://www.quebec.run/en/clubs/club-slug/events/run-slug/2026-03-08'
  )
  expect(metadata.robots).toBeUndefined()
})

it('keeps a missing run out of search results', async () => {
  vi.mocked(getEventById).mockResolvedValue(null)

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: 'en', id: 'missing' }),
  })

  expect(metadata.alternates?.canonical).toBe(
    'https://www.quebec.run/en/run/missing'
  )
  expect(metadata.robots).toEqual({ index: false, follow: false })
})

it('uses the run URL for a concrete event', async () => {
  vi.mocked(getEventById).mockResolvedValue({
    id: 'event-id',
    title: 'Sunday Run',
    club: { name: 'Test Club', slug: 'club-slug' },
  } as Awaited<ReturnType<typeof getEventById>>)

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: 'en', id: 'event-id' }),
  })

  expect(metadata.alternates?.canonical).toBe(
    'https://www.quebec.run/en/run/event-id'
  )
  expect(metadata.robots).toBeUndefined()
})

it.each([
  [null, false],
  [' ', false],
  ['250 3e Rue, Québec, QC', true],
])(
  'publishes Event JSON-LD only with an address (%s)',
  async (address, expected) => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'event-id',
      title: 'Sunday Run',
      description: null,
      date: new Date('2026-10-11T12:00:00Z'),
      time: '08:00',
      address,
      latitude: null,
      longitude: null,
      status: 'SCHEDULED',
      club: { name: 'Test Club', slug: 'club-slug' },
    } as Awaited<ReturnType<typeof getEventById>>)

    const result = await RunPage({
      params: Promise.resolve({ locale: 'en', id: 'event-id' }),
    })

    expect(result !== null).toBe(expected)
  }
)
