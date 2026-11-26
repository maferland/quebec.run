import { expect, test } from '@playwright/test'
import { encode } from 'next-auth/jwt'

test('editing one run preserves unrelated image caches and refreshes affected HTML', async ({
  request,
  baseURL,
}) => {
  test.skip(!process.env.CI, 'Requires a production build')
  expect(new URL(baseURL!).hostname).toBe('localhost')
  const token = await encode({
    secret: 'playwright-local-fixture-secret-at-least-32-characters',
    token: { sub: 'cache-regression-staff', isStaff: true },
  })
  const headers = { cookie: `next-auth.session-token=${token}` }
  const clubs = await (await request.get('/api/explore/clubs')).json()
  expect(clubs[0]?.id).toBeTruthy()
  const ids: string[] = []
  const title = `Targeted cache ${Date.now()}`
  try {
    for (const suffix of ['A', 'B']) {
      const result = await request.post('/api/events', {
        headers,
        data: {
          title: `${title} ${suffix}`,
          date: new Date(Date.now() + 2 * 86400000).toISOString(),
          time: '18:00',
          clubId: clubs[0].id,
        },
      })
      expect(result.status()).toBe(201)
      ids.push((await result.json()).id)
    }
    const untouched = `/en/run/${ids[1]}`
    const image = `/en/clubs/${clubs[0].slug}/opengraph-image`
    const untouchedImage = `${untouched}/opengraph-image`
    for (const path of [
      untouched,
      untouchedImage,
      image,
      `/en/run/${ids[0]}`,
    ]) {
      expect((await request.get(path)).status()).toBe(200)
      await expect(async () => {
        expect((await request.get(path)).headers()['x-nextjs-cache']).toBe(
          'HIT'
        )
      }).toPass()
    }
    const edited = await request.put(`/api/events/${ids[0]}`, {
      headers,
      data: { title: `${title} changed` },
    })
    expect(edited.ok()).toBe(true)
    // Images have scoped data dependencies. HTML also embeds the shared
    // catalogue, so it may regenerate after an edit even for another run.
    for (const path of [image, untouchedImage])
      expect((await request.get(path)).headers()['x-nextjs-cache']).toBe('HIT')
    const surviving = await request.get(untouched)
    expect(surviving.status()).toBe(200)
    expect(await surviving.text()).toContain(`${title} B`)
    await expect(async () => {
      const response = await request.get(untouched)
      expect(response.status()).toBe(200)
      expect(await response.text()).toContain(`${title} B`)
      expect(response.headers()['x-nextjs-cache']).toBe('HIT')
    }).toPass({ timeout: 15000 })
    await expect(async () => {
      expect(await (await request.get(`/en/run/${ids[0]}`)).text()).toContain(
        `${title} changed`
      )
    }).toPass({ timeout: 15000 })
  } finally {
    for (const id of ids) {
      expect(
        (await request.delete(`/api/events/${id}`, { headers })).ok()
      ).toBe(true)
    }
  }
})
