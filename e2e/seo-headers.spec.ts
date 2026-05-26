import { test, expect } from '@playwright/test'

const PUBLIC_ROUTES = [
  { path: '/fr', name: 'home (fr)' },
  { path: '/en', name: 'home (en)' },
  { path: '/fr/clubs', name: 'clubs list (fr)' },
  { path: '/en/clubs', name: 'clubs list (en)' },
  { path: '/fr/events', name: 'events list (fr)' },
  { path: '/fr/calendar', name: 'calendar (fr)' },
] as const

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} has canonical, hreflang, OG, and a non-empty title/description`, async ({
    page,
  }) => {
    await page.goto(route.path)

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
    expect(canonical, 'canonical present').toBeTruthy()
    expect(canonical!).toContain(route.path)

    const hreflangs = await page.locator('link[rel="alternate"]').all()
    const langs = await Promise.all(
      hreflangs.map((l) => l.getAttribute('hreflang'))
    )
    expect(langs).toEqual(
      expect.arrayContaining(['fr-CA', 'en-CA', 'x-default'])
    )

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /.+/
    )
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute('content', /.+/)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      /quebec\.run/
    )

    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
    expect(title).toMatch(/quebec\.run/i)

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description?.length).toBeGreaterThan(0)
  })
}

test('home renders Organization + WebSite JSON-LD', async ({ page }) => {
  await page.goto('/fr')
  const scripts = await page.locator('script[type="application/ld+json"]').all()
  const payloads = await Promise.all(scripts.map((s) => s.textContent()))
  const combined = payloads.join('\n')
  expect(combined).toContain('"Organization"')
  expect(combined).toContain('"WebSite"')
})

test('club detail renders SportsOrganization + BreadcrumbList JSON-LD', async ({
  page,
}) => {
  await page.goto('/fr/clubs/fauxmouvement')
  const scripts = await page.locator('script[type="application/ld+json"]').all()
  const payloads = await Promise.all(scripts.map((s) => s.textContent()))
  const combined = payloads.join('\n')
  expect(combined).toContain('"SportsOrganization"')
  expect(combined).toContain('"BreadcrumbList"')
})

test('sitemap.xml is valid + advertises per-locale URLs with hreflang', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml')
  expect(response.ok()).toBe(true)
  const body = await response.text()
  expect(body).toContain('<?xml')
  expect(body).toContain('https://quebec.run/fr')
  expect(body).toContain('https://quebec.run/en')
  expect(body).toContain('hreflang="fr-CA"')
  expect(body).toContain('hreflang="en-CA"')
  expect(body).toContain('hreflang="x-default"')
})

test('robots.txt allows root, disallows /admin, references sitemap', async ({
  request,
}) => {
  const response = await request.get('/robots.txt')
  expect(response.ok()).toBe(true)
  const body = await response.text()
  expect(body).toContain('Allow: /')
  expect(body).toContain('Disallow: /admin')
  expect(body).toContain('Sitemap: https://quebec.run/sitemap.xml')
})
