import { test, expect, type Page } from '@playwright/test'

const SENTINEL = '__localeSwitchSentinel'
const READY_TIMEOUT = 20_000

const markPage = (page: Page) =>
  page.evaluate((key) => {
    ;(window as unknown as Record<string, string>)[key] = 'alive'
  }, SENTINEL)

const survivedNavigation = (page: Page) =>
  page.evaluate(
    (key) => Boolean((window as unknown as Record<string, string>)[key]),
    SENTINEL
  )

// The panel is server-rendered, so the heading proves paint, not hydration.
const gotoDetail = async (page: Page, path: string) => {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
    timeout: READY_TIMEOUT,
  })
}

// The switcher is an anchor, so this click works whether or not React is ready.
const switchLocale = async (page: Page, name: 'English' | 'Français') => {
  const target = name === 'English' ? 'en' : 'fr'
  await page.getByRole('link', { name }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', target, {
    timeout: READY_TIMEOUT,
  })
}

// The designed 404 has no "404" heading, so its shell is what catches the
// regression now; the title/heading checks stay for Next's built-in fallback.
const expectNotNotFound = async (page: Page) => {
  await expect(page).not.toHaveTitle(/404/)
  await expect(page.getByRole('heading', { name: '404' })).toHaveCount(0)
  await expect(page.locator('.qr-error-root')).toHaveCount(0)
}

const findRunId = async (page: Page) => {
  for (let day = 0; day <= 6; day += 1) {
    const response = await page.request.get(`/api/explore/runs?day=${day}`)
    if (!response.ok()) continue
    const runs = (await response.json()) as { id: string }[]
    if (Array.isArray(runs) && runs[0]) return runs[0].id
  }
  return null
}

test.describe('Locale switch on detail routes', () => {
  test('club detail keeps rendering after switching to English', async ({
    page,
  }) => {
    await gotoDetail(page, '/fr/clubs/fauxmouvement')
    await markPage(page)

    await switchLocale(page, 'English')

    await expect(page).toHaveURL('/en/clubs/fauxmouvement')
    await expectNotNotFound(page)
    await expect(
      page.getByRole('heading', { level: 1, name: /faux mouvement/i })
    ).toBeVisible({ timeout: READY_TIMEOUT })
    expect(await survivedNavigation(page)).toBe(true)
  })

  test('run detail keeps rendering after switching to English', async ({
    page,
  }) => {
    const runId = await findRunId(page)
    test.skip(!runId, 'no upcoming runs seeded')

    await gotoDetail(page, `/fr/run/${runId}`)
    await markPage(page)

    await switchLocale(page, 'English')

    await expect(page).toHaveURL(`/en/run/${runId}`)
    await expectNotNotFound(page)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({
      timeout: READY_TIMEOUT,
    })
    expect(await survivedNavigation(page)).toBe(true)
  })

  test('detail route survives a round trip back to French', async ({
    page,
  }) => {
    await gotoDetail(page, '/fr/clubs/fauxmouvement')

    await switchLocale(page, 'English')
    await switchLocale(page, 'Français')

    await expect(page).toHaveURL('/fr/clubs/fauxmouvement')
    await expectNotNotFound(page)
    await expect(
      page.getByRole('heading', { level: 1, name: /faux mouvement/i })
    ).toBeVisible({ timeout: READY_TIMEOUT })
  })

  test('filter query params survive the locale switch', async ({ page }) => {
    await gotoDetail(page, '/fr/clubs/fauxmouvement?day=2&beginner=1')

    await switchLocale(page, 'English')

    await expect(page).toHaveURL('/en/clubs/fauxmouvement?day=2&beginner=1')
    await expectNotNotFound(page)
  })
})
