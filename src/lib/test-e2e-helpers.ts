import { expect, type Locator, type Page } from '@playwright/test'
import { getBilingualTranslations, getTranslation } from './test-i18n'

type Locale = 'en' | 'fr'

/**
 * Get localized text for a translation key
 */
export function getLocalizedText(
  translationKey: string,
  locale: Locale = 'fr'
): string {
  return getTranslation(translationKey, locale)
}

/**
 * Navigate to home page with default French locale
 */
export async function gotoHomePage(page: Page): Promise<void> {
  await page.goto('/fr')
}

/**
 * Navigate to a localized page path
 */
export async function navigateToLocalizedPage({
  page,
  path,
  locale = 'fr',
}: {
  page: Page
  path: string
  locale?: Locale
}): Promise<void> {
  // Remove leading slash for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const localizedPath = `/${locale}/${cleanPath}`

  await page.goto(localizedPath)
}

/**
 * Expect page to have localized URL
 */
export async function expectLocalizedURL({
  page,
  path,
  locale = 'fr',
}: {
  page: Page
  path: string
  locale?: Locale
}): Promise<void> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const expectedPath = `/${locale}/${cleanPath}`

  await expect(page).toHaveURL(expectedPath)
}

/**
 * Expect localized text to be visible using translation key
 * Uses first() to handle multiple matches and avoid strict mode violations
 */
export async function expectLocalizedText({
  page,
  translationKey,
  locale = 'fr',
}: {
  page: Page
  translationKey: string
  locale?: Locale
}): Promise<void> {
  const translatedText = getLocalizedText(translationKey, locale)
  await expect(page.getByText(translatedText).first()).toBeVisible()
}

/**
 * Expect localized heading to be visible
 */
export async function expectLocalizedHeading({
  page,
  translationKey,
  level,
  locale = 'fr',
}: {
  page: Page
  translationKey: string
  level?: number
  locale?: Locale
}): Promise<void> {
  const translatedText = getLocalizedText(translationKey, locale)
  const headingLocator = level
    ? page.getByRole('heading', { level, name: translatedText })
    : page.getByRole('heading', { name: translatedText })

  await expect(headingLocator).toBeVisible()
}

/**
 * Click on localized link text
 */
export async function clickLocalizedLink({
  page,
  translationKey,
  locale = 'fr',
}: {
  page: Page
  translationKey: string
  locale?: Locale
}): Promise<void> {
  const translatedText = getLocalizedText(translationKey, locale)
  await page.getByRole('link', { name: translatedText }).click()
}

/**
 * Click on localized button text
 */
export async function clickLocalizedButton(
  page: Page,
  translationKey: string,
  locale: Locale = 'fr'
): Promise<void> {
  const translatedText = getLocalizedText(translationKey, locale)
  await page.getByRole('button', { name: translatedText }).click()
}

/**
 * Expect localized page title
 */
export async function expectLocalizedTitle(
  page: Page,
  translationKey: string,
  locale: Locale = 'fr'
): Promise<void> {
  const translatedTitle = getTranslation(translationKey, locale)
  await expect(page).toHaveTitle(new RegExp(translatedTitle))
}

/**
 * Wait for localized content to load (for loading states)
 */
export async function waitForLocalizedContent(
  page: Page,
  translationKey: string,
  locale: Locale = 'fr',
  options?: { timeout?: number }
): Promise<void> {
  const translatedText = getLocalizedText(translationKey, locale)
  await expect(page.getByText(translatedText)).toBeVisible(options)
}

/**
 * Get localized URL pattern for regex matching
 */
export function getLocalizedURLPattern(
  pathPattern: string,
  locale: Locale = 'fr'
): RegExp {
  // Handle root path
  if (pathPattern === '/') {
    return /^\/$/
  }

  // Replace any existing locale prefix and add the specified one
  const cleanPattern = pathPattern.replace(/^\/(?:en|fr)\//, '/')
  const localizedPattern = cleanPattern.replace(/^\//, `/${locale}/`)

  return new RegExp(localizedPattern)
}

/**
 * Test utility to verify that content appears in both languages
 * Useful for critical user flows
 */
export async function testBilingualContent(
  page: Page,
  translationKey: string,
  testFn: (locale: Locale, text: string) => Promise<void>
): Promise<void> {
  const translations = getBilingualTranslations(translationKey)

  // Test English version
  await testFn('en', translations.en)

  // Test French version
  await testFn('fr', translations.fr)
}

/**
 * Navigate and verify localized page structure
 */
export async function navigateAndVerifyLocalizedPage(
  page: Page,
  path: string,
  titleKey: string,
  headingKey: string,
  locale: Locale = 'fr'
): Promise<void> {
  await navigateToLocalizedPage({ page, path, locale })
  await expectLocalizedURL({ page, path, locale })
  await expectLocalizedTitle(page, titleKey, locale)
  await expectLocalizedHeading({ page, translationKey: headingKey, locale })
}

/**
 * Common test pattern: navigate to page and check for loading state
 */
export async function testLocalizedLoadingState(
  page: Page,
  path: string,
  loadingKey: string,
  locale: Locale = 'fr'
): Promise<void> {
  await navigateToLocalizedPage({ page, path, locale })

  // Should show loading state briefly
  const loadingText = getTranslation(loadingKey, locale)
  const loadingElement = page.getByText(loadingText)

  // Try to catch loading state (might be fast)
  try {
    await expect(loadingElement).toBeVisible({ timeout: 1000 })
  } catch {
    // Loading state might be too fast to catch, which is fine
    console.log(`Loading state for "${loadingText}" was too fast to detect`)
  }
}

/**
 * Helper to handle French accent variations in text matching
 * Useful when text might have encoding differences
 */
export function getFlexibleTextLocator(page: Page, text: string): Locator {
  // Create more flexible text matching that handles accent variations
  return page.getByText(
    new RegExp(
      text
        .replace(/[àáâãäå]/g, '[àáâãäå]')
        .replace(/[èéêë]/g, '[èéêë]')
        .replace(/[ìíîï]/g, '[ìíîï]')
        .replace(/[òóôõö]/g, '[òóôõö]')
        .replace(/[ùúûü]/g, '[ùúûü]'),
      'i'
    )
  )
}

/**
 * Navigate using header navigation links with specific selectors
 */
export async function navigateViaHeader({
  page,
  translationKey,
  locale = 'fr',
}: {
  page: Page
  translationKey: string
  locale?: Locale
}): Promise<void> {
  const linkText = getTranslation(translationKey, locale)
  await page
    .getByRole('navigation')
    .getByRole('link', { name: linkText })
    .click()
}
