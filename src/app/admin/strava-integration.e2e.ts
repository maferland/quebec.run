// src/app/admin/strava-integration.e2e.ts
import { test, expect } from '@playwright/test'

test.describe('Strava Integration', () => {
  test.beforeEach(async () => {
    // TODO: Setup admin user and login
    // This will be implemented when auth E2E helpers exist
    // See: src/lib/test-e2e-helpers.ts for pattern
    test.skip(true, 'Skipping until admin auth E2E helpers are implemented')
  })

  test('admin can preview and link Strava club', async ({ page }) => {
    // Navigate to create club
    await page.goto('/admin/clubs/new')

    // Fill basic club info
    await page.fill('[name="name"]', 'Test Strava Club')
    await page.fill('[name="slug"]', 'test-strava-club')

    // Enter Strava slug
    await page.fill('[id="stravaSlug"]', 'test-club-123456')

    // Click preview (mocked in test)
    await page.click('button:has-text("Preview Club Data")')

    // Verify preview modal appears
    await expect(page.locator('text=Preview')).toBeVisible()

    // TODO: Complete when preview modal implemented (deferred)
    // - Verify club data displayed (name, description, member count)
    // - Verify first 5 events shown
    // - Click "Link & Import" button
    // - Verify success message
    // - Verify events imported
  })

  test('admin can manually sync linked club', async ({ page }) => {
    // TODO: Setup club with Strava link
    // - Create club via API/DB
    // - Link to Strava (set stravaSlug, stravaClubId)
    // - Navigate to edit page

    await page.goto('/admin/clubs/test-linked-club/edit')

    // Click "Sync Now" button
    await page.click('button:has-text("Sync Now")')

    // Verify syncing state
    await expect(page.locator('text=Syncing...')).toBeVisible()

    // Verify completion (mocked Strava response)
    await expect(page.locator('text=Synced successfully')).toBeVisible({
      timeout: 5000,
    })
    await expect(page.locator('text=Last synced')).toBeVisible()
  })

  test('admin can unlink Strava club', async ({ page }) => {
    // TODO: Setup club with Strava link and events
    await page.goto('/admin/clubs/test-linked-club/edit')

    // Click unlink button
    await page.click('button:has-text("Unlink Strava")')

    // Confirm in dialog
    await page.click('button:has-text("Unlink Club")')

    // Verify unlinking completed
    await expect(page.locator('text=Club unlinked')).toBeVisible()
    await expect(page.locator('[id="stravaSlug"]')).toBeVisible()
  })
})
