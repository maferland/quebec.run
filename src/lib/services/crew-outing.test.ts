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
    'prisma/migrations/20261013020000_add_crew_october_outing/migration.sql'
  ),
  'utf8'
)

describe('Crew dated outing migration', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-13T13:00:00Z'))
    await seedTestData()
    const owner = await testPrisma.user.findFirstOrThrow()
    await testPrisma.club.create({
      data: {
        name: 'Le Crew Run Club',
        slug: 'le-crew-run-club',
        ownerId: owner.id,
      },
    })
  })

  afterEach(async () => {
    vi.useRealTimers()
    await teardownTestData()
  })

  it('lists the official Saturday outing once at noon without creating a weekly schedule', async () => {
    expect(await testPrisma.$executeRawUnsafe(migration)).toBe(1)
    expect(await testPrisma.$executeRawUnsafe(migration)).toBe(0)
    expect(await getEventsForDay(4)).toContainEqual(
      expect.objectContaining({
        title: 'Course & Mocktails',
        time: '12:00',
        address: '367 Rue Soumande, Québec, QC G1M 1A5',
        club: expect.objectContaining({ slug: 'le-crew-run-club' }),
      })
    )
    expect(
      await testPrisma.recurringEvent.count({
        where: { club: { slug: 'le-crew-run-club' } },
      })
    ).toBe(0)
    vi.setSystemTime(new Date('2026-10-20T13:00:00Z'))
    expect(
      (await getEventsForDay(4)).filter(
        (run) => run.club.slug === 'le-crew-run-club'
      )
    ).toEqual([])
  })

  it('preserves a manually entered outing on the same day', async () => {
    const club = await testPrisma.club.findUniqueOrThrow({
      where: { slug: 'le-crew-run-club' },
    })
    const existing = await testPrisma.event.create({
      data: {
        title: 'Owner-entered outing',
        clubId: club.id,
        date: new Date('2026-10-17T16:00:00Z'),
        time: '12:00',
      },
    })
    expect(await testPrisma.$executeRawUnsafe(migration)).toBe(0)
    expect(
      await testPrisma.event.findUniqueOrThrow({ where: { id: existing.id } })
    ).toEqual(existing)
  })
})
