import { test, expect } from '@playwright/test'

test.describe('Map Markers', () => {
  test('displays event map on homepage', async ({ page }) => {
    await page.goto('/en')

    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()
  })

  test('shows club count independent of selected day', async ({
    page,
    request,
  }) => {
    const response = await request.get('/api/explore/clubs')
    expect(response.ok()).toBe(true)
    const clubs = (await response.json()) as unknown[]
    expect(clubs.length).toBeGreaterThan(0)

    await page.goto('/en?day=4')

    await expect(
      page.getByRole('button', { name: new RegExp(`Clubs\\s+${clubs.length}`) })
    ).toBeVisible()
  })

  test('canonical club route renders map-first detail view', async ({
    page,
  }) => {
    await page.goto('/en/clubs/fauxmouvement')

    await expect(
      page.getByRole('application', { name: /interactive event map/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/weekly schedule/i)).toBeVisible()
  })

  test('event detail swipes over its club detail without a close gap', async ({
    page,
    request,
  }) => {
    const response = await request.get(
      '/api/explore/clubs/fauxmouvement?locale=en'
    )
    expect(response.ok()).toBe(true)
    const club = (await response.json()) as {
      upcomingRuns: { id: string; title: string; time: string }[]
    }
    const run = club.upcomingRuns[0]
    expect(run).toBeTruthy()

    await page.goto('/en/clubs/fauxmouvement')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })

    await page.evaluate(() => {
      const shell = document.querySelector('.qr-root:not(.qr-detail-shell)')
      if (!shell) throw new Error('Explore shell not found')
      shell.setAttribute('data-detail-handoff', 'false')
      const recordHandoff = () => {
        const panels = document.querySelectorAll('.qr-detail-shell')
        if (
          panels.length === 2 &&
          panels[0]?.classList.contains('is-underlay') &&
          !panels[0]?.classList.contains('is-exiting')
        ) {
          shell.setAttribute('data-detail-handoff', 'true')
        }
      }
      new MutationObserver(recordHandoff).observe(shell, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['class'],
      })
    })

    await page
      .locator('.qr-detail-shell .tap')
      .filter({ hasText: run.title })
      .filter({ hasText: run.time })
      .first()
      .click()

    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}`))
    await expect(
      page.locator('.qr-root:not(.qr-detail-shell)')
    ).toHaveAttribute('data-detail-handoff', 'true')
    const panels = page.locator('.qr-detail-shell')
    await expect(panels).toHaveCount(1)

    await page
      .locator('.qr-root:not(.qr-detail-shell)')
      .evaluate((shell) => shell.setAttribute('data-detail-handoff', 'false'))
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page).toHaveURL('/en/clubs/fauxmouvement')
    await expect(
      page.locator('.qr-root:not(.qr-detail-shell)')
    ).toHaveAttribute('data-detail-handoff', 'true')
    await expect(panels).toHaveCount(1)
  })

  test('club Back does not remount the closing detail panel', async ({
    page,
  }, testInfo) => {
    await page.goto('/en/clubs')
    await page.getByText('Faux Mouvement', { exact: true }).first().click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })

    await page.evaluate(() => {
      const root = document.querySelector('.qr-root:not(.qr-detail-shell)')
      if (!root) throw new Error('Explore shell not found')
      root.setAttribute('data-detail-panel-mounts', '0')
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (
              node instanceof Element &&
              (node.matches('.qr-detail-shell') ||
                node.querySelector('.qr-detail-shell'))
            ) {
              const mounts = Number(
                root.getAttribute('data-detail-panel-mounts')
              )
              root.setAttribute('data-detail-panel-mounts', String(mounts + 1))
            }
          }
        }
      })
      observer.observe(root, { childList: true, subtree: true })
    })

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.locator('.qr-detail-shell.is-exiting')).toHaveCount(1)
    if (testInfo.project.name === 'Desktop Chrome') {
      await page.waitForTimeout(80)
      const exitX = await page.locator('.qr-detail-shell').evaluate((panel) => {
        return new DOMMatrix(getComputedStyle(panel).transform).m41
      })
      expect(exitX).toBeLessThan(0)
    }
    await expect(page.locator('.qr-detail-shell')).toHaveCount(0)
    await expect(page).toHaveURL(/\/en\/clubs(?:\?.*)?$/)
    await expect(
      page.locator('.qr-root:not(.qr-detail-shell)')
    ).toHaveAttribute('data-detail-panel-mounts', '0')
  })

  test('club tab preserves the inactive day-strip footprint', async ({
    page,
  }, testInfo) => {
    await page.goto('/en')

    const weekSlot = page.locator('.qr-week-slot')
    const runsBox = await weekSlot.boundingBox()
    expect(runsBox).not.toBeNull()

    await page.getByRole('button', { name: /clubs/i }).click()
    await expect(page).toHaveURL(/\/en\/clubs(?:\?.*)?$/)
    await expect(weekSlot).toHaveClass(/is-inactive/)
    await expect(weekSlot).toHaveAttribute('aria-hidden', 'true')

    const clubsBox = await weekSlot.boundingBox()
    expect(clubsBox).not.toBeNull()
    expect(clubsBox?.height).toBe(runsBox?.height)
    if (testInfo.project.name === 'Desktop Chrome') {
      expect(clubsBox?.y).toBe(runsBox?.y)
    }
  })

  test('selected run is URL-addressable', async ({ page, request }) => {
    const response = await request.get('/api/explore/runs?day=1')
    expect(response.ok()).toBe(true)
    const runs = (await response.json()) as { id: string; title: string }[]
    const run = runs[0]
    expect(run).toBeTruthy()

    await page.goto('/en?day=1')
    await page.getByText(run.title, { exact: false }).first().click()
    await expect(page).toHaveURL(
      new RegExp(
        `(/en/run/${encodeURIComponent(run.id)}|run=${encodeURIComponent(run.id)})`
      )
    )
    await expect(page.locator('.pin.is-active')).toBeVisible()

    if (!page.url().includes(`/en/run/${encodeURIComponent(run.id)}`)) {
      await page
        .getByRole('button', { name: /details/i })
        .first()
        .click()
    }
    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}(?:\\?.*)?$`))
    await expect(
      page.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible()
    await expect(page.locator('.pin.is-active')).toBeVisible()

    const deepLinkPage = await page.context().newPage()
    await deepLinkPage.goto(`/en/run/${encodeURIComponent(run.id)}`)
    await expect(
      deepLinkPage.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible()
    await expect(deepLinkPage.locator('.pin.is-active')).toBeVisible({
      timeout: 15000,
    })
    await deepLinkPage.close()
  })

  test('opens a shaped detail skeleton while prefetched data loads', async ({
    page,
    request,
  }, testInfo) => {
    const response = await request.get('/api/explore/runs?day=1')
    expect(response.ok()).toBe(true)
    const runs = (await response.json()) as { id: string; title: string }[]
    const run = runs[0]
    expect(run).toBeTruthy()

    let detailRequests = 0
    await page.route(`**/api/explore/runs/${run.id}`, async (route) => {
      detailRequests += 1
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })

    await page.goto('/en?day=1')
    const runTitle = page.getByText(run.title, { exact: false }).first()
    await runTitle.hover()
    await expect.poll(() => detailRequests).toBe(1)
    await runTitle.hover()
    expect(detailRequests).toBe(1)

    await runTitle.click()
    await expect(page.locator('.qr-detail-shell')).toBeVisible()
    if (testInfo.project.name === 'Desktop Chrome') {
      await page.waitForTimeout(60)
      const enterX = await page
        .locator('.qr-detail-shell')
        .evaluate((panel) => {
          return new DOMMatrix(getComputedStyle(panel).transform).m41
        })
      expect(enterX).toBeLessThan(0)
    }
    await expect(
      page.locator('.qr-detail-shell [aria-busy="true"]')
    ).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}`))
    await expect(
      page.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible({ timeout: 15000 })
    expect(detailRequests).toBe(1)
  })

  test('direct run detail highlights the active map pin', async ({ page }) => {
    const runId = 'fauxmouvement-mardi--2026-07-21'
    await page.goto(`/en/run/${runId}`)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.pin.is-active')).toHaveCount(1)
    await expect(page.locator('.pin.is-muted').first()).toBeVisible()
    await expect(page.getByText(/Café de Course/)).toBeVisible()

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.locator('.qr-detail-shell.is-exiting')).toHaveCount(1)
    await expect(page).toHaveURL(/\/en$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toHaveCount(0)
  })

  test.describe('map-first home', () => {
    test('renders the desktop map', async ({ page, viewport }) => {
      test.skip(!viewport || viewport.width < 1024, 'desktop layout only')
      await page.goto('/en')

      const map = page.getByRole('application', {
        name: /interactive event map/i,
      })
      await expect(map).toBeVisible()
    })

    test('renders the mobile map', async ({ page, viewport }) => {
      test.skip(!viewport || viewport.width >= 1024, 'mobile layout only')
      await page.goto('/en')

      const map = page.getByRole('application', {
        name: /interactive event map/i,
      })
      await expect(map).toBeVisible()
    })
  })
})
