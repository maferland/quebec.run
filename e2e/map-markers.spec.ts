import { test, expect } from '@playwright/test'

test.describe('Map Markers', () => {
  test('displays event map on homepage', async ({ page }) => {
    await page.goto('/en')

    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()
  })

  test('shows club count independent of selected day', async ({
    page,
    request,
  }) => {
    const response = await request.get('/api/explore/clubs')
    expect(response.ok()).toBe(true)
    const clubs = (await response.json()) as unknown[]
    expect(clubs.length).toBeGreaterThan(0)

    await page.goto('/en?day=4')

    await expect(
      page.getByRole('button', { name: new RegExp(`Clubs\\s+${clubs.length}`) })
    ).toBeVisible()
  })

  test('canonical club route renders map-first detail view', async ({
    page,
  }) => {
    await page.goto('/en/clubs/fauxmouvement')

    await expect(
      page.getByRole('application', { name: /interactive event map/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/weekly schedule/i)).toBeVisible()
  })

  test('selected run is URL-addressable', async ({ page, request }) => {
    const response = await request.get('/api/explore/runs?day=1')
    expect(response.ok()).toBe(true)
    const runs = (await response.json()) as { id: string; title: string }[]
    const run = runs[0]
    expect(run).toBeTruthy()

    await page.goto('/en?day=1')
    await page.getByText(run.title, { exact: false }).first().click()
    await expect(page).toHaveURL(
      new RegExp(
        `(/en/run/${encodeURIComponent(run.id)}|run=${encodeURIComponent(run.id)})`
      )
    )
    await expect(page.locator('.pin.is-active')).toBeVisible()

    if (!page.url().includes(`/en/run/${encodeURIComponent(run.id)}`)) {
      await page
        .getByRole('button', { name: /details/i })
        .first()
        .click()
    }
    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}(?:\\?.*)?$`))
    await expect(
      page.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible()
    await expect(page.locator('.pin.is-active')).toBeVisible()

    const deepLinkPage = await page.context().newPage()
    await deepLinkPage.goto(`/en/run/${encodeURIComponent(run.id)}`)
    await expect(
      deepLinkPage.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible()
    await expect(deepLinkPage.locator('.pin.is-active')).toBeVisible({
      timeout: 15000,
    })
    await deepLinkPage.close()
  })

  test('opens a shaped detail skeleton while prefetched data loads', async ({
    page,
    request,
  }) => {
    const response = await request.get('/api/explore/runs?day=1')
    expect(response.ok()).toBe(true)
    const runs = (await response.json()) as { id: string; title: string }[]
    const run = runs[0]
    expect(run).toBeTruthy()

    let detailRequests = 0
    await page.route(`**/api/explore/runs/${run.id}`, async (route) => {
      detailRequests += 1
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })

    await page.goto('/en?day=1')
    const runTitle = page.getByText(run.title, { exact: false }).first()
    await runTitle.hover()
    await expect.poll(() => detailRequests).toBe(1)
    await runTitle.hover()
    expect(detailRequests).toBe(1)

    await runTitle.click()
    await expect(page.locator('.qr-detail-shell')).toBeVisible()
    await expect(
      page.locator('.qr-detail-shell [aria-busy="true"]')
    ).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}`))
    await expect(
      page.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible({ timeout: 15000 })
    expect(detailRequests).toBe(1)
  })

  test('direct run detail highlights the active map pin', async ({ page }) => {
    const runId = 'fauxmouvement-mardi--2026-07-21'
    await page.goto(`/en/run/${runId}`)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.pin.is-active')).toHaveCount(1)
    await expect(page.locator('.pin.is-muted').first()).toBeVisible()
    await expect(page.getByText(/Café de Course/)).toBeVisible()

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.locator('.qr-detail-shell.is-exiting')).toHaveCount(1)
    await expect(page).toHaveURL(/\/en$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toHaveCount(0)
  })

  test.describe('map-first home', () => {
    test('renders the desktop map', async ({ page, viewport }) => {
      test.skip(!viewport || viewport.width < 1024, 'desktop layout only')
      await page.goto('/en')

      const map = page.getByRole('application', {
        name: /interactive event map/i,
      })
      await expect(map).toBeVisible()
    })

    test('renders the mobile map', async ({ page, viewport }) => {
      test.skip(!viewport || viewport.width >= 1024, 'mobile layout only')
      await page.goto('/en')

      const map = page.getByRole('application', {
        name: /interactive event map/i,
      })
      await expect(map).toBeVisible()
    })
  })
})
