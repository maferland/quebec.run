import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  entries,
  findEvent,
  findRecurring,
  updateEventRecord,
  findEventRecord,
} = vi.hoisted(() => ({
  entries: new Map<
    string,
    { value: Promise<unknown>; tags: string[]; revalidate: number | false }
  >(),
  findEvent: vi.fn(),
  findRecurring: vi.fn(),
  updateEventRecord: vi.fn(),
  findEventRecord: vi.fn(),
}))

vi.mock('next/cache', () => ({
  unstable_cache:
    (
      callback: (...args: unknown[]) => Promise<unknown>,
      keys: string[],
      options: { tags?: string[]; revalidate: number | false }
    ) =>
    (...args: unknown[]) => {
      const key = JSON.stringify([keys, args])
      if (!entries.has(key)) {
        entries.set(key, {
          value: callback(...args),
          tags: options.tags ?? [],
          revalidate: options.revalidate,
        })
      }
      return entries.get(key)!.value
    },
  revalidateTag: (tag: string) => {
    for (const [key, entry] of entries) {
      if (entry.tags.includes(tag)) entries.delete(key)
    }
  },
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findFirst: findEvent,
      findUnique: findEventRecord,
      update: updateEventRecord,
    },
    recurringEvent: { findFirst: findRecurring },
  },
}))

import { getEventById, getNextOccurrenceDate, updateEvent } from './events'
import { invalidatePublicCache, PUBLIC_CACHE_TAGS } from '@/lib/public-cache'

describe('stable event caches', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T10:00:00Z'))
    vi.clearAllMocks()
    entries.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('keeps unrelated concrete detail entries when one event is edited', async () => {
    const club = { id: 'club-a', slug: 'club-a', ownerId: 'owner' }
    const original = { id: 'run-a', slug: 'run-a', title: 'Before', club }
    const other = { id: 'run-b', slug: 'run-b', title: 'Other', club: null }
    findEvent.mockResolvedValueOnce(original).mockResolvedValueOnce(other)
    expect(await getEventById({ data: { id: 'run-a' } })).toEqual(original)
    expect(await getEventById({ data: { id: 'run-b' } })).toEqual(other)

    const updated = { ...original, title: 'After' }
    findEventRecord.mockResolvedValue({ ...original, organization: null })
    updateEventRecord.mockResolvedValue(updated)
    await updateEvent({
      user: { id: 'owner', isStaff: false },
      data: { id: 'run-a', title: 'After' },
    })
    findEvent.mockResolvedValueOnce(updated)
    expect(await getEventById({ data: { id: 'run-a' } })).toEqual(updated)
    expect(await getEventById({ data: { id: 'run-b' } })).toEqual(other)
    expect(findEvent).toHaveBeenCalledTimes(3)
    expect(
      [...entries.values()].every((entry) => entry.revalidate === false)
    ).toBe(true)
  })

  it('invalidates cached virtual misses through only the affected schedule alias', async () => {
    findRecurring.mockResolvedValue(null)
    await getEventById({ data: { id: 'club-a-tuesday--2026-10-13' } })
    await getEventById({ data: { id: 'club-b-tuesday--2026-10-13' } })
    invalidatePublicCache(PUBLIC_CACHE_TAGS.schedule('club-a-tuesday'))
    await getEventById({ data: { id: 'club-a-tuesday--2026-10-13' } })
    await getEventById({ data: { id: 'club-b-tuesday--2026-10-13' } })
    expect(findRecurring).toHaveBeenCalledTimes(3)
  })

  it('advances next occurrence after a week without rereading the definition', async () => {
    findRecurring.mockResolvedValue({
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
    })
    const data = { clubSlug: 'club-a', eventSlug: 'tuesday' }
    const first = await getNextOccurrenceDate({ data })
    vi.setSystemTime(new Date('2026-10-20T20:00:00Z'))
    const later = await getNextOccurrenceDate({ data })
    expect(later!.getTime()).toBeGreaterThan(first!.getTime())
    expect(later!.getTime()).toBeGreaterThan(Date.now())
    expect(findRecurring).toHaveBeenCalledTimes(1)
    expect([...entries.values()][0].revalidate).toBe(false)
  })
})
