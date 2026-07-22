import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import LegacyEventPage from './page'
import { notFound, permanentRedirect } from 'next/navigation'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
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
    vi.mocked(prisma.event.findUnique).mockReset()
    vi.mocked(notFound).mockClear()
    vi.mocked(permanentRedirect).mockClear()
  })

  it('redirects an existing concrete event to its run route', async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue({
      id: 'event-id',
    } as never)

    await expect(
      LegacyEventPage({
        params: Promise.resolve({ id: 'event-id' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('REDIRECT')

    expect(prisma.event.findUnique).toHaveBeenCalledWith({
      where: { id: 'event-id' },
      select: { id: true },
    })
    expect(permanentRedirect).toHaveBeenCalledWith('/run/event-id')
  })

  it('returns not found when the concrete event does not exist', async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null)

    await expect(
      LegacyEventPage({
        params: Promise.resolve({ id: 'missing' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NOT_FOUND')

    expect(permanentRedirect).not.toHaveBeenCalled()
    expect(notFound).toHaveBeenCalled()
  })
})
