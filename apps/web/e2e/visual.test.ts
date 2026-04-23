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
  await page.getByLabel('Markdown input').waitFor()
  // Wait for the ADF worker to finish rendering the preview HTML
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('default-state.png')
})

test('Wiki Markup mode', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Markdown input').waitFor()
  await page.getByRole('radio', { name: 'Wiki Markup' }).click()
  await expect(page).toHaveScreenshot('wiki-markup-mode.png')
})

test('dark mode', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Markdown input').waitFor()
  // Theme toggle label is "Switch to dark mode" or "Switch to light mode"
  await page.getByRole('button', { name: /switch to/i }).click()
  // Allow 200 ms for the CSS transition to settle before snapshotting
  await page.waitForTimeout(200)
  await expect(page).toHaveScreenshot('dark-mode.png')
})

test('ADF code view', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Markdown input').waitFor()
  await page.getByRole('button', { name: 'Code' }).click()
  await expect(page).toHaveScreenshot('adf-code-view.png')
})

test('WYSIWYG edit mode with formatting toolbar', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Markdown input').waitFor()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /edit/i }).click()
  // Wait for the toolbar to animate in
  await page.getByRole('toolbar', { name: 'Text formatting' }).waitFor()
  await expect(page).toHaveScreenshot('wysiwyg-edit-mode.png')
})
