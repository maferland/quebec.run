import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('displays run clubs and navigation', async ({ page }) => {
    await page.goto('/')

    // Check page title and header
    await expect(page).toHaveTitle(/Quebec Run Clubs/)
    await expect(page.getByRole('link', { name: 'Courses' })).toBeVisible()

    // Check main heading
    await expect(
      page.getByText('Discover Run Clubs in Quebec City')
    ).toBeVisible()

    // Check navigation links
    await expect(page.getByRole('link', { name: 'Map' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()

    // Check featured clubs section
    await expect(page.getByText('Featured Run Clubs')).toBeVisible()

    // Wait for clubs content to load using semantic queries
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({ timeout: 10000 })

    // Find the first club article and validate its content
    const firstClubCard = page.getByRole('article').first()
    await expect(firstClubCard.getByRole('heading', { level: 3 })).toContainText(/\w+/) // Has club name
    await expect(firstClubCard.getByText(/Quebec|Running|Club|Run/)).toBeVisible() // Has relevant content
  })

  test('navigates to calendar page', async ({ page }) => {
    await page.goto('/')

    // Click on Calendar link
    await page.getByRole('link', { name: 'Calendar' }).click()

    // Should navigate to calendar page
    await expect(page).toHaveURL('/calendar')
    await expect(page.getByText('Upcoming Runs Calendar')).toBeVisible()
  })

  test('shows loading state initially', async ({ page }) => {
    await page.goto('/')

    // Should show loading text briefly
    await expect(page.getByText('Loading clubs...')).toBeVisible()
  })
})
