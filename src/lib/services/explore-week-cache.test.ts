import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const { cachedResults, findEvents, findRecurringEvents } = vi.hoisted(() => ({
  cachedResults: new Map<string, Promise<unknown>>(),
  findEvents: vi.fn(),
  findRecurringEvents: vi.fn(),
}))

vi.mock('next/cache', () => ({
  unstable_cache:
    (callback: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
    (...args: unknown[]) => {
      const key = JSON.stringify([keys, args])
      if (!cachedResults.has(key)) cachedResults.set(key, callback(...args))
      return cachedResults.get(key)
    },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findMany: findEvents },
    recurringEvent: { findMany: findRecurringEvents },
  },
}))

describe('explore week cache date rollover', () => {
  let events: typeof import('./events')

  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'production')
    events = await import('./events')
  })

  beforeEach(() => {
    vi.useFakeTimers()
    cachedResults.clear()
    findEvents.mockReset().mockResolvedValue([])
    findRecurringEvents.mockReset().mockResolvedValue([
      {
        id: 'milapres1000-tuesday',
        slug: 'mardi',
        title: 'Milaprès1000 mardi',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=30',
        clubId: 'milapres1000',
        club: {
          id: 'milapres1000',
          slug: 'milapres1000',
          name: 'Milaprès1000',
          type: null,
          vibe: null,
          beginnerFriendly: true,
          paceMin: null,
          paceMax: null,
        },
      },
    ])
  })

  afterEach(() => vi.useRealTimers())
  afterAll(() => vi.unstubAllEnvs())

  it('reuses the same-day week cache while updating past runs', async () => {
    vi.setSystemTime(new Date('2026-10-13T10:29:00Z'))

    expect(await events.getEventsForDay(0)).toEqual([
      expect.objectContaining({
        id: 'milapres1000-mardi--2026-10-13',
        isPast: false,
      }),
    ])
    const queryCount = findEvents.mock.calls.length

    vi.setSystemTime(new Date('2026-10-13T10:31:00Z'))

    expect(await events.getEventsForDay(0)).toEqual([
      expect.objectContaining({
        id: 'milapres1000-mardi--2026-10-13',
        isPast: true,
      }),
    ])
    expect(await events.getWeekEventCounts()).toContainEqual({
      day: 0,
      count: 1,
    })
    expect(findEvents.mock.calls).toHaveLength(queryCount)
    expect(cachedResults.size).toBe(1)
  })

  it('keeps the route snapshot separate and advances it at Toronto midnight', async () => {
    vi.setSystemTime(new Date('2026-10-13T10:00:00Z'))
    const first = await events.getExploreSnapshot()
    expect(first.anchor).toBe('2026-10-13T04:00:00.000Z')
    expect(first.runs).toHaveLength(1)

    await events.getEventsForDay(0)
    expect(cachedResults.size).toBe(2)

    vi.setSystemTime(new Date('2026-10-14T04:01:00Z'))
    const next = await events.getExploreSnapshot()
    expect(next.anchor).toBe('2026-10-14T04:00:00.000Z')
    expect(cachedResults.size).toBe(3)
  })

  it.each([
    {
      name: 'ordinary Sunday',
      sunday: '2026-10-12T03:59:59Z',
      monday: '2026-10-12T04:00:01Z',
      tuesday: '2026-10-13',
    },
    {
      name: 'spring DST Sunday',
      sunday: '2026-03-09T03:59:59Z',
      monday: '2026-03-09T04:00:01Z',
      tuesday: '2026-03-10',
    },
    {
      name: 'fall DST Sunday',
      sunday: '2026-11-02T04:59:59Z',
      monday: '2026-11-02T05:00:01Z',
      tuesday: '2026-11-03',
    },
  ])(
    'moves Tuesday from offset 2 to 1 after $name',
    async ({ sunday, monday, tuesday }) => {
      vi.setSystemTime(new Date(sunday))
      const expectedRun = { id: `milapres1000-mardi--${tuesday}` }

      expect(await events.getEventsForDay(2)).toEqual([
        expect.objectContaining(expectedRun),
      ])
      expect(await events.getEventsForDay(1)).toEqual([])
      expect(await events.getWeekEventCounts()).toContainEqual({
        day: 2,
        count: 1,
      })

      vi.setSystemTime(new Date(monday))

      expect(await events.getEventsForDay(1)).toEqual([
        expect.objectContaining(expectedRun),
      ])
      expect(await events.getEventsForDay(2)).toEqual([])
      expect(await events.getWeekEventCounts()).toContainEqual({
        day: 1,
        count: 1,
      })
      expect(cachedResults.size).toBe(2)
    }
  )
})
