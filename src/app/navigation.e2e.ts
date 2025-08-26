import { test, expect } from '@playwright/test'

test.describe('Cross-Page Navigation', () => {
  test('completes full navigation flow: home → clubs → individual club → events → individual event', async ({
    page,
  }) => {
    // Start at homepage
    await page.goto('/')
    await expect(
      page.getByText('Discover Run Clubs in Quebec City')
    ).toBeVisible()

    // Navigate to clubs listing
    await page.getByRole('link', { name: 'Map' }).click()
    await expect(page).toHaveURL('/')

    // Go to calendar
    await page.getByRole('link', { name: 'Calendar' }).click()
    await expect(page).toHaveURL('/calendar')
    await expect(page.getByText('Upcoming Runs Calendar')).toBeVisible()

    // Navigate back to home via Map link
    await page.getByRole('link', { name: 'Map' }).click()
    await expect(page).toHaveURL('/')

    // Wait for clubs to load and click first one
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({
      timeout: 10000,
    })

    const firstClub = page.getByRole('article').first()
    const detailsLink = firstClub.getByText('View details →')
    await expect(detailsLink).toBeVisible()
    await detailsLink.click()

    // Should be on individual club page
    await expect(page).toHaveURL(/\/clubs\/[a-z0-9-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Check for events or navigate to events section
    const hasEvents = await page.getByRole('article').count()
    if (hasEvents > 0) {
      // Click on first event if available
      const firstEvent = page.getByRole('article').first()
      await firstEvent.click()
      await expect(page).toHaveURL(/\/events\//)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })

  test('header navigation works consistently across pages', async ({
    page,
  }) => {
    const pagesToTest = ['/', '/clubs', '/calendar', '/events']

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath)

      // Check that header navigation is present
      await expect(page.getByRole('link', { name: 'Courses' })).toBeVisible()

      // Check Map and Calendar links are present
      await expect(page.getByRole('link', { name: 'Map' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()

      // Test Map link navigation from each page
      await page.getByRole('link', { name: 'Map' }).click()
      await expect(page).toHaveURL('/')

      // Test Calendar link navigation
      await page.getByRole('link', { name: 'Calendar' }).click()
      await expect(page).toHaveURL('/calendar')
    }
  })

  test('back navigation works correctly from all detail pages', async ({
    page,
  }) => {
    // Test club detail → clubs list
    await page.goto('/clubs')
    const clubsPageTitle = page.getByText('Running Clubs')
    if (await clubsPageTitle.isVisible()) {
      const firstClub = page.getByRole('article').first()
      if (await firstClub.isVisible()) {
        await firstClub.click()
        await expect(page).toHaveURL(/\/clubs\/[a-z0-9-]+$/)

        await page.getByText('Back to All Clubs').click()
        await expect(page).toHaveURL('/clubs')
        await expect(clubsPageTitle).toBeVisible()
      }
    }

    // Test event detail → events list (if events exist)
    await page.goto('/events')
    const eventsPageTitle = page.getByText('Running Events')
    if (await eventsPageTitle.isVisible()) {
      const firstEvent = page.getByRole('article').first()
      if (await firstEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstEvent.click()
        await expect(page).toHaveURL(/\/events\//)

        await page.getByText('Back to All Events').click()
        await expect(page).toHaveURL('/events')
        await expect(eventsPageTitle).toBeVisible()
      }
    }
  })

  test('handles deep links and direct URL access', async ({ page }) => {
    // Test direct access to specific club
    await page.goto('/clubs/6am-club')
    await expect(
      page.getByRole('heading', { level: 1, name: '6AM Club' })
    ).toBeVisible()
    await expect(page.getByText('Back to All Clubs')).toBeVisible()

    // Test navigation from direct club access
    await page.getByText('Back to All Clubs').click()
    await expect(page).toHaveURL('/clubs')

    // Test direct access to calendar
    await page.goto('/calendar')
    await expect(page.getByText('Upcoming Runs Calendar')).toBeVisible()

    // Test navigation from calendar
    await page.getByRole('link', { name: 'Map' }).click()
    await expect(page).toHaveURL('/')
  })

  test('loading states appear appropriately during navigation', async ({
    page,
  }) => {
    // Test homepage loading
    await page.goto('/')
    await expect(page.getByText('Loading clubs...')).toBeVisible()

    // Test calendar loading
    await page.goto('/calendar')
    await expect(page.getByText('Loading runs...')).toBeVisible()

    // Verify content eventually loads
    await expect(page.getByText('Upcoming Runs Calendar')).toBeVisible()
  })
})
