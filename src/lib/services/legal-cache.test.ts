import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'
import { deleteUserAccount } from './legal'

const { entries, expired, revalidatedPaths } = vi.hoisted(() => ({
  entries: new Map<string, { value: Promise<unknown>; tags: string[] }>(),
  expired: [] as string[],
  revalidatedPaths: [] as string[],
}))
vi.mock('next/cache', () => ({
  unstable_cache:
    (
      callback: (...args: unknown[]) => Promise<unknown>,
      keys: string[],
      options: { tags?: string[] }
    ) =>
    (...args: unknown[]) => {
      const key = JSON.stringify([keys, args])
      if (!entries.has(key))
        entries.set(key, { value: callback(...args), tags: options.tags ?? [] })
      return entries.get(key)!.value
    },
  revalidateTag: (tag: string) => {
    expired.push(tag)
    for (const [key, entry] of entries)
      if (entry.tags.includes(tag)) entries.delete(key)
  },
  revalidatePath: (path: string) => revalidatedPaths.push(path),
}))

let clubs: typeof import('./clubs')
let events: typeof import('./events')
beforeAll(async () => {
  vi.stubEnv('NODE_ENV', 'production')
  clubs = await import('./clubs')
  events = await import('./events')
})
beforeEach(async () => {
  entries.clear()
  expired.length = 0
  revalidatedPaths.length = 0
  await cleanDatabase()
})
afterAll(() => vi.unstubAllEnvs())

it('evicts the full account/organization cascade while preserving unrelated cached identities', async () => {
  const owner = await prisma.user.create({
    data: { email: 'deleted@example.com' },
  })
  const other = await prisma.user.create({
    data: { email: 'survivor@example.com' },
  })
  const org = await prisma.organization.create({
    data: { name: 'Owned org', slug: 'owned-org', ownerId: owner.id },
  })
  const direct = await prisma.club.create({
    data: { name: 'Direct', slug: 'direct', ownerId: owner.id },
  })
  const indirect = await prisma.club.create({
    data: {
      name: 'Indirect',
      slug: 'indirect',
      ownerId: other.id,
      organizationId: org.id,
    },
  })
  const survivor = await prisma.club.create({
    data: { name: 'Survivor', slug: 'survivor', ownerId: other.id },
  })
  const unaffected = await prisma.club.create({
    data: { name: 'Unaffected', slug: 'unaffected', ownerId: other.id },
  })
  const date = new Date('2026-12-01T12:00:00Z')
  const run = await prisma.event.create({
    data: {
      title: 'Direct run',
      slug: 'direct-run',
      clubId: direct.id,
      date,
      time: '12:00',
    },
  })
  const linkedRun = await prisma.event.create({
    data: {
      title: 'Org run',
      slug: 'org-run',
      organizationId: org.id,
      clubId: survivor.id,
      date,
      time: '12:00',
    },
  })
  const orgOnlyRun = await prisma.event.create({
    data: {
      title: 'Org only',
      slug: 'org-only',
      organizationId: org.id,
      date,
      time: '12:00',
    },
  })
  const schedule = await prisma.recurringEvent.create({
    data: {
      title: 'Indirect schedule',
      slug: 'daily',
      clubId: indirect.id,
      schedulePattern: 'FREQ=DAILY;BYHOUR=12;BYMINUTE=0',
    },
  })
  const detachedRun = await prisma.event.create({
    data: {
      title: 'Surviving run with deleted schedule',
      clubId: survivor.id,
      recurringEventId: schedule.id,
      date,
      time: '12:00',
    },
  })
  await prisma.address.create({
    data: {
      label: 'Org address',
      address: 'Local fixture',
      latitude: 46.8,
      longitude: -71.2,
      clubId: survivor.id,
      organizationId: org.id,
    },
  })

  await clubs.getClubsForExplore()
  expect(
    await events.getEventById({ data: { id: detachedRun.id } })
  ).toHaveProperty('recurringEventId', schedule.id)
  for (const club of [direct, indirect, survivor, unaffected]) {
    await clubs.getClubBySlug({ slug: club.slug })
    await clubs.getClubImageName({ slug: club.slug })
  }
  for (const id of [run.id, run.slug!, linkedRun.id, orgOnlyRun.id])
    await events.getEventById({ data: { id } })
  const virtualIds = [
    `indirect-daily--2026-12-01`,
    `${schedule.id}:2026-12-01`,
    'daily--2026-12-01',
  ]
  for (const id of virtualIds)
    expect(await events.getEventById({ data: { id } })).not.toBeNull()
  const preserved = [...entries.entries()].filter(([, entry]) =>
    entry.tags.some((tag) =>
      [
        'public:club:unaffected',
        'public:club-image:unaffected',
        'public:club-image:survivor',
      ].includes(tag)
    )
  )
  expect(preserved).toHaveLength(3)

  expect(
    await deleteUserAccount({
      user: { id: owner.id, isStaff: false },
      data: {},
    })
  ).toEqual({ success: true })

  expect(
    await prisma.club.findUnique({ where: { id: indirect.id } })
  ).toBeNull()
  expect(await clubs.getClubBySlug({ slug: direct.slug })).toBeNull()
  expect(await clubs.getClubBySlug({ slug: indirect.slug })).toBeNull()
  expect(await clubs.getClubImageName({ slug: indirect.slug })).toBeNull()
  expect(
    await events.getEventById({ data: { id: detachedRun.id } })
  ).toHaveProperty('recurringEventId', null)
  for (const id of [
    run.id,
    run.slug!,
    linkedRun.id,
    orgOnlyRun.id,
    ...virtualIds,
  ])
    expect(await events.getEventById({ data: { id } })).toBeNull()
  const list = await clubs.getClubsForExplore()
  expect(list.map((club) => club.slug).sort()).toEqual([
    'survivor',
    'unaffected',
  ])
  expect(list.find((club) => club.id === survivor.id)?.lat).toBeNull()
  expect(expired).toEqual(
    expect.arrayContaining([
      'public:clubs',
      'public:explore',
      `public:club-id:${survivor.id}`,
      'public:club:survivor',
    ])
  )
  expect(revalidatedPaths).toContain('/sitemap.xml')
  for (const [key, entry] of preserved) expect(entries.get(key)).toBe(entry)
})

it('does not evict public data when the account deletion fails', async () => {
  const owner = await prisma.user.create({
    data: { email: 'retained@example.com' },
  })
  const club = await prisma.club.create({
    data: { name: 'Retained', slug: 'retained', ownerId: owner.id },
  })
  const image = await clubs.getClubImageName({ slug: club.slug })
  await expect(
    deleteUserAccount({
      user: { id: 'missing-user', isStaff: false },
      data: {},
    })
  ).rejects.toThrow()
  expect(expired).toHaveLength(0)
  expect(await clubs.getClubImageName({ slug: club.slug })).toBe(image)
  expect(
    await prisma.club.findUnique({ where: { id: club.id } })
  ).not.toBeNull()
})
