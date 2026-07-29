import { test, expect, type Page, type Request } from '@playwright/test'

async function gotoLoadedExplore(page: Page, path: string) {
  const exploreRequests: string[] = []
  const trackExploreRequest = (request: Request) => {
    if (request.url().includes('/api/explore/')) {
      exploreRequests.push(request.url())
    }
  }
  page.on('request', trackExploreRequest)
  await page.goto(path)
  await page.getByRole('button', { name: 'Search', exact: true }).waitFor()
  await page.waitForTimeout(500)
  page.off('request', trackExploreRequest)
  expect(exploreRequests).toEqual([])
}

// A toggle click that lands before hydration is dropped, and the closed layer
// hides with opacity, so retry until the input joins the accessibility tree.
async function openSearch(page: Page) {
  const input = page.getByRole('textbox')
  await expect(async () => {
    if (!(await input.isVisible())) {
      await page.getByRole('button', { name: 'Search', exact: true }).click()
    }
    await expect(input).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  return input
}

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

    const clubsTab = page.getByRole('button', {
      name: new RegExp(`Clubs\\s+${clubs.length}`),
    })
    await expect(clubsTab).toBeVisible()

    const summary = page.getByText(`${clubs.length} clubs`, { exact: true })
    await expect(async () => {
      await clubsTab.click()
      await expect(summary).toBeVisible({ timeout: 1000 })
    }).toPass()
  })

  test('shows a search empty state without a clear-filters action', async ({
    page,
  }) => {
    await page.goto('/en/clubs')
    const clubSearch = await openSearch(page)
    await clubSearch.fill('definitely-no-such-club')
    await expect(clubSearch).toHaveValue('definitely-no-such-club')

    await expect(
      page.getByRole('heading', { name: 'No results' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Clear filters' })
    ).toHaveCount(0)

    await page.goto('/en?day=1')
    const runSearch = await openSearch(page)
    await runSearch.fill('definitely-no-such-run')
    await expect(runSearch).toHaveValue('definitely-no-such-run')

    await expect(
      page.getByRole('heading', { name: 'No results' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Clear filters' })
    ).toHaveCount(0)
  })

  test('opens search without shifting the toolbar', async ({ page }) => {
    await gotoLoadedExplore(page, '/en')

    await page.getByRole('button', { name: 'Search', exact: true }).waitFor()
    await page.waitForTimeout(400)
    const toolbar = page.locator('.qr-search-toolbar:visible')
    const searchLayer = page.locator('.qr-search-layer:visible')
    const before = await toolbar.boundingBox()
    expect(before).toBeTruthy()

    await page.getByRole('button', { name: 'Search', exact: true }).click()
    const searchInput = page.getByPlaceholder('Search a run or club…')
    await expect(searchInput).toBeFocused()
    await expect(searchLayer).toHaveClass(/is-open/)

    const after = await toolbar.boundingBox()
    expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(1)
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(1)
    expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(1)
    expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThan(
      1
    )

    await searchInput.fill('faux')
    await page.keyboard.press('Escape')
    await expect(searchLayer).not.toHaveClass(/is-open/)
    await expect(searchInput).toHaveValue('')

    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.getByRole('button', { name: 'Close search' }).click()
    await expect(searchLayer).not.toHaveClass(/is-open/)
    await expect(
      page.getByRole('button', { name: 'Search', exact: true })
    ).toBeVisible()
    const closed = await toolbar.boundingBox()
    expect(Math.abs((closed?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(1)
    expect(Math.abs((closed?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(1)
    expect(Math.abs((closed?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(
      1
    )
    expect(
      Math.abs((closed?.height ?? 0) - (before?.height ?? 0))
    ).toBeLessThan(1)

    await page.getByRole('button', { name: 'Filters' }).click()
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Filters' })).toHaveCount(0)
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
    await expect(page.locator('.pin.is-active')).toHaveCount(1)
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

    await expect(page).toHaveURL(/\/en\/run\/[^?]+/)
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

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page).toHaveURL(/\/en\/clubs(?:\?.*)?$/)
    await expect(panels).toHaveCount(0)
  })

  test('club Back does not remount the closing detail panel', async ({
    page,
  }, testInfo) => {
    await page.goto('/en/clubs')
    await Promise.all([
      page.waitForURL(/\/en\/clubs\/fauxmouvement$/, { timeout: 15000 }),
      page
        .getByRole('button', { name: /Faux Mouvement/ })
        .first()
        .click(),
    ])
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
      const exitAnimation = await page
        .locator('.qr-detail-shell')
        .evaluate((panel) => {
          const animation = panel
            .getAnimations()
            .find(
              (candidate) =>
                candidate instanceof CSSAnimation &&
                candidate.animationName === 'detailPanelOut'
            )
          const finalKeyframe = (animation?.effect as KeyframeEffect | null)
            ?.getKeyframes()
            .at(-1)
          return {
            name:
              animation instanceof CSSAnimation ? animation.animationName : '',
            transform: String(finalKeyframe?.transform ?? ''),
          }
        })
      expect(exitAnimation.name).toBe('detailPanelOut')
      // Chromium serialises this as translate(-100%), older builds as translateX
      expect(exitAnimation.transform).toMatch(/^translate(X)?\(-100%\)$/)
    }
    await expect(page.locator('.qr-detail-shell')).toHaveCount(0)
    await expect(page).toHaveURL(/\/en\/clubs(?:\?.*)?$/)
    await expect(
      page.locator('.qr-root:not(.qr-detail-shell)')
    ).toHaveAttribute('data-detail-panel-mounts', '0')

    await page.goForward()
    await expect(page).toHaveURL(/\/en\/clubs\/fauxmouvement$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible()
  })

  test('club tab preserves the inactive day-strip footprint', async ({
    page,
  }, testInfo) => {
    await gotoLoadedExplore(page, '/en')

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

  test('run preview opens a route and survives Back', async ({
    page,
    request,
  }) => {
    const response = await request.get('/api/explore/runs?day=1')
    expect(response.ok()).toBe(true)
    const runs = (await response.json()) as { id: string; title: string }[]
    const run = runs[0]
    expect(run).toBeTruthy()

    await page.goto('/en?day=1')
    await page.getByText(run.title, { exact: false }).first().click()
    await expect(page).toHaveURL(/\/en\?day=1$/)
    await expect(page.locator('.pin.is-active')).toBeVisible()
    const detailsButton = page.getByRole('button', { name: /details/i }).first()
    await expect(detailsButton).toBeVisible()

    await detailsButton.click()
    await expect(page).toHaveURL(new RegExp(`/en/run/${run.id}(?:\\?.*)?$`))
    await expect(
      page.getByRole('heading', { level: 1, name: run.title })
    ).toBeVisible()
    await expect(page.locator('.pin.is-active')).toBeVisible()
    await expect(page.locator('.pin-wrap.is-hidden').first()).toHaveCSS(
      'opacity',
      '0'
    )

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.locator('.qr-detail-shell')).toHaveCount(0)
    await expect(page).toHaveURL(/\/en\?day=1$/)
    await expect(detailsButton).toBeVisible()
    await expect(page.locator('.pin.is-active')).toHaveCount(1)

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
    await expect(page.locator('.qr-detail-shell')).toHaveCount(0)
    await page
      .getByRole('button', { name: /details/i })
      .first()
      .click()
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

  test('direct run detail highlights the active map pin', async ({
    page,
  }, testInfo) => {
    const runId = 'fauxmouvement-mardi--2026-07-21'
    await page.goto(`/en/run/${runId}`)

    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.pin.is-active')).toHaveCount(1)
    await expect(page.locator('.pin-wrap.is-hidden').first()).toHaveCSS(
      'opacity',
      '0'
    )
    await expect(page.getByText(/Café de Course/)).toBeVisible()

    if (testInfo.project.name === 'Mobile Chrome') {
      await page.waitForTimeout(800)
      const panelBox = await page.locator('.qr-detail-shell').boundingBox()
      const pinBox = await page.locator('.pin.is-active').boundingBox()
      expect(panelBox).not.toBeNull()
      expect(pinBox).not.toBeNull()
      const exposedMapCenter = (76 + (panelBox?.y ?? 0)) / 2
      const pinCenter = (pinBox?.y ?? 0) + (pinBox?.height ?? 0) / 2
      expect(Math.abs(pinCenter - exposedMapCenter)).toBeLessThan(24)
    }

    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.locator('.qr-detail-shell.is-exiting')).toHaveCount(1)
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('.pin.is-active')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Faux Mouvement' })
    ).toHaveCount(0)
  })

  test('mobile club detail reaches its end with sticky actions', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'mobile layout only')
    await page.goto('/en/clubs/6am-club')
    await expect(
      page.getByRole('heading', { level: 1, name: '6AM Club' })
    ).toBeVisible({ timeout: 15000 })

    const panel = page.locator('.qr-detail-shell')
    const actions = panel.locator('.qr-detail-actions')
    const panelBox = await panel.boundingBox()
    expect(panelBox).not.toBeNull()
    expect(panelBox?.y).toBeGreaterThan(0)
    expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(
      (page.viewportSize()?.height ?? 0) + 1
    )

    await panel.evaluate((element) =>
      element.scrollTo({ top: element.scrollHeight, behavior: 'instant' })
    )
    await expect
      .poll(() =>
        panel.evaluate((element) =>
          Math.round(
            element.scrollHeight - element.clientHeight - element.scrollTop
          )
        )
      )
      .toBe(0)

    const actionBox = await actions.boundingBox()
    const lastContentBottom = await panel.evaluate((element) => {
      const content = element.querySelector('.detail-enter')
      return content?.lastElementChild?.getBoundingClientRect().bottom ?? 0
    })
    expect(actionBox?.y).toBeLessThan((panelBox?.y ?? 0) + 50)
    await panel.evaluate((element) =>
      element.scrollTo({
        top: element.scrollHeight - element.clientHeight - 100,
        behavior: 'instant',
      })
    )
    expect((await actions.boundingBox())?.y).toBeCloseTo(actionBox?.y ?? 0, 0)
    expect(lastContentBottom).toBeLessThanOrEqual(
      (panelBox?.y ?? 0) + (panelBox?.height ?? 0)
    )
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
