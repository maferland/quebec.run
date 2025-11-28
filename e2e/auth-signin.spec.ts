import { test, expect } from '@playwright/test'

test.describe('Auth Sign In', () => {
  test('custom sign-in page renders', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send link/i })).toBeVisible()
  })

  test('clicking sign in button redirects to custom page', async ({ page }) => {
    await page.goto('/en')

    await page
      .getByRole('button', { name: /sign in/i })
      .first()
      .click()

    await expect(page).toHaveURL(/\/en\/auth\/signin/)
  })

  test('validates email format', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await page.getByLabel(/email address/i).fill('invalid-email')
    await page.getByRole('button', { name: /send link/i }).click()

    await expect(
      page.getByText(/please enter a valid email address/i)
    ).toBeVisible()
  })

  test('shows success message after valid submission', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByRole('button', { name: /send link/i }).click()

    await expect(page.getByText(/check your email/i)).toBeVisible()
    await expect(page.getByText(/test@example.com/)).toBeVisible()
  })
})
