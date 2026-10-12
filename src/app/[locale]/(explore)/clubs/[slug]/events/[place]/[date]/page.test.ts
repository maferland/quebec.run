import { beforeEach, expect, it, vi } from 'vitest'
import { permanentRedirect } from 'next/navigation'
import { getEventByClubAndSlug } from '@/lib/services/events'
import EventDateRedirect from './page'

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error('REDIRECT')
  }),
}))

vi.mock('@/lib/services/events', () => ({
  getTorontoDayBounds: vi.fn(() => ({
    start: new Date('2026-10-12T00:00:00Z'),
  })),
  getEventByClubAndSlug: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getEventByClubAndSlug).mockReset()
  vi.mocked(permanentRedirect).mockClear()
})

it('redirects a past date to the place page without looking up the event', async () => {
  await expect(
    EventDateRedirect({
      params: Promise.resolve({
        locale: 'fr',
        slug: '6am-club',
        place: 'montcalm',
        date: '2026-05-07',
      }),
    })
  ).rejects.toThrow('REDIRECT')

  expect(getEventByClubAndSlug).not.toHaveBeenCalled()
  expect(permanentRedirect).toHaveBeenCalledWith(
    '/fr/clubs/6am-club/events/montcalm'
  )
})
