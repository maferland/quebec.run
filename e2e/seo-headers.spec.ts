import { test, expect } from '@playwright/test'

const PUBLIC_ROUTES = [
  { path: '/fr', name: 'home (fr)' },
  { path: '/en', name: 'home (en)' },
  { path: '/fr/clubs/fauxmouvement', name: 'club detail (fr)' },
  { path: '/en/clubs/fauxmouvement', name: 'club detail (en)' },
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
  expect(body).toContain('https://www.quebec.run/fr')
  expect(body).toContain('https://www.quebec.run/en')
  expect(body).toContain('hreflang="fr-CA"')
  expect(body).toContain('hreflang="en-CA"')
  expect(body).toContain('hreflang="x-default"')
})

test.describe('explore panels ship real HTML with no client JS required', () => {
  const TUESDAY_ISO = (() => {
    const d = new Date()
    while (d.getDay() !== 2) d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })()

  test('run panel', async ({ request }) => {
    const response = await request.get(
      `/fr/run/fauxmouvement-mardi--${TUESDAY_ISO}`
    )
    expect(response.ok()).toBe(true)
    const body = await response.text()
    expect(body).toContain('Faux Mouvement')
  })

  test('club panel', async ({ request }) => {
    const response = await request.get('/fr/clubs/fauxmouvement')
    expect(response.ok()).toBe(true)
    const body = await response.text()
    expect(body).toContain('Faux Mouvement')
  })

  test('place panel', async ({ request }) => {
    const response = await request.get('/fr/clubs/fauxmouvement/events/mardi')
    expect(response.ok()).toBe(true)
    const body = await response.text()
    expect(body).toContain('Faux Mouvement')
  })
})

test.describe('per-entity opengraph-image routes render a real image', () => {
  const TUESDAY_ISO = (() => {
    const d = new Date()
    while (d.getDay() !== 2) d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })()

  test('club route', async ({ request }) => {
    const response = await request.get(
      '/en/clubs/fauxmouvement/opengraph-image'
    )
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('image')
  })

  test('run route', async ({ request }) => {
    const response = await request.get(
      `/en/run/fauxmouvement-mardi--${TUESDAY_ISO}/opengraph-image`
    )
    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('image')
  })

  test('run route 404s for an unknown event id', async ({ request }) => {
    const response = await request.get('/en/run/does-not-exist/opengraph-image')
    expect(response.status()).toBe(404)
  })
})

test('robots.txt allows root, disallows /admin, references sitemap', async ({
  request,
}) => {
  const response = await request.get('/robots.txt')
  expect(response.ok()).toBe(true)
  const body = await response.text()
  expect(body).toContain('Allow: /')
  expect(body).toContain('Disallow: /en/admin/')
  expect(body).toContain('Disallow: /fr/admin/')
  expect(body).toContain('Sitemap: https://www.quebec.run/sitemap.xml')
})
