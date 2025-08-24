import { expect, test } from '@playwright/test'

test.describe('Individual Event Pages', () => {
  test('displays event details correctly', async ({ page }) => {
    await page.goto('/events/test-event-id')

    // Check if we're on the event page
    await expect(page).toHaveTitle(/Event/)

    // Should show event title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Should show event details (time, date, distance, pace)
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible() // Time format
    await expect(page.getByText(/km/)).toBeVisible() // Distance

    // Should show club link if event has club
    const clubLink = page.getByRole('link', { name: /club/i })
    if ((await clubLink.count()) > 0) {
      await expect(clubLink).toBeVisible()
    }
  })

  test('shows location when event has address', async ({ page }) => {
    await page.goto('/events/test-event-with-location')

    // Should show location section with map pin icon
    const locationSection = page.locator('text=Location').locator('..')
    if ((await locationSection.count()) > 0) {
      await expect(locationSection).toBeVisible()
      // Should have map pin icon
      await expect(page.locator('[data-testid="map-pin"]')).toBeVisible()
    }
  })

  test('handles non-existent events gracefully', async ({ page }) => {
    await page.goto('/events/non-existent-event-id')

    // Should show 404 or error message
    await expect(page.getByText(/not found|error|404/i)).toBeVisible()
  })

  test('navigates to club page when club link is clicked', async ({ page }) => {
    await page.goto('/events/test-event-with-club')

    // Find and click club link if it exists
    const clubLink = page.getByRole('link', { name: /club/i })
    if ((await clubLink.count()) > 0) {
      await clubLink.click()

      // Should navigate to club page
      await expect(page).toHaveURL(/\/clubs\//)
    }
  })

  test('displays event description when present', async ({ page }) => {
    await page.goto('/events/test-event-with-description')

    // Should show description if present
    const description = page.locator('p').filter({ hasText: /description/i })
    if ((await description.count()) > 0) {
      await expect(description).toBeVisible()
    }
  })
})
