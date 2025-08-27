import { test, expect } from '@playwright/test'
import {
  navigateToLocalizedPage,
  expectLocalizedText,
  expectLocalizedURL,
  clickLocalizedLink,
  navigateViaHeader,
} from '@/lib/test-e2e-helpers'

test.describe('Smoke Tests - Core User Journeys', () => {
  test('homepage loads and displays content', async ({ page }) => {
    await page.goto('/')

    // Should show hero content in French (default locale)
    await expectLocalizedText({
      page,
      translationKey: 'home.hero.title',
      locale: 'fr',
    })

    // Should have navigation
    await expectLocalizedText({
      page,
      translationKey: 'navigation.clubs',
      locale: 'fr',
    })
    await expectLocalizedText({
      page,
      translationKey: 'navigation.events',
      locale: 'fr',
    })

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
    const clubCard = page.getByTestId('club-card').first()
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

    // Should show events or empty state
    const hasEvents = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (hasEvents) {
      // If events exist, verify basic structure
      const firstEvent = page.getByRole('article').first()
      await expect(firstEvent.getByRole('heading', { level: 3 })).toBeVisible()
      await expect(firstEvent.getByText(/\d{2}:\d{2}/)).toBeVisible()
    } else {
      // If no events, should show empty state
      await expectLocalizedText({
        page,
        translationKey: 'events.empty.title',
        locale: 'fr',
      })
    }
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

    // Should show runs or empty state
    const hasRuns = await page
      .getByRole('article')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    if (!hasRuns) {
      // If no runs, should show empty state
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
    await page.goto('/')
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
    await expect(page).toHaveURL('/')
  })
})
