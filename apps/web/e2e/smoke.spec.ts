import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Smoke + accessibility end-to-end tests.
 *
 * These run against the live dev server (started automatically by playwright.config.ts).
 * Install browsers once with: pnpm --filter web exec playwright install chromium
 * Run:                        pnpm --filter web exec playwright test
 */

test.describe('App — smoke', () => {
  test('page title is correct', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/md2jira/)
  })

  test('h1 heading contains "md2jira-previewer"', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('md2jira-previewer')
  })

  test('Markdown textarea is visible and accepts input', async ({ page }) => {
    await page.goto('/')
    const textarea = page.getByLabel('Markdown input')
    await expect(textarea).toBeVisible()
    await textarea.fill('# Hello E2E')
    await expect(textarea).toHaveValue(/Hello E2E/)
  })

  test('output format radiogroup is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('radiogroup', { name: /output format/i })).toBeVisible()
  })

  test('switching to Wiki Markup shows wiki output', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Markdown input').fill('# Hello')
    await page.getByRole('radio', { name: 'Wiki Markup' }).click()
    const region = page.getByRole('region', { name: /wiki markup preview/i })
    await expect(region).toBeVisible()
    await expect(region).toContainText('h1. Hello')
  })

  test('Copy for Jira button is present', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: /copy as rich text for jira cloud/i }).first()
    ).toBeVisible()
  })

  test('skip link becomes visible on focus', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    // Tab to the first focusable element — the skip link
    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
  })
})

test.describe('App — accessibility (axe-core)', () => {
  test('has no WCAG 2.x violations on initial load', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // requires real CSS rendering; covered by visual regression
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('has no WCAG 2.x violations in Wiki Markup mode', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('radio', { name: 'Wiki Markup' }).click()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})

