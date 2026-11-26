import { test, expect } from '@playwright/test'

for (const locale of ['fr', 'en']) {
  test(`${locale} catalogue remains crawlable without JavaScript`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`/${locale}/clubs`)
    await expect(
      page.getByRole('link', { name: /Faux Mouvement/i }).first()
    ).toBeVisible()
    await context.close()
  })
}

test('production catalogue responses use the full route cache', async ({
  request,
}) => {
  test.skip(!process.env.CI, 'Full route caching requires a production build')
  for (const path of ['/fr', '/en', '/fr/clubs', '/en/clubs']) {
    let response = await request.get(path)
    await expect(async () => {
      response = await request.get(path)
      expect(response.headers()['x-nextjs-cache']).toBe('HIT')
    }).toPass({ timeout: 15000 })
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toContain(
      path.endsWith('/clubs') ? 's-maxage=31536000' : 's-maxage=86400'
    )
    expect(response.headers()['x-nextjs-cache']).toBe('HIT')
  }
})

test('cached shell hydrates URL filters and follows history changes', async ({
  page,
}) => {
  await page.goto('/fr?day=2&beginner=1')
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute(
    'href',
    '/en?day=2&beginner=1'
  )
  await page.evaluate(() => window.history.replaceState(null, '', '/fr?day=3'))
  await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute(
    'href',
    '/en?day=3'
  )
})
