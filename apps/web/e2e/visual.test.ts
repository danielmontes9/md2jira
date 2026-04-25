import { test, expect } from '@playwright/test'

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

test('default state — Jira Cloud preview', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  // Wait for ADF preview content to settle (worker renders asynchronously)
  await page.waitForTimeout(1500)
  await expect(page).toHaveScreenshot('default-state.png')
})

test('Wiki Markup mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await page.getByRole('radio', { name: 'Wiki Markup' }).click()
  await expect(page).toHaveScreenshot('wiki-markup-mode.png')
})

test('dark mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  // Theme toggle label is "Switch to dark mode" or "Switch to light mode"
  await page.getByRole('button', { name: /switch to/i }).click()
  // Allow 200 ms for the CSS transition to settle before snapshotting
  await page.waitForTimeout(200)
  await expect(page).toHaveScreenshot('dark-mode.png')
})

test('ADF code view', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await page.getByRole('radio', { name: 'Code' }).waitFor()
  await page.getByRole('radio', { name: 'Code' }).click()
  await expect(page).toHaveScreenshot('adf-code-view.png')
})

test('WYSIWYG edit mode with formatting toolbar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  // Wait for the Edit button to be available before clicking
  await page.getByRole('button', { name: /edit/i }).waitFor()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: /edit/i }).click()
  // Wait for the toolbar to animate in
  await page.getByRole('toolbar', { name: 'Text formatting' }).waitFor()
  await expect(page).toHaveScreenshot('wysiwyg-edit-mode.png')
})

test('offline banner', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  // Simulate losing network connectivity
  await page.context().setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await page.waitForSelector('[role="status"]')
  await expect(page).toHaveScreenshot('offline-banner.png')
  await page.context().setOffline(false)
})
