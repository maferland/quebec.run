import { test, expect } from '@playwright/test'

test.describe('Map Markers', () => {
  test('displays event map on homepage', async ({ page }) => {
    await page.goto('/en')

    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()
  })

  test.describe('events page', () => {
    test('renders the desktop side-by-side map', async ({ page, viewport }) => {
      test.skip(!viewport || viewport.width < 1024, 'desktop layout only')
      await page.goto('/en/events')

      const map = page.getByRole('application', {
        name: /interactive event map/i,
      })
      await expect(map).toBeVisible()
    })

    test('exposes the mobile map via floating button', async ({
      page,
      viewport,
    }) => {
      test.skip(
        !viewport || viewport.width >= 1024,
        'mobile floating button only'
      )
      await page.goto('/en/events')

      const openMap = page.getByRole('button', { name: /open events map/i })
      await expect(openMap).toBeVisible()
      await openMap.click()

      const map = page.getByRole('application', {
        name: /interactive event map/i,
      })
      await expect(map).toBeVisible()
    })
  })
})
