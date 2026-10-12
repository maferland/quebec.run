import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import LegacyEventPage from './page'
import { notFound, permanentRedirect } from 'next/navigation'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    recurringEvent: { findUnique: vi.fn() },
  },
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error('REDIRECT')
  }),
}))

describe('legacy concrete event route', () => {
  beforeEach(() => {
    vi.mocked(notFound).mockClear()
    vi.mocked(permanentRedirect).mockClear()
  })

  it('redirects a concrete event ID without querying the database', async () => {
    await expect(
      LegacyEventPage({
        params: Promise.resolve({
          locale: 'en',
          id: 'cmj90jhak00079zmoepjac8hp',
        }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('REDIRECT')

    expect(prisma.recurringEvent.findUnique).not.toHaveBeenCalled()
    expect(permanentRedirect).toHaveBeenCalledWith(
      '/en/run/cmj90jhak00079zmoepjac8hp'
    )
  })

  it('returns not found for malformed event IDs', async () => {
    await expect(
      LegacyEventPage({
        params: Promise.resolve({ locale: 'en', id: 'missing' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NOT_FOUND')

    expect(permanentRedirect).not.toHaveBeenCalled()
    expect(notFound).toHaveBeenCalled()
  })

  it('redirects a legacy virtual slug that carries a day suffix', async () => {
    await expect(
      LegacyEventPage({
        params: Promise.resolve({
          locale: 'en',
          id: 'le-coureur-nordique-mardi--2026-04-28',
        }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('REDIRECT')

    expect(permanentRedirect).toHaveBeenCalledWith(
      '/en/clubs/le-coureur-nordique/events/mardi/2026-04-28'
    )
  })

  it('returns not found for an unmapped legacy virtual slug', async () => {
    await expect(
      LegacyEventPage({
        params: Promise.resolve({
          locale: 'en',
          id: 'some-unmapped-slug--2026-04-28',
        }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NOT_FOUND')

    expect(permanentRedirect).not.toHaveBeenCalled()
  })
})
