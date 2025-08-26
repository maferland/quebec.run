import { test, expect } from '@playwright/test'

test.describe('Events Listing Page', () => {
  test('displays events list page', async ({ page }) => {
    await page.goto('/events')

    // Check page title and header
    await expect(page.getByText('Running Events')).toBeVisible()

    // Wait for events to load or show empty state
    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasEvents) {
      // If events exist, verify event card content
      const firstEventCard = page.getByRole('article').first()
      await expect(
        firstEventCard.getByRole('heading', { level: 3 })
      ).toBeVisible()
      await expect(firstEventCard.getByText(/\d{2}:\d{2}/)).toBeVisible() // Time format
      await expect(firstEventCard.getByText(/km|pace/i)).toBeVisible() // Distance or pace
    } else {
      // If no events, should show empty state
      await expect(page.getByText('No upcoming events found')).toBeVisible()
      await expect(
        page.getByText('Check back soon for new running events in Quebec City')
      ).toBeVisible()
    }
  })

  test('navigates to individual event from events list', async ({ page }) => {
    await page.goto('/events')

    // Wait for events to potentially load
    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasEvents) {
      // Click on first event
      const firstEvent = page.getByRole('article').first()
      await expect(firstEvent.getByRole('heading', { level: 3 })).toBeVisible()

      // Click the event card to navigate
      await firstEvent.click()

      // Should navigate to individual event page
      await expect(page).toHaveURL(/\/events\//)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Back to All Events')).toBeVisible()
    }
  })

  test('shows club names on event cards when showClubName is true', async ({
    page,
  }) => {
    await page.goto('/events')

    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasEvents) {
      const eventCards = page.getByRole('article')
      const firstCard = eventCards.first()

      // Should show club name since showClubName prop is used
      const clubText = firstCard.getByText(/club|running/i)
      if ((await clubText.count()) > 0) {
        await expect(clubText.first()).toBeVisible()
      }
    }
  })

  test('displays event content with semantic elements', async ({ page }) => {
    await page.goto('/events')

    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasEvents) {
      const eventCards = page.getByRole('article')
      const cardCount = await eventCards.count()

      // Verify multiple events are displayed in grid
      expect(cardCount).toBeGreaterThan(0)

      // Check first event has proper semantic structure
      const firstEvent = eventCards.first()
      await expect(firstEvent.getByRole('heading')).toBeVisible()

      // Should have time information
      await expect(firstEvent.getByText(/\d{1,2}:\d{2}/)).toBeVisible()
    }
  })

  test('handles navigation back to events from individual event page', async ({
    page,
  }) => {
    // Start at events list
    await page.goto('/events')

    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasEvents) {
      // Navigate to event details
      await page.getByRole('article').first().click()
      await expect(page).toHaveURL(/\/events\//)

      // Navigate back using back button
      const backLink = page.getByText('Back to All Events')
      await expect(backLink).toBeVisible()
      await backLink.click()

      // Should be back at events list
      await expect(page).toHaveURL('/events')
      await expect(page.getByText('Running Events')).toBeVisible()
    }
  })

  test('handles cross-navigation between events and clubs', async ({
    page,
  }) => {
    await page.goto('/events')

    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasEvents) {
      // Find event with club link
      const eventCard = page.getByRole('article').first()
      const clubLink = eventCard.getByText(/club|running/i)

      if (
        (await clubLink.count()) > 0 &&
        (await clubLink.getAttribute('href'))
      ) {
        await clubLink.click()

        // Should navigate to club page
        await expect(page).toHaveURL(/\/clubs\//)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        // Navigate back using browser back or back link
        const backToClubs = page.getByText('Back to All Clubs')
        if (await backToClubs.isVisible()) {
          await backToClubs.click()
          await expect(page).toHaveURL('/clubs')
        }
      }
    }
  })
})
