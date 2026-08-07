import { expect, type Page } from '@playwright/test'

export async function openSearch(page: Page) {
  const input = page.getByRole('textbox')
  await expect(async () => {
    if (!(await input.isVisible())) {
      await page.getByRole('button', { name: 'Search', exact: true }).click()
    }
    await expect(input).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  return input
}

// A toggle that took effect proves React has hydrated and clicks aren't dropped.
export async function waitForInteractive(page: Page) {
  const input = await openSearch(page)
  await page.getByRole('button', { name: 'Close search' }).click()
  await expect(input).toBeHidden()
}
