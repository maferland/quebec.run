import { test, expect } from '@playwright/test'
import { encode } from 'next-auth/jwt'

test('new event HTML and preview images cache, refresh on edit, and disappear on delete', async ({
  request,
  baseURL,
}) => {
  test.skip(!process.env.CI, 'Requires a production build')
  // This test creates fixtures through authenticated APIs only on the local
  // isolated test server. Never mint test credentials for a hosted deployment.
  expect(new URL(baseURL!).hostname).toBe('localhost')
  const token = await encode({
    secret: 'playwright-local-fixture-secret-at-least-32-characters',
    token: { sub: 'cache-regression-staff', isStaff: true },
  })
  const headers = { cookie: `next-auth.session-token=${token}` }
  const clubs = await request.get('/api/explore/clubs')
  const club = (await clubs.json())[0]
  expect(club?.id).toBeTruthy()
  const title = `Cache regression ${Date.now()}`
  const date = new Date(Date.now() + 2 * 86400000).toISOString()
  const created = await request.post('/api/events', {
    headers,
    data: { title, date, time: '18:00', clubId: club.id },
  })
  expect(created.status()).toBe(201)
  const event = await created.json()
  const path = `/en/run/${event.id}`
  const imagePath = `${path}/opengraph-image`
  try {
    const first = await request.get(path)
    expect(first.ok()).toBe(true)
    expect(await first.text()).toContain(title)
    const cached = await request.get(path)
    expect(cached.headers()['x-nextjs-cache']).toBe('HIT')
    const image = await request.get(imagePath)
    expect(image.headers()['content-type']).toContain('image/png')
    const originalImage = await image.body()
    const cachedImage = await request.get(imagePath)
    expect(cachedImage.headers()['x-nextjs-cache']).toBe('HIT')

    const updatedTitle = `${title} edited`
    const updated = await request.put(`/api/events/${event.id}`, {
      headers,
      data: { title: updatedTitle },
    })
    expect(updated.ok()).toBe(true)
    // ISR may serve one stale response while regenerating in the background.
    await expect(async () => {
      expect(await (await request.get(path)).text()).toContain(updatedTitle)
    }).toPass()
    await expect(async () => {
      expect(await (await request.get(imagePath)).body()).not.toEqual(
        originalImage
      )
    }).toPass()
  } finally {
    const deleted = await request.delete(`/api/events/${event.id}`, { headers })
    expect(deleted.ok()).toBe(true)
  }
  await expect(async () => {
    expect((await request.get(path)).status()).toBe(404)
    expect((await request.get(imagePath)).status()).toBe(404)
  }).toPass()
})

test('club/place pages and dated redirects cache on first visit with runtime fallback', async ({
  request,
}) => {
  test.skip(!process.env.CI, 'Requires a production build')
  const date = new Date()
  while (date.getUTCDay() !== 2) date.setUTCDate(date.getUTCDate() + 1)
  for (const path of [
    '/en/clubs/fauxmouvement',
    '/en/clubs/fauxmouvement/events/mardi',
    `/en/clubs/fauxmouvement/events/mardi/${date.toISOString().slice(0, 10)}`,
    '/en/clubs/fauxmouvement/opengraph-image',
    '/en/opengraph-image',
  ]) {
    const first = await request.get(path, { maxRedirects: 0 })
    expect([200, 308]).toContain(first.status())
    const cached = await request.get(path, { maxRedirects: 0 })
    expect(cached.headers()['x-nextjs-cache']).toBe('HIT')
  }
})
