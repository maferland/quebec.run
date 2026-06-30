import { test, expect } from '@playwright/test'

test.describe('Auth Sign In', () => {
  test('custom sign-in page renders', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send link/i })).toBeVisible()
  })

  test('clicking sign in link redirects to custom page', async ({ page }) => {
    await page.goto('/en')

    await expect(page.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/en/auth/signin'
    )
  })

  test('validates email format', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await page.getByLabel(/email address/i).fill('invalid-email')
    await page.getByRole('button', { name: /send link/i }).click()

    await expect(
      page.getByText(/please enter a valid email address/i)
    ).toBeVisible()
  })

  test('shows development quick login without email delivery', async ({
    page,
  }) => {
    await page.goto('/en/auth/signin')

    await expect(
      page.getByRole('heading', { name: /dev only - quick login/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /sign in instantly/i })
    ).toBeDisabled()
  })
})
