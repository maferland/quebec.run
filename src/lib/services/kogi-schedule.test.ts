import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { seedTestData, teardownTestData, testPrisma } from '@/lib/test-seed'
import { getEventsForDay } from './events'

vi.mock('@/lib/prisma', async () => {
  const { testPrisma } = await import('@/lib/test-seed')
  return { prisma: testPrisma }
})

const migration = readFileSync(
  resolve(
    'prisma/migrations/20261012152000_correct_kogi_weekday/migration.sql'
  ),
  'utf8'
)
const tuesdayPattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=15'

describe('Kogi weekday correction migration', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-12T13:00:00Z'))
    await seedTestData()
  })

  afterEach(async () => {
    vi.useRealTimers()
    await teardownTestData()
  })

  it('moves only the incorrect Kogi recurrence to Wednesday and preserves history', async () => {
    const owner = await testPrisma.user.findFirstOrThrow()
    const kogi = await testPrisma.club.create({
      data: { name: 'Kogi', slug: 'kogi', ownerId: owner.id },
    })
    const otherClub = await testPrisma.club.findUniqueOrThrow({
      where: { slug: 'test-running-club' },
    })
    const original = await testPrisma.recurringEvent.create({
      data: {
        title: 'Kogi run',
        slug: 'mardi',
        address: 'Parc du Bois-de-Coulonge',
        clubId: kogi.id,
        schedulePattern: tuesdayPattern,
      },
    })
    const unrelated = await testPrisma.recurringEvent.create({
      data: {
        title: 'Other Tuesday run',
        slug: 'mardi',
        address: 'Other meeting point',
        clubId: otherClub.id,
        schedulePattern: tuesdayPattern,
      },
    })
    const pastOverride = await testPrisma.event.create({
      data: {
        title: 'Past Kogi run',
        date: new Date('2026-10-06T22:15:00Z'),
        time: '18:15',
        address: original.address,
        clubId: kogi.id,
        recurringEventId: original.id,
      },
    })

    expect(await testPrisma.$executeRawUnsafe(migration)).toBe(1)

    const corrected = await testPrisma.recurringEvent.findUniqueOrThrow({
      where: { id: original.id },
    })
    expect(corrected).toMatchObject({
      id: original.id,
      slug: 'mercredi',
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=18;BYMINUTE=15',
    })
    expect(
      await testPrisma.recurringEvent.findUniqueOrThrow({
        where: { id: unrelated.id },
      })
    ).toEqual(unrelated)
    expect(
      await testPrisma.event.findUniqueOrThrow({
        where: { id: pastOverride.id },
      })
    ).toEqual(pastOverride)

    const tuesdayRuns = await getEventsForDay(1)
    const wednesdayRuns = await getEventsForDay(2)
    expect(tuesdayRuns.filter((run) => run.club.slug === 'kogi')).toEqual([])
    expect(tuesdayRuns).toContainEqual(
      expect.objectContaining({
        club: expect.objectContaining({ id: otherClub.id }),
      })
    )
    expect(wednesdayRuns).toContainEqual(
      expect.objectContaining({
        id: 'kogi-mercredi--2026-10-14',
        time: '18:15',
        club: expect.objectContaining({ id: kogi.id }),
      })
    )

    expect(await testPrisma.$executeRawUnsafe(migration)).toBe(0)
    expect(
      await testPrisma.recurringEvent.findUniqueOrThrow({
        where: { id: original.id },
      })
    ).toEqual(corrected)
  })
})
