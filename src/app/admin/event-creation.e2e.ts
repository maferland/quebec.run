import { test, expect } from '@playwright/test'

/**
 * E2E test for event creation redirect behavior
 *
 * NOTE: These tests require authentication. Run with authenticated session or skip if auth not configured.
 * To run: npx playwright test event-creation.e2e.ts --headed
 */

test.describe.skip('Admin Event Creation - Redirect Behavior', () => {
  test('redirects to events list after creating event', async ({ page }) => {
    // TODO: Setup authentication before running this test
    // For now, manually navigate to page if logged in

    await page.goto('/admin/events/new')

    // Fill out event form
    await page.getByLabel(/title/i).fill('Test Morning Run')
    await page.getByLabel(/date/i).fill('2025-12-25')
    await page.getByLabel(/time/i).fill('09:00')
    await page.getByLabel(/meeting location/i).fill('123 Test Street, Quebec')

    // Submit form
    await page.getByRole('button', { name: /create/i }).click()

    // Should redirect to events list
    await expect(page).toHaveURL(/\/admin\/events$/, { timeout: 5000 })
  })

  test('button is disabled during submission to prevent double submit', async ({
    page,
  }) => {
    await page.goto('/admin/events/new')

    // Fill form
    await page.getByLabel(/title/i).fill('Double Submit Test')
    await page.getByLabel(/date/i).fill('2025-12-25')
    await page.getByLabel(/time/i).fill('09:00')
    await page.getByLabel(/meeting location/i).fill('123 Test Street')

    const submitButton = page.getByRole('button', { name: /create/i })

    // Button should be enabled initially
    await expect(submitButton).toBeEnabled()

    // Click submit
    await submitButton.click()

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled()

    // Wait for redirect
    await expect(page).toHaveURL(/\/admin\/events$/, { timeout: 5000 })
  })
})
