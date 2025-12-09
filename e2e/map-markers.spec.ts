import { test, expect } from '@playwright/test'

test.describe('Map Markers', () => {
  test('displays event map on homepage', async ({ page }) => {
    await page.goto('/en')

    // Wait for map to load
    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()
  })

  test('displays event map on events page', async ({ page }) => {
    await page.goto('/en/events')

    // Wait for map to load
    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()

    // Should have section headers
    await expect(
      page.getByRole('heading', { name: /events near you/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /all events/i })
    ).toBeVisible()
  })

  test('shows empty state when no geocoded events', async ({ page }) => {
    // This test assumes a clean DB or no geocoded events
    await page.goto('/en/events')

    const emptyMessage = page.getByText(
      /events will appear on the map once addresses are geocoded/i
    )
    await expect(emptyMessage).toBeVisible()
  })
})
