import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getTorontoDayBounds } from '@/lib/services/events'
import sitemap from './sitemap'

const paths = (entries: Awaited<ReturnType<typeof sitemap>>) =>
  entries.map((entry) => new URL(entry.url).pathname)

describe('sitemap', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  const seedClub = async () => {
    const user = await prisma.user.create({
      data: { email: 'sitemap@example.com' },
    })
    return prisma.club.create({
      data: { name: 'Sitemap Club', slug: 'sitemap-club', ownerId: user.id },
    })
  }

  it('lists one place URL per meeting address and no dated ones', async () => {
    const club = await seedClub()
    await prisma.recurringEvent.createMany({
      data: [
        {
          title: 'Sitemap Club',
          slug: 'mardi',
          address: '70 Bd Champlain',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
        {
          title: 'Sitemap Club',
          slug: 'jeudi',
          address: '70 Bd Champlain',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=18;BYMINUTE=0',
        },
      ],
    })

    const entries = paths(await sitemap())

    expect(entries).toContain('/fr/clubs/sitemap-club/events/mardi')
    expect(entries).toContain('/en/clubs/sitemap-club/events/mardi')
    expect(entries).not.toContain('/fr/clubs/sitemap-club/events/jeudi')
    expect(
      entries.filter((path) => /events\/[a-z-]+\/\d{4}/.test(path))
    ).toEqual([])
  })

  it('keeps a one-off happening later today', async () => {
    const club = await seedClub()
    await prisma.event.create({
      data: {
        title: 'Tonight only',
        slug: 'tonight-only',
        date: getTorontoDayBounds(0).start,
        time: '18:00',
        clubId: club.id,
      },
    })

    expect(paths(await sitemap())).toContain('/fr/run/tonight-only')
  })

  it('falls back to the id for a one-off with no slug', async () => {
    const club = await seedClub()
    const event = await prisma.event.create({
      data: {
        title: 'Legacy one-off',
        date: getTorontoDayBounds(2).start,
        time: '18:00',
        clubId: club.id,
      },
    })

    expect(paths(await sitemap())).toContain(`/fr/run/${event.id}`)
  })

  it('drops paused clubs entirely', async () => {
    const club = await seedClub()
    await prisma.club.update({
      where: { id: club.id },
      data: { isActive: false },
    })
    await prisma.recurringEvent.create({
      data: {
        title: 'Sitemap Club',
        slug: 'mardi',
        address: '70 Bd Champlain',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      },
    })

    const entries = paths(await sitemap())

    expect(entries).not.toContain('/fr/clubs/sitemap-club')
    expect(entries).not.toContain('/fr/clubs/sitemap-club/events/mardi')
  })
})
