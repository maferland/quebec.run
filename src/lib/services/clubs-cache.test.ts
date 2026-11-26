import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  deleteClub: vi.fn(),
  getEventsInRange: vi.fn(),
  revalidateTag: vi.fn(),
  entries: new Map<string, unknown>(),
}))

vi.mock('@/lib/prisma', () => {
  const prisma = {
    club: {
      findUnique: mocks.findUnique,
      update: mocks.update,
      delete: mocks.deleteClub,
    },
    $transaction: (callback: (tx: unknown) => unknown) => callback(prisma),
  }
  return { prisma }
})
vi.mock('next/cache', () => ({
  unstable_cache:
    (callback: (...args: unknown[]) => unknown, key: string[]) =>
    async (...args: unknown[]) => {
      const cacheKey = JSON.stringify([key, args])
      if (!mocks.entries.has(cacheKey)) {
        mocks.entries.set(cacheKey, await callback(...args))
      }
      return mocks.entries.get(cacheKey)
    },
  revalidateTag: mocks.revalidateTag,
  revalidatePath: vi.fn(),
}))
vi.mock('./recurring-events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./recurring-events')>()),
  getEventsInRange: mocks.getEventsInRange,
}))

import {
  deleteClub,
  getClubBySlug,
  getClubDetailBySlug,
  updateClub,
  updateClubById,
} from './clubs'

describe('stable club data cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.entries.clear()
    vi.stubEnv('NODE_ENV', 'production')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('recomputes the next occurrence after a week without querying stable club data again', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'club-id',
      slug: 'club',
      recurringEvents: [
        {
          schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0',
        },
      ],
    })

    const first = await getClubBySlug({ slug: 'club' })
    vi.setSystemTime(new Date('2026-11-30T12:00:00Z'))
    const next = await getClubBySlug({ slug: 'club' })

    expect(mocks.findUnique).toHaveBeenCalledTimes(1)
    expect(first?.patterns[0].nextOccurrence).toEqual(
      new Date('2026-11-25T19:00:00Z')
    )
    expect(next?.patterns[0].nextOccurrence).toEqual(
      new Date('2026-12-02T19:00:00Z')
    )
  })

  it('keeps club profile data cached while requesting the current upcoming interval', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'club-id',
      slug: 'club',
      name: 'Club',
      beginnerFriendly: false,
      _count: { recurringEvents: 0 },
      addresses: [],
      recurringEvents: [],
    })
    mocks.getEventsInRange.mockResolvedValue([])

    await getClubDetailBySlug('club', 'en')
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'))
    await getClubDetailBySlug('club', 'fr')

    expect(mocks.findUnique).toHaveBeenCalledTimes(1)
    expect(mocks.getEventsInRange).toHaveBeenLastCalledWith(
      new Date('2026-12-01T12:00:00Z'),
      new Date('2026-12-08T12:00:00Z'),
      'club-id'
    )
  })
})

describe('club mutation cache dependencies', () => {
  const club = {
    id: 'club-id',
    slug: 'club',
    ownerId: 'owner',
    organizationId: null,
    events: [{ id: 'event-id', slug: 'event-slug' }],
    recurringEvents: [{ id: 'schedule-id', slug: 'wednesday' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'production')
    mocks.findUnique.mockResolvedValue(club)
    mocks.update.mockResolvedValue(club)
    mocks.deleteClub.mockResolvedValue(club)
  })

  afterEach(() => vi.unstubAllEnvs())

  it.each(['update', 'authorized update', 'delete'])(
    'invalidates affected club dependencies and collections for %s, not unrelated runs',
    async (operation) => {
      if (operation === 'update') {
        await updateClub({ data: { id: club.id, name: 'Renamed club' } })
      } else if (operation === 'authorized update') {
        await updateClubById({
          user: { id: 'owner', isStaff: false },
          data: { id: club.id, name: 'Renamed club' },
        })
      } else {
        await deleteClub({
          user: { id: 'owner', isStaff: false },
          data: { id: club.id },
        })
      }

      const tags = mocks.revalidateTag.mock.calls.map(([tag]) => tag)
      expect(tags).toEqual(
        expect.arrayContaining([
          'public:clubs',
          'public:club-id:club-id',
          'public:club:club',
          'public:explore',
          'public:run:event-id',
          'public:run:event-slug',
          'public:schedule:schedule-id',
          'public:schedule:wednesday',
          'public:schedule:club-wednesday',
        ])
      )
      expect(tags).not.toContain('public:runs')
      expect(tags).not.toContain('public:club:unrelated')
    }
  )
})
