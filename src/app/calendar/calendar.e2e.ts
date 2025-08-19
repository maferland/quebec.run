import { test, expect } from '@playwright/test'

test.describe('Calendar Page', () => {
  test('displays upcoming runs calendar', async ({ page }) => {
    await page.goto('/calendar')

    // Check page title and main heading
    await expect(page.getByText('Upcoming Runs Calendar')).toBeVisible()
    await expect(
      page.getByText(
        'Browse all scheduled runs and events from Quebec City run clubs.'
      )
    ).toBeVisible()

    // Should show either runs or no runs message
    const hasRuns = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (hasRuns) {
      // If runs exist, check run card structure using semantic queries
      const firstRun = page.getByRole('article').first()
      await expect(firstRun.getByRole('heading', { level: 3 })).toBeVisible() // Run title
      await expect(firstRun.getByText(/\d{1,2}:\d{2}/)).toBeVisible() // Time
    } else {
      // If no runs, should show empty state (check for various possible messages)
      const emptyStateVisible = await Promise.race([
        page.getByText('No upcoming runs scheduled.').isVisible().catch(() => false),
        page.getByText('No runs found').isVisible().catch(() => false),
        page.getByText('No upcoming runs').isVisible().catch(() => false),
        page.getByText('Coming soon').isVisible().catch(() => false),
      ])
      expect(emptyStateVisible).toBeTruthy()
    }
  })

  test('navigates back to home page', async ({ page }) => {
    await page.goto('/calendar')

    // Click on Map link (which goes to home)
    await page.getByRole('link', { name: 'Map' }).click()

    // Should navigate back to home page
    await expect(page).toHaveURL('/')
    await expect(
      page.getByText('Discover Run Clubs in Quebec City')
    ).toBeVisible()
  })

  test('shows loading state initially', async ({ page }) => {
    await page.goto('/calendar')

    // Should show loading text briefly
    await expect(page.getByText('Loading runs...')).toBeVisible()
  })
})
