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
    'prisma/migrations/20261013090000_correct_verified_club_details/migration.sql'
  ),
  'utf8'
)
const oldWednesday = 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0'
const corrections = [
  {
    slug: 'volt',
    original: {
      description:
        'Club de course structuré — entraînements lundi et mercredi 19h. 260$/an ou 90$/trimestre.',
    },
    expected: {
      description:
        'Club de course structuré — entraînements lundi 19h et mercredi 18h30.',
    },
    edited: { description: 'Organizer description' },
  },
  {
    slug: 'les-citrons-presses',
    original: {
      description:
        'Club de course social — 5km ou 10km (~6:00/km). Lundi et mercredi aux 2 semaines.',
    },
    expected: {
      description:
        'Club de course social — 5km ou 10km (~6:00/km). Lundi et mercredi.',
    },
    edited: { description: 'Organizer description' },
  },
  {
    slug: 'la-panthere',
    original: { instagram: 'clublapanthere' },
    expected: { instagram: 'club.la.panthere' },
    edited: { instagram: 'organizer.account' },
  },
  {
    slug: 'le-coureur-nordique',
    original: { beginnerFriendly: true },
    expected: { beginnerFriendly: false },
    edited: { beginnerFriendly: false },
  },
]

describe('verified club detail correction migration', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-12T13:00:00Z'))
    await seedTestData()
  })

  afterEach(async () => {
    vi.useRealTimers()
    await teardownTestData()
  })

  it.each(corrections)(
    'corrects $slug without changing unrelated clubs or edited values',
    async ({ slug, original, expected, edited }) => {
      const owner = await testPrisma.user.findFirstOrThrow()
      const club = await testPrisma.club.create({
        data: { name: slug, slug, ownerId: owner.id, ...original },
      })
      const unrelated = await testPrisma.club.create({
        data: {
          name: 'Other club',
          slug: 'other-club',
          ownerId: owner.id,
          ...original,
        },
      })

      await testPrisma.$executeRawUnsafe(migration)
      const corrected = await testPrisma.club.findUniqueOrThrow({
        where: { id: club.id },
      })
      expect(corrected).toMatchObject({ id: club.id, slug, ...expected })
      expect(
        await testPrisma.club.findUniqueOrThrow({ where: { id: unrelated.id } })
      ).toEqual(unrelated)

      await testPrisma.$executeRawUnsafe(migration)
      expect(
        await testPrisma.club.findUniqueOrThrow({ where: { id: club.id } })
      ).toEqual(corrected)

      const organizerEdited = await testPrisma.club.update({
        where: { id: club.id },
        data: edited,
      })
      await testPrisma.$executeRawUnsafe(migration)
      expect(
        await testPrisma.club.findUniqueOrThrow({ where: { id: club.id } })
      ).toEqual(organizerEdited)
    }
  )

  it('renders Volt Wednesday at 18:30 while preserving IDs, slugs, history and edited schedules', async () => {
    const owner = await testPrisma.user.findFirstOrThrow()
    const volt = await testPrisma.club.create({
      data: { name: 'Volt', slug: 'volt', ownerId: owner.id },
    })
    const otherClub = await testPrisma.club.findUniqueOrThrow({
      where: { slug: 'test-running-club' },
    })
    const original = await testPrisma.recurringEvent.create({
      data: {
        title: 'Volt',
        slug: 'mercredi',
        clubId: volt.id,
        schedulePattern: oldWednesday,
      },
    })
    const unrelated = await testPrisma.recurringEvent.create({
      data: {
        title: 'Other run',
        slug: 'mercredi',
        clubId: otherClub.id,
        schedulePattern: oldWednesday,
      },
    })
    const otherSlot = await testPrisma.recurringEvent.create({
      data: {
        title: 'Organizer run',
        slug: 'special',
        clubId: volt.id,
        schedulePattern: oldWednesday,
      },
    })
    const history = await testPrisma.event.create({
      data: {
        title: 'Past Volt',
        date: new Date('2026-10-07T23:00:00Z'),
        time: '19:00',
        clubId: volt.id,
        recurringEventId: original.id,
      },
    })

    await testPrisma.$executeRawUnsafe(migration)
    const corrected = await testPrisma.recurringEvent.findUniqueOrThrow({
      where: { id: original.id },
    })
    expect(corrected).toMatchObject({
      id: original.id,
      slug: original.slug,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=18;BYMINUTE=30',
    })
    expect(
      await testPrisma.event.findUniqueOrThrow({ where: { id: history.id } })
    ).toEqual(history)
    expect(
      await testPrisma.recurringEvent.findUniqueOrThrow({
        where: { id: unrelated.id },
      })
    ).toEqual(unrelated)
    expect(
      await testPrisma.recurringEvent.findUniqueOrThrow({
        where: { id: otherSlot.id },
      })
    ).toEqual(otherSlot)
    expect(await getEventsForDay(2)).toContainEqual(
      expect.objectContaining({
        id: 'volt-mercredi--2026-10-14',
        time: '18:30',
      })
    )

    await testPrisma.$executeRawUnsafe(migration)
    expect(
      await testPrisma.recurringEvent.findUniqueOrThrow({
        where: { id: original.id },
      })
    ).toEqual(corrected)

    const edited = await testPrisma.recurringEvent.update({
      where: { id: original.id },
      data: { schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=17;BYMINUTE=0' },
    })
    await testPrisma.$executeRawUnsafe(migration)
    expect(
      await testPrisma.recurringEvent.findUniqueOrThrow({
        where: { id: original.id },
      })
    ).toEqual(edited)
  })
})
