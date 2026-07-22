import { expect, it, vi } from 'vitest'
import { getEventById } from '@/lib/services/events'
import { generateMetadata } from './page'

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
