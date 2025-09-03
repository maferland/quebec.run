import {
  clickLocalizedLink,
  expectLocalizedText,
  expectLocalizedURL,
  getLocalizedText,
  gotoHomePage,
  navigateToLocalizedPage,
  navigateViaHeader,
} from '@/lib/test-e2e-helpers'
import { expect, test } from '@playwright/test'

test.describe('Smoke Tests - Core User Journeys', () => {
  test('homepage loads and displays content', async ({ page }) => {
    await gotoHomePage(page)

    // Should show hero content in French (default locale)
    await expectLocalizedText({
      page,
      translationKey: 'home.hero.title',
      locale: 'fr',
    })

    // Should have navigation (icons are always visible, text hidden on mobile)
    const viewport = page.viewportSize()
    const isMobile = viewport && viewport.width < 768

    if (isMobile) {
      // On mobile, navigation text is hidden but icons should be visible
      const clubsLink = page.getByRole('navigation').getByRole('link').nth(0)
      await expect(clubsLink).toBeVisible()
      const eventsLink = page.getByRole('navigation').getByRole('link').nth(1)
      await expect(eventsLink).toBeVisible()
    } else {
      // On desktop, navigation text should be visible
      const navigationClubs = page
        .getByRole('navigation')
        .getByRole('link', { name: 'Clubs' })
      await expect(navigationClubs).toBeVisible()

      const navigationEvents = page
        .getByRole('navigation')
        .getByRole('link', { name: 'Événements' })
      await expect(navigationEvents).toBeVisible()
    }

    // Should show featured clubs section
    await expectLocalizedText({
      page,
      translationKey: 'home.clubs.title',
      locale: 'fr',
    })

    // Wait for clubs to load (basic functionality check)
    await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('clubs page navigation flow', async ({ page }) => {
    // Navigate to clubs page
    await navigateToLocalizedPage({ page, path: 'clubs', locale: 'fr' })
    await expectLocalizedText({
      page,
      translationKey: 'clubs.title',
      locale: 'fr',
    })

    // Should show club cards

    const viewClubText = getLocalizedText('clubs.card.viewClub', 'fr')
    const clubCard = page.getByRole('link', {
      name: new RegExp(viewClubText.replace('→', '')),
    })
    await expect(clubCard).toBeVisible()

    // Navigate to individual club
    await clubCard.click()
    await expect(page).toHaveURL(/\/fr\/clubs\/[a-z0-9-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Navigate back to clubs list
    await expectLocalizedText({
      page,
      translationKey: 'clubs.backToClubs',
      locale: 'fr',
    })
    await clickLocalizedLink({
      page,
      translationKey: 'clubs.backToClubs',
      locale: 'fr',
    })
    await expectLocalizedURL({ page, path: 'clubs', locale: 'fr' })
  })

  test('events page displays correctly', async ({ page }) => {
    await navigateToLocalizedPage({ page, path: 'events', locale: 'fr' })
    await expectLocalizedText({
      page,
      translationKey: 'events.title',
      locale: 'fr',
    })

    // Should show events (since there are events in the database)
    await expect(page.getByRole('article').first()).toBeVisible({
      timeout: 10000,
    })

    // Verify event structure
    const firstEvent = page.getByRole('article').first()
    await expect(firstEvent.getByRole('heading', { level: 3 })).toBeVisible()
    await expect(firstEvent.getByText(/\d{2}:\d{2}/)).toBeVisible()
  })

  test('calendar page displays correctly', async ({ page }) => {
    await navigateToLocalizedPage({ page, path: 'calendar', locale: 'fr' })
    await expectLocalizedText({
      page,
      translationKey: 'calendar.title',
      locale: 'fr',
    })
    await expectLocalizedText({
      page,
      translationKey: 'calendar.description',
      locale: 'fr',
    })

    // Wait for loading to complete
    const loadingText = getLocalizedText('calendar.loading', 'fr')
    const isLoadingVisible = await page.getByText(loadingText).isVisible()
    if (isLoadingVisible) {
      await expect(page.getByText(loadingText)).not.toBeVisible({
        timeout: 10000,
      })
    }

    // Should show events (since there are events in the database)
    const eventCards = await page
      .locator('.bg-surface.border.border-border.rounded-lg')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (eventCards) {
      // Verify event structure when events exist
      await expect(
        page.locator('.bg-surface.border.border-border.rounded-lg').first()
      ).toBeVisible()
    } else {
      // If no events, should show empty state
      await expectLocalizedText({
        page,
        translationKey: 'calendar.empty.title',
        locale: 'fr',
      })
    }
  })

  test('bilingual support works', async ({ page }) => {
    // Test French (default)
    await navigateToLocalizedPage({ page, path: '/', locale: 'fr' })
    await expectLocalizedText({
      page,
      translationKey: 'home.hero.title',
      locale: 'fr',
    })

    // Test English
    await navigateToLocalizedPage({ page, path: '/', locale: 'en' })
    await expectLocalizedText({
      page,
      translationKey: 'home.hero.title',
      locale: 'en',
    })

    // Test clubs page in English
    await navigateToLocalizedPage({ page, path: 'clubs', locale: 'en' })
    await expectLocalizedText({
      page,
      translationKey: 'clubs.title',
      locale: 'en',
    })
  })

  test('core navigation between pages', async ({ page }) => {
    // Start at home
    await gotoHomePage(page)
    await expectLocalizedText({
      page,
      translationKey: 'home.hero.title',
      locale: 'fr',
    })

    // Navigate to events via header using more specific selector
    await navigateViaHeader({
      page,
      translationKey: 'navigation.events',
      locale: 'fr',
    })
    await expectLocalizedURL({ page, path: 'events', locale: 'fr' })

    // Navigate to clubs via header using more specific selector
    await navigateViaHeader({
      page,
      translationKey: 'navigation.clubs',
      locale: 'fr',
    })
    await expectLocalizedURL({ page, path: 'clubs', locale: 'fr' })

    // Navigate home via logo
    await page
      .getByRole('banner')
      .getByRole('link', { name: /quebec\.run/ })
      .click()
    await expect(page).toHaveURL('/fr')
  })
})
