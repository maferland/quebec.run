import { test, expect } from '@playwright/test'

const TUESDAY_ISO = (() => {
  const d = new Date()
  // walk forward to next Tuesday
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})()

test.describe('Nested event URLs', () => {
  test('a future occurrence redirects to its own run page', async ({
    page,
  }) => {
    await page.goto(`/en/clubs/fauxmouvement/events/mardi/${TUESDAY_ISO}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(`/en/run/fauxmouvement-mardi--${TUESDAY_ISO}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /faux mouvement/i
    )
  })

  test('bare slug is the durable place page', async ({ page }) => {
    await page.goto('/en/clubs/fauxmouvement/events/mardi', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL('/en/clubs/fauxmouvement/events/mardi')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /faux mouvement/i
    )
    await expect(page.getByText(/every tuesday/i).first()).toBeVisible()
  })

  test('another slug at the same place redirects to the canonical one', async ({
    page,
  }) => {
    await page.goto('/en/clubs/fauxmouvement/events/jeudi', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL('/en/clubs/fauxmouvement/events/mardi')
  })

  test('a past occurrence redirects to the place page', async ({ page }) => {
    await page.goto('/en/clubs/fauxmouvement/events/mardi/2026-05-05', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL('/en/clubs/fauxmouvement/events/mardi')
  })

  test('legacy slug URL 301-redirects to the run page', async ({ page }) => {
    await page.goto(`/en/events/faux-mouvement-mardi--${TUESDAY_ISO}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(`/en/run/fauxmouvement-mardi--${TUESDAY_ISO}`)
  })

  test('unknown nested URL 404s', async ({ page }) => {
    const response = await page.goto(
      `/en/clubs/fauxmouvement/events/no-such-slug/${TUESDAY_ISO}`
    )
    expect(response?.status()).toBe(404)
  })
})
