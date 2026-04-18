import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility audit — verify no WCAG 2.1 A/AA violations on the main page.
 *
 * Uses axe-core via @axe-core/playwright to catch common accessibility issues
 * such as missing labels, poor color contrast, and ARIA misuse.
 */

test('home page has no WCAG 2.1 A/AA violations', async ({ page }) => {
  await page.goto('/')
  // Wait for the app to fully render
  await page.getByLabel('Markdown input').waitFor()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('dark mode has no WCAG 2.1 A/AA violations', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Markdown input').waitFor()

  // Toggle to dark mode
  await page.getByRole('button', { name: /theme/i }).click()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
