import { test, expect, type Page } from '@playwright/test'

/**
 * Visual regression tests — pixel-level comparison against committed baselines.
 *
 * These tests run ONLY in the "visual" Playwright project (Chromium) and are
 * excluded from the default chromium/firefox/webkit projects, so `test:e2e`
 * does NOT run them.
 *
 * Workflow:
 *   1. Generate baselines (once, ideally on Linux to match CI font rendering):
 *        pnpm --filter web test:e2e:update-snapshots
 *   2. Review the generated PNGs in apps/web/e2e/__snapshots__/
 *   3. Commit the PNGs — CI will compare against them on every push.
 *   4. When you make an intentional visual change, re-run --update-snapshots
 *      and commit the updated PNGs.
 *
 * Run comparisons manually:
 *   pnpm --filter web test:e2e:visual
 */

async function waitForHeaderImage(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const img = document.querySelector<HTMLImageElement>('img[alt="Buy Me A Coffee"]')
    return !img || (img.complete && img.naturalWidth > 0)
  })
}

async function waitForAdfPreview(page: Page): Promise<void> {
  await page
    .getByRole('status', { name: 'Rendering Jira preview' })
    .waitFor({ state: 'hidden', timeout: 10000 })
  await expect(page.getByRole('textbox', { name: 'Jira content editor' })).toBeVisible()
}

test('default state — Jira Cloud preview', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await waitForHeaderImage(page)
  await waitForAdfPreview(page)
  await expect(page).toHaveScreenshot('default-state.png')
})

test('Wiki Markup mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await waitForHeaderImage(page)
  await page.getByRole('radio', { name: 'Wiki Markup' }).click()
  // Wiki conversion is synchronous, but wait for the pre element to be visible
  // before snapshotting to guard against layout shifts on slow CI runners.
  await page.getByRole('region', { name: 'Wiki markup preview' }).waitFor()
  await expect(page).toHaveScreenshot('wiki-markup-mode.png')
})

test('dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
  })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await waitForHeaderImage(page)
  // Wait for the 'dark' class to appear on <html> — deterministic alternative
  // to waitForTimeout() that is immune to CI load spikes.
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
  await waitForAdfPreview(page)
  await expect(page).toHaveScreenshot('dark-mode.png')
})

test('ADF code view', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await waitForHeaderImage(page)
  await page.getByRole('radio', { name: 'Code' }).waitFor()
  await page.getByRole('radio', { name: 'Code' }).click()
  await expect(page).toHaveScreenshot('adf-code-view.png')
})

test('WYSIWYG edit mode with formatting toolbar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await waitForHeaderImage(page)
  await waitForAdfPreview(page)
  await page.getByRole('button', { name: /edit/i }).click()
  // Wait for the toolbar to animate in
  await page.getByRole('toolbar', { name: 'Text formatting' }).waitFor()
  await expect(page).toHaveScreenshot('wysiwyg-edit-mode.png')
})

test('offline banner', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await waitForHeaderImage(page)
  // Simulate losing network connectivity
  await page.context().setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await page.waitForSelector('[role="status"]')
  await expect(page).toHaveScreenshot('offline-banner.png')
  await page.context().setOffline(false)
})
