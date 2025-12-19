import { test, expect } from '@playwright/test'

test.describe('Clubs Page', () => {
  test('displays clubs list', async ({ page }) => {
    await page.goto('/en/clubs')

    await expect(
      page.getByRole('heading', { name: /running clubs/i })
    ).toBeVisible()

    await expect(page).toHaveScreenshot('clubs-page.png', { fullPage: true })
  })
})
