import { test, expect } from '@playwright/test'
import { navigateToLocalizedPage } from '@/lib/test-e2e-helpers'

test.describe('Consent Flow', () => {
  // Note: These tests focus on the consent banner UI behavior and legal page accessibility.
  // Full authentication testing with database cleanup would require additional setup:
  // - Test user creation and authentication flow
  // - Database cleanup between tests
  // - Session management
  //
  // For Law 25 compliance, the critical paths are:
  // 1. Legal pages are accessible (tested below)
  // 2. Consent API endpoints work (tested in route.test.ts)
  // 3. Consent banner UI functions correctly (tested with unit tests)

  test('legal pages are accessible from direct navigation', async ({
    page,
  }) => {
    // Test Terms of Service page in English
    await navigateToLocalizedPage({ page, path: 'legal/terms', locale: 'en' })
    await expect(page).toHaveURL(/\/en\/legal\/terms/)
    await expect(
      page.getByRole('heading', { name: /terms of service/i, level: 1 })
    ).toBeVisible()

    // Verify page has required content sections
    await expect(
      page.getByRole('heading', { name: /acceptance of terms/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /user accounts/i })
    ).toBeVisible()

    // Test Privacy Policy page in English
    await navigateToLocalizedPage({ page, path: 'legal/privacy', locale: 'en' })
    await expect(page).toHaveURL(/\/en\/legal\/privacy/)
    await expect(
      page.getByRole('heading', { name: /privacy policy/i, level: 1 })
    ).toBeVisible()

    // Verify Law 25 compliance section exists
    await expect(
      page.getByRole('heading', { name: /your rights.*law 25/i })
    ).toBeVisible()
  })

  test('legal pages work in both languages', async ({ page }) => {
    // Test French Terms page
    await navigateToLocalizedPage({ page, path: 'legal/terms', locale: 'fr' })
    await expect(page).toHaveURL(/\/fr\/legal\/terms/)
    await expect(
      page.getByRole('heading', { name: /conditions d'utilisation/i, level: 1 })
    ).toBeVisible()

    // Test French Privacy page
    await navigateToLocalizedPage({ page, path: 'legal/privacy', locale: 'fr' })
    await expect(page).toHaveURL(/\/fr\/legal\/privacy/)
    await expect(
      page.getByRole('heading', {
        name: /politique de confidentialité/i,
        level: 1,
      })
    ).toBeVisible()
  })

  test('footer contains links to legal pages', async ({ page }) => {
    await page.goto('/en')

    // Verify footer has Terms link
    const footer = page.locator('footer')
    const termsLink = footer.getByRole('link', { name: /^terms$/i })
    await expect(termsLink).toBeVisible()

    // Click Terms link and verify navigation
    await termsLink.click()
    await expect(page).toHaveURL(/\/en\/legal\/terms/)

    // Navigate back and test Privacy link
    await page.goto('/en')
    const privacyLink = footer.getByRole('link', { name: /^privacy$/i })
    await expect(privacyLink).toBeVisible()

    // Click Privacy link and verify navigation
    await privacyLink.click()
    await expect(page).toHaveURL(/\/en\/legal\/privacy/)
  })

  test('legal page links from consent banner context', async ({ page }) => {
    // This test verifies that the legal page URLs work correctly
    // In a full implementation, the consent banner would show for authenticated users without consent
    // and contain links to these pages

    await page.goto('/en')

    // Navigate directly to legal pages that would be linked from the banner
    await page.goto('/en/legal/terms')
    await expect(
      page.getByRole('heading', { name: /terms of service/i, level: 1 })
    ).toBeVisible()

    await page.goto('/en/legal/privacy')
    await expect(
      page.getByRole('heading', { name: /privacy policy/i, level: 1 })
    ).toBeVisible()

    // Verify pages can be refreshed without errors
    await page.reload()
    await expect(
      page.getByRole('heading', { name: /privacy policy/i, level: 1 })
    ).toBeVisible()
  })

  // Note: Testing the actual consent banner interaction (appears for new user, accept dismisses, etc.)
  // requires authentication setup. The consent banner component behavior is thoroughly tested
  // in src/components/consent-banner.test.tsx, and the API endpoints are tested in
  // src/app/api/user/consent/route.test.ts.
  //
  // For E2E testing with authentication, you would need to:
  // 1. Set up a test user account
  // 2. Authenticate via magic link or session injection
  // 3. Verify banner appears when no consent exists
  // 4. Click accept button and verify API call
  // 5. Verify banner disappears after consent
  // 6. Reload page and verify banner stays hidden
})
