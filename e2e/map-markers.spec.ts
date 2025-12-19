import { test, expect } from '@playwright/test'

test.describe('Map Markers', () => {
  test('displays event map on homepage', async ({ page }) => {
    await page.goto('/en')

    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()

    await expect(page).toHaveScreenshot('homepage.png', { fullPage: true })
  })

  test('displays event map on events page', async ({ page }) => {
    await page.goto('/en/events')

    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()

    await expect(
      page.getByRole('heading', { name: /events near you/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /all events/i })
    ).toBeVisible()

    await expect(page).toHaveScreenshot('events-page.png', { fullPage: true })
  })
})
