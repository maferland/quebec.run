import { test, expect } from '@playwright/test'

const TUESDAY_ISO = (() => {
  const d = new Date()
  // walk forward to next Tuesday
  while (d.getDay() !== 2) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})()

test.describe('Nested event URLs', () => {
  test('specific occurrence renders the event', async ({ page }) => {
    await page.goto(`/en/clubs/fauxmouvement/events/mardi/${TUESDAY_ISO}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /faux mouvement/i
    )
  })

  test('bare slug redirects to next upcoming date', async ({ page }) => {
    await page.goto('/en/clubs/fauxmouvement/events/mardi', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(
      /\/clubs\/fauxmouvement\/events\/mardi\/\d{4}-\d{2}-\d{2}$/
    )
  })

  test('legacy slug URL 301-redirects to nested form', async ({ page }) => {
    await page.goto(`/en/events/faux-mouvement-mardi--${TUESDAY_ISO}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(
      `/en/clubs/fauxmouvement/events/mardi/${TUESDAY_ISO}`
    )
  })

  test('unknown nested URL 404s', async ({ page }) => {
    const response = await page.goto(
      `/en/clubs/fauxmouvement/events/no-such-slug/${TUESDAY_ISO}`
    )
    expect(response?.status()).toBe(404)
  })
})
