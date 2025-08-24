import { test, expect } from '@playwright/test'

test.describe('Club Pages with Slug Routing', () => {
  test('displays clubs list page', async ({ page }) => {
    await page.goto('/clubs')

    // Check page content
    await expect(page.getByText('Running Clubs')).toBeVisible()

    // Wait for clubs to load and verify club card content
    const firstClubCard = page.getByTestId('club-card').first()
    await expect(firstClubCard).toBeVisible()
    await expect(firstClubCard.getByRole('heading', { level: 2 })).toBeVisible()
    await expect(firstClubCard.getByText('View details →')).toBeVisible()
  })

  test('navigates from clubs list to individual club using slug', async ({
    page,
  }) => {
    await page.goto('/clubs')

    // Find and click the first club card link
    const firstClubCard = page.getByTestId('club-card').first()
    await expect(firstClubCard).toBeVisible()
    await firstClubCard.click()

    // Should navigate to a slug-based URL (not CUID)
    await expect(page).toHaveURL(/\/clubs\/[a-z0-9-]+$/)

    // URL should NOT contain CUID pattern (long string starting with 'c')
    const currentUrl = page.url()
    expect(currentUrl).not.toMatch(/\/clubs\/c[a-z0-9]{20,}/)

    // Should show club page content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Upcoming Events')).toBeVisible()
    await expect(page.getByText('Back to All Clubs')).toBeVisible()
  })

  test('displays 6AM Club with slug URL', async ({ page }) => {
    // Test the specific known slug
    await page.goto('/clubs/6am-club')

    // Should display the club page
    await expect(
      page.getByRole('heading', { level: 1, name: '6AM Club' })
    ).toBeVisible()
    await expect(page.getByText('Upcoming Events')).toBeVisible()

    // Should show events or empty state
    const hasEvents = (await page.getByRole('article').count()) > 0
    if (hasEvents) {
      await expect(page.getByRole('article').first()).toBeVisible()
    } else {
      await expect(page.getByText('No Upcoming Events')).toBeVisible()
    }
  })

  test('handles non-existent club slug with 404', async ({ page }) => {
    // Try to access a non-existent club
    const response = await page.goto('/clubs/non-existent-club')
    expect(response?.status()).toBe(404)
  })

  test('back navigation works from club page to clubs list', async ({
    page,
  }) => {
    await page.goto('/clubs/6am-club')

    // Wait for page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Click back link
    await page.getByText('Back to All Clubs').click()

    // Should navigate back to clubs list
    await expect(page).toHaveURL('/clubs')
    await expect(page.getByText('Running Clubs')).toBeVisible()
  })

  test('club page displays event information correctly', async ({ page }) => {
    await page.goto('/clubs/6am-club')

    // Wait for page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Check if events are displayed
    const eventCards = page.getByRole('article')
    const eventCount = await eventCards.count()

    if (eventCount > 0) {
      // If events exist, verify first event has proper content
      const firstEvent = eventCards.first()
      await expect(firstEvent.getByRole('heading', { level: 3 })).toBeVisible()
      await expect(firstEvent.getByText(/\d{2}:\d{2}/)).toBeVisible() // Time format
      await expect(firstEvent.getByText(/km|pace/i)).toBeVisible() // Distance or pace info
    } else {
      // If no events, should show empty state
      await expect(page.getByText('No Upcoming Events')).toBeVisible()
    }
  })
})
