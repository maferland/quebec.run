import 'dotenv/config'
import { expect, test } from '@playwright/test'
import { encode } from 'next-auth/jwt'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'

test('account deletion evicts direct and organization-owned public routes, preserving unrelated images and surviving HTML', async ({
  request,
  baseURL,
}) => {
  test.skip(!process.env.CI, 'Requires a production build')
  expect(new URL(baseURL!).hostname).toBe('localhost')
  const database = new URL(process.env.DATABASE_URL!)
  expect(['localhost', '127.0.0.1']).toContain(database.hostname)
  expect(database.pathname).toBe('/courses_club_og_cache')
  const pool = new Pool({ connectionString: database.toString() })
  const owner = randomUUID()
  const other = randomUUID()
  const org = randomUUID()
  const stamp = Date.now()
  const fixtures = ['direct', 'organization', 'unrelated'].map((kind) => ({
    id: randomUUID(),
    run: randomUUID(),
    slug: `delete-cache-${kind}-${stamp}`,
    name: `Delete cache ${kind} ${stamp}`,
  }))
  const schedule = randomUUID()
  const date = new Date(Date.now() + 2 * 86400000)
  const day = date.toISOString().slice(0, 10)
  const headers = async (id: string) => ({
    cookie: `next-auth.session-token=${await encode({ secret: 'playwright-local-fixture-secret-at-least-32-characters', token: { sub: id } })}`,
  })
  let setup = false
  let deleted = false
  try {
    // Local-only fixture graph; public reads/deletion use the real HTTP paths.
    // Deliberately assign the organization's club to a different user.
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const id of [owner, other])
        await client.query(
          'INSERT INTO users (id,email,"updatedAt") VALUES ($1,$2,NOW())',
          [id, `${id}@example.test`]
        )
      await client.query(
        'INSERT INTO organizations (id,name,slug,"ownerId","updatedAt") VALUES ($1,$2,$3,$4,NOW())',
        [org, `Deletion org ${stamp}`, `deletion-org-${stamp}`, owner]
      )
      for (const [index, club] of fixtures.entries()) {
        await client.query(
          'INSERT INTO clubs (id,name,slug,"ownerId","organizationId","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',
          [
            club.id,
            club.name,
            club.slug,
            index === 0 ? owner : other,
            index === 1 ? org : null,
          ]
        )
        await client.query(
          'INSERT INTO events (id,title,slug,date,time,"clubId","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())',
          [
            club.run,
            `${club.name} run`,
            `${club.slug}-run`,
            date,
            '12:00',
            club.id,
          ]
        )
      }
      await client.query(
        'INSERT INTO recurring_events (id,slug,title,"schedulePattern","clubId","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',
        [
          schedule,
          'daily',
          'Organization daily run',
          'FREQ=DAILY;BYHOUR=12;BYMINUTE=0',
          fixtures[1].id,
        ]
      )
      await client.query('COMMIT')
      setup = true
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    // The static collection may predate SQL fixture setup. Refresh it through
    // the supported mutation path before proving it was actually warmed.
    expect(
      (
        await request.put(`/api/clubs/${fixtures[0].slug}`, {
          headers: await headers(owner),
          data: { id: fixtures[0].id, name: fixtures[0].name },
        })
      ).ok()
    ).toBe(true)

    const affected = fixtures
      .slice(0, 2)
      .flatMap((club) => [
        `/en/clubs/${club.slug}`,
        `/en/clubs/${club.slug}/opengraph-image`,
        `/en/run/${club.run}`,
        `/en/run/${club.run}/opengraph-image`,
      ])
    affected.push(
      `/en/run/${fixtures[1].slug}-daily--${day}`,
      `/en/run/${fixtures[1].slug}-daily--${day}/opengraph-image`
    )
    const unrelated = [
      `/en/run/${fixtures[2].run}`,
      `/en/run/${fixtures[2].run}/opengraph-image`,
      `/en/clubs/${fixtures[2].slug}/opengraph-image`,
    ]
    for (const path of [
      ...affected,
      ...unrelated,
      '/api/explore/clubs',
      '/en/clubs',
      '/sitemap.xml',
    ]) {
      expect((await request.get(path)).ok()).toBe(true)
      await expect(async () => {
        expect((await request.get(path)).headers()['x-nextjs-cache']).toBe(
          'HIT'
        )
      }).toPass({ timeout: 15000 })
    }
    const before = await (await request.get('/api/explore/clubs')).json()
    for (const club of fixtures)
      expect(before.some((entry: { id: string }) => entry.id === club.id)).toBe(
        true
      )
    const response = await request.post('/api/user/delete', {
      headers: await headers(owner),
      data: {},
    })
    expect(response.status()).toBe(200)
    deleted = true
    // The shared catalogue makes HTML depend on the deletion. Images remain
    // scoped to their own record and must hit on the very first request.
    for (const path of unrelated.slice(1))
      expect((await request.get(path)).headers()['x-nextjs-cache']).toBe('HIT')
    const surviving = await request.get(unrelated[0])
    expect(surviving.status()).toBe(200)
    expect(await surviving.text()).toContain(fixtures[2].name)
    await expect(async () => {
      const response = await request.get(unrelated[0])
      expect(response.status()).toBe(200)
      expect(response.headers()['x-nextjs-cache']).toBe('HIT')
      expect(await response.text()).toContain(fixtures[2].name)
    }).toPass({ timeout: 15000 })
    for (const path of affected)
      await expect(async () => {
        expect((await request.get(path)).status()).toBe(404)
      }).toPass({ timeout: 15000 })
    await expect(async () => {
      const list = await (await request.get('/api/explore/clubs')).json()
      expect(
        list.some(
          (club: { id: string }) =>
            club.id === fixtures[0].id || club.id === fixtures[1].id
        )
      ).toBe(false)
      expect(
        list.some((club: { id: string }) => club.id === fixtures[2].id)
      ).toBe(true)
      const html = await (await request.get('/en/clubs')).text()
      expect(html).not.toContain(fixtures[0].name)
      expect(html).not.toContain(fixtures[1].name)
      const sitemap = await (await request.get('/sitemap.xml')).text()
      expect(sitemap).not.toContain(fixtures[0].slug)
      expect(sitemap).not.toContain(fixtures[1].slug)
    }).toPass({ timeout: 15000 })
  } finally {
    if (setup) {
      if (!deleted)
        await request.post('/api/user/delete', {
          headers: await headers(owner),
          data: {},
        })
      expect(
        (
          await request.post('/api/user/delete', {
            headers: await headers(other),
            data: {},
          })
        ).ok()
      ).toBe(true)
    }
    await pool.end()
  }
})
