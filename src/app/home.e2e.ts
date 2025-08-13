import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('displays run clubs and navigation', async ({ page }) => {
    await page.goto('/')

    // Check page title and header
    await expect(page).toHaveTitle(/Quebec Run Clubs/)
    await expect(page.getByText('Courses')).toBeVisible()
    
    // Check main heading
    await expect(page.getByText('Discover Run Clubs in Quebec City')).toBeVisible()
    
    // Check navigation links
    await expect(page.getByText('Map')).toBeVisible()
    await expect(page.getByText('Calendar')).toBeVisible()
    
    // Check featured clubs section
    await expect(page.getByText('Featured Run Clubs')).toBeVisible()
    
    // Wait for clubs to load and check if at least one club is displayed
    await expect(page.locator('[data-testid="club-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // Check that club cards have expected content structure
    const firstClub = page.locator('[data-testid="club-card"]').first()
    await expect(firstClub.locator('h3')).toBeVisible() // Club name
    await expect(firstClub.locator('p')).toBeVisible() // Club description
  })

  test('navigates to calendar page', async ({ page }) => {
    await page.goto('/')
    
    // Click on Calendar link
    await page.getByText('Calendar').click()
    
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