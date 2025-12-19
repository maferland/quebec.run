import { test, expect } from '@playwright/test'

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('mobile menu closed', async ({ page }) => {
    await page.goto('/en')

    const menuButton = page.getByRole('button', { name: /open menu/i })
    await expect(menuButton).toBeVisible()

    await expect(page).toHaveScreenshot('mobile-menu-closed.png')
  })

  test('mobile menu open', async ({ page }) => {
    await page.goto('/en')

    const menuButton = page.getByRole('button', { name: /open menu/i })
    await menuButton.click()

    await expect(page.getByRole('link', { name: /clubs/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /events/i })).toBeVisible()

    await expect(page).toHaveScreenshot('mobile-menu-open.png')
  })
})
