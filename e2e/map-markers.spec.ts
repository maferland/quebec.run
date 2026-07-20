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
    ).toBeVisible()
    await expect(page.getByText(/weekly schedule/i)).toBeVisible()
  })

  test('selected run is URL-addressable', async ({ page, request }) => {
    const response = await request.get('/api/explore/runs?day=0')
    expect(response.ok()).toBe(true)
    const runs = (await response.json()) as { id: string; title: string }[]
    const run = runs[0]
    expect(run).toBeTruthy()

    await page.goto('/en')
    await page.getByText(run.title, { exact: false }).first().click()
    await expect(page).toHaveURL(
      new RegExp(`run=${encodeURIComponent(run.id)}`)
    )
    await expect(page.locator('.pin.is-active')).toBeVisible()

    await page
      .getByRole('button', { name: /details/i })
      .first()
      .click()
    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}$`))
    await expect(page.getByRole('heading', { name: run.title })).toBeVisible()
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
