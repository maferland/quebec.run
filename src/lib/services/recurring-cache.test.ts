import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const entries = new Map<string, { value: unknown; tags: string[] }>()
  return {
    entries,
    clubFindUnique: vi.fn(),
    clubFindMany: vi.fn(),
    recurringFindMany: vi.fn(),
    recurringFindUnique: vi.fn(),
    recurringCreate: vi.fn(),
    recurringUpdate: vi.fn(),
    eventFindMany: vi.fn(),
    revalidateTag: vi.fn((tag: string) => {
      for (const [key, entry] of entries) {
        if (entry.tags.includes(tag)) entries.delete(key)
      }
    }),
    unstableCache: vi.fn(
      (
        callback: (...args: unknown[]) => Promise<unknown>,
        keyParts: string[],
        options: { tags?: string[] }
      ) =>
        async (...args: unknown[]) => {
          const key = JSON.stringify([keyParts, args])
          if (!entries.has(key)) {
            const value = JSON.parse(JSON.stringify(await callback(...args)))
            entries.set(key, { value, tags: options.tags ?? [] })
          }
          return entries.get(key)!.value
        }
    ),
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    club: { findUnique: mocks.clubFindUnique, findMany: mocks.clubFindMany },
    recurringEvent: {
      findMany: mocks.recurringFindMany,
      findUnique: mocks.recurringFindUnique,
      create: mocks.recurringCreate,
      update: mocks.recurringUpdate,
    },
    event: { findMany: mocks.eventFindMany },
  },
}))
vi.mock('next/cache', () => ({
  unstable_cache: mocks.unstableCache,
  revalidateTag: mocks.revalidateTag,
  revalidatePath: vi.fn(),
}))

import {
  createRecurringEvent,
  deleteRecurringEvent,
  getEventsInRange,
  getPlacePage,
  updateRecurringEvent,
} from './recurring-events'

const pattern = {
  id: 'schedule-a',
  slug: 'evening-run',
  title: 'Evening run',
  description: null,
  address: '123 Main Street',
  neighborhood: null,
  latitude: null,
  longitude: null,
  distance: null,
  pace: null,
  pacePolicy: null,
  schedulePattern:
    'DTSTART:20261101T180000Z\nRRULE:FREQ=DAILY;BYHOUR=18;BYMINUTE=0',
}

