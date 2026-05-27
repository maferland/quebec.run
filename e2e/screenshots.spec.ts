import { test, type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const OUTPUT_DIR = path.join(
  process.cwd(),
  process.env.SCREENSHOT_DIR || 'current/after'
)

async function settle(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page.waitForFunction(
    () => document.fonts?.status === 'loaded' || true,
    null,
    { timeout: 3000 }
  )
}

test.describe('Screenshot audit — mobile (390x844)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  })

  test.use({ viewport: { width: 390, height: 844 } })

  const shot = (name: string) => path.join(OUTPUT_DIR, name)

  test('01 — homepage viewport', async ({ page }) => {
    await page.goto('/en')
    await settle(page)
    await page.screenshot({ path: shot('01-homepage-mobile.png') })
  })

  test('02 — homepage fullpage', async ({ page }) => {
    await page.goto('/en')
    await settle(page)
    await page.screenshot({
      path: shot('02-homepage-fullpage.png'),
      fullPage: true,
    })
  })

  test('03 — mobile menu open', async ({ page }) => {
    await page.goto('/en')
    await settle(page)
    const menuBtn = page.getByRole('button', {
      name: /open menu|ouvrir le menu/i,
    })
    const hamburger = page.locator(
      'button[aria-label*="menu" i], header button:has(svg)'
    )
    const target =
      (await menuBtn.count()) > 0 ? menuBtn.first() : hamburger.first()
    await target.click({ timeout: 5000 }).catch(() => {})
    await page
      .getByRole('navigation')
      .waitFor({ state: 'visible', timeout: 2000 })
      .catch(() => {})
    await page.screenshot({ path: shot('03-mobile-menu-open.png') })
  })

  test('04 — events page viewport', async ({ page }) => {
    await page.goto('/en/events')
    await settle(page)
    await page.screenshot({ path: shot('04-events-page.png') })
  })

  test('05 — events page fullpage', async ({ page }) => {
    await page.goto('/en/events')
    await settle(page)
    await page.screenshot({
      path: shot('05-events-fullpage.png'),
      fullPage: true,
    })
  })

  test('06 — event detail viewport', async ({ page }) => {
    await page.goto('/en/events')
    await settle(page)
    const link = page.locator('article').first().locator('..')
    if (await link.isVisible()) {
      const href = await link.getAttribute('href')
      if (href) {
        await page.goto(href)
        await settle(page)
      }
    }
    await page.screenshot({ path: shot('06-event-detail.png') })
  })

  test('07 — event detail fullpage', async ({ page }) => {
    await page.goto('/en/events')
    await settle(page)
    const link = page.locator('article').first().locator('..')
    if (await link.isVisible()) {
      const href = await link.getAttribute('href')
      if (href) {
        await page.goto(href)
        await settle(page)
      }
    }
    await page.screenshot({
      path: shot('07-event-detail-fullpage.png'),
      fullPage: true,
    })
  })

  test('08 — clubs page viewport', async ({ page }) => {
    await page.goto('/en/clubs')
    await settle(page)
    await page.screenshot({ path: shot('08-clubs-page.png') })
  })

  test('09 — clubs page fullpage', async ({ page }) => {
    await page.goto('/en/clubs')
    await settle(page)
    await page.screenshot({
      path: shot('09-clubs-fullpage.png'),
      fullPage: true,
    })
  })

  test('10 — club detail 6AM viewport', async ({ page }) => {
    await page.goto('/en/clubs/6am-club')
    await settle(page)
    await page.screenshot({ path: shot('10-club-detail-6am.png') })
  })

  test('11 — club detail 6AM fullpage', async ({ page }) => {
    await page.goto('/en/clubs/6am-club')
    await settle(page)
    await page.screenshot({
      path: shot('11-club-detail-6am-fullpage.png'),
      fullPage: true,
    })
  })

  test('12 — calendar viewport', async ({ page }) => {
    await page.goto('/en/calendar')
    await page
      .getByRole('heading', { level: 1 })
      .waitFor({ timeout: 10000 })
      .catch(() => {})
    await settle(page)
    await page.screenshot({ path: shot('12-calendar-page.png') })
  })

  test('13 — calendar fullpage', async ({ page }) => {
    await page.goto('/en/calendar')
    await page
      .getByRole('heading', { level: 1 })
      .waitFor({ timeout: 10000 })
      .catch(() => {})
    await settle(page)
    await page.screenshot({
      path: shot('13-calendar-fullpage.png'),
      fullPage: true,
    })
  })

  test('14 — signin page', async ({ page }) => {
    await page.goto('/en/auth/signin')
    await settle(page)
    await page.screenshot({ path: shot('14-signin-page.png') })
  })

  test('15 — french homepage', async ({ page }) => {
    await page.goto('/fr')
    await settle(page)
    await page.screenshot({
      path: shot('15-french-homepage.png'),
      fullPage: true,
    })
  })

  test('16 — club fauxmouvement viewport', async ({ page }) => {
    await page.goto('/en/clubs/fauxmouvement')
    await settle(page)
    await page.screenshot({ path: shot('16-club-fauxmouvement.png') })
  })

  test('17 — club fauxmouvement fullpage', async ({ page }) => {
    await page.goto('/en/clubs/fauxmouvement')
    await settle(page)
    await page.screenshot({
      path: shot('17-club-fauxmouvement-fullpage.png'),
      fullPage: true,
    })
  })

  test('18 — club kogi paused', async ({ page }) => {
    await page.goto('/en/clubs/kogi')
    await settle(page)
    await page.screenshot({
      path: shot('18-club-kogi-paused.png'),
      fullPage: true,
    })
  })

  test('19 — legal terms', async ({ page }) => {
    await page.goto('/en/legal/terms')
    await settle(page)
    await page.screenshot({ path: shot('19-legal-terms.png') })
  })

  test('20 — event no location', async ({ page }) => {
    await page.goto('/en/events')
    await settle(page)
    const link = page.locator(
      'a[href*="club-la-foulee-longue-sortie-dimanche"]'
    )
    const count = await link.count()
    if (count > 0) {
      const href = await link.first().getAttribute('href')
      if (href) {
        await page.goto(href)
        await settle(page)
      }
    }
    await page.screenshot({
      path: shot('20-event-no-location.png'),
      fullPage: true,
    })
  })

  test('21 — 404 page', async ({ page }) => {
    await page.goto('/en/this-page-does-not-exist')
    await settle(page)
    await page.screenshot({ path: shot('21-404-page.png') })
  })

  test('22 — map marker popup', async ({ page }) => {
    await page.goto('/en/events')
    await settle(page)
    await page
      .locator('.leaflet-marker-icon')
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {})
    const hasMarker = await page.evaluate(() => {
      const marker = document.querySelector(
        '.leaflet-marker-icon'
      ) as HTMLElement
      if (marker) {
        marker.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return true
      }
      return false
    })
    if (hasMarker) {
      await page
        .locator('.leaflet-popup')
        .waitFor({ timeout: 2000 })
        .catch(() => {})
    }
    await page.screenshot({ path: shot('22-map-marker-popup.png') })
  })
})