describe('stable recurring cache inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.entries.clear()
    vi.stubEnv('NODE_ENV', 'production')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
    mocks.clubFindUnique.mockImplementation(async ({ where }) => ({
      id: where.slug,
      slug: where.slug,
      name: where.slug,
      description: null,
    }))
    mocks.recurringFindMany.mockResolvedValue([pattern])
    mocks.eventFindMany.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('rolls place occurrences forward without rereading cached schedule definitions', async () => {
    const before = await getPlacePage({
      clubSlug: 'club-a',
      placeSlug: pattern.slug,
    })
    vi.setSystemTime(new Date('2026-11-24T12:00:00Z'))
    const after = await getPlacePage({
      clubSlug: 'club-a',
      placeSlug: pattern.slug,
    })

    expect(before!.slots[0].occurrences[0].toISOString()).toBe(
      '2026-11-23T18:00:00.000Z'
    )
    expect(after!.slots[0].occurrences[0].toISOString()).toBe(
      '2026-11-24T18:00:00.000Z'
    )
    expect(mocks.clubFindUnique).toHaveBeenCalledTimes(1)
    expect(mocks.recurringFindMany).toHaveBeenCalledTimes(1)
    expect(mocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining(['place-definitions', 'club-a', pattern.slug]),
      { revalidate: false, tags: ['public:club:club-a'] }
    )
  })

  it('invalidates both old and new club/schedule aliases on a move while retaining unrelated places', async () => {
    await getPlacePage({ clubSlug: 'old-club', placeSlug: pattern.slug })
    await getPlacePage({ clubSlug: 'other-club', placeSlug: pattern.slug })
    mocks.recurringFindUnique.mockResolvedValue({
      id: pattern.id,
      clubId: 'old-id',
      slug: pattern.slug,
    })
    mocks.recurringUpdate.mockResolvedValue({
      id: pattern.id,
      clubId: 'new-id',
      slug: 'new-run',
    })
    mocks.clubFindMany.mockResolvedValue([
      { id: 'old-id', slug: 'old-club' },
      { id: 'new-id', slug: 'new-club' },
    ])
    mocks.eventFindMany.mockResolvedValue([
      { id: 'child-id', slug: 'child-slug' },
    ])

    await updateRecurringEvent(pattern.id, {
      title: 'New Run',
      clubId: 'new-id',
    })
    const tags = mocks.revalidateTag.mock.calls.map(([tag]) => tag)
    expect(tags).toEqual(
      expect.arrayContaining([
        'public:club:old-club',
        'public:club:new-club',
        'public:club-id:old-id',
        'public:club-id:new-id',
        'public:schedule:schedule-a',
        'public:schedule:evening-run',
        'public:schedule:old-club-evening-run',
        'public:schedule:new-run',
        'public:schedule:new-club-new-run',
        'public:explore',
        'public:clubs',
        'public:run:child-id',
        'public:run:child-slug',
      ])
    )
    expect(tags).not.toContain('public:runs')
    expect(tags).not.toContain('public:run:unrelated-child')
    expect(tags).not.toContain('public:club:other-club')

    await getPlacePage({ clubSlug: 'other-club', placeSlug: pattern.slug })
    expect(mocks.clubFindUnique).toHaveBeenCalledTimes(2)
    await getPlacePage({ clubSlug: 'old-club', placeSlug: pattern.slug })
    expect(mocks.clubFindUnique).toHaveBeenCalledTimes(3)
  })

  it('filters concrete dates against each requested window using one stable input read', async () => {
    mocks.eventFindMany.mockResolvedValue([
      {
        id: 'one-off',
        date: new Date('2026-11-23T18:00:00Z'),
        recurringEventId: null,
      },
    ])
    mocks.recurringFindMany.mockResolvedValue([])
    const before = await getEventsInRange(
      new Date('2026-11-23T00:00:00Z'),
      new Date('2026-11-24T00:00:00Z'),
      'club-id'
    )
    const after = await getEventsInRange(
      new Date('2026-11-24T00:00:00Z'),
      new Date('2026-11-25T00:00:00Z'),
      'club-id'
    )

    expect(before[0].date).toBeInstanceOf(Date)
    expect(after).toEqual([])
    expect(mocks.eventFindMany).toHaveBeenCalledTimes(1)
    expect(mocks.recurringFindMany).toHaveBeenCalledTimes(1)
    expect(mocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining(['event-range-inputs', 'club-id']),
      { revalidate: false, tags: ['public:club-id:club-id'] }
    )
  })

  it('expires a cached missing place on create and its cached definition on soft delete', async () => {
    mocks.recurringFindMany.mockResolvedValue([])
    const params = { clubSlug: 'club-a', placeSlug: pattern.slug }
    expect(await getPlacePage(params)).toBeNull()
    mocks.clubFindMany.mockResolvedValue([{ id: 'club-id', slug: 'club-a' }])
    mocks.recurringCreate.mockResolvedValue({ ...pattern, clubId: 'club-id' })
    mocks.recurringFindMany.mockResolvedValue([pattern])

    await createRecurringEvent({
      title: pattern.title,
      slug: pattern.slug,
      clubId: 'club-id',
      schedulePattern: pattern.schedulePattern,
    })
    expect(await getPlacePage(params)).not.toBeNull()

    mocks.recurringUpdate.mockResolvedValue({
      ...pattern,
      clubId: 'club-id',
      isActive: false,
    })
    mocks.recurringFindMany.mockResolvedValue([])
    await deleteRecurringEvent(pattern.id)
    expect(await getPlacePage(params)).toBeNull()
    expect(mocks.recurringFindMany).toHaveBeenCalledTimes(3)
  })
})
