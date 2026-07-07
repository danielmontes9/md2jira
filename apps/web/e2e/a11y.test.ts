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
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('Wiki Markup mode has no WCAG 2.1 A/AA violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await page.getByRole('radio', { name: 'Wiki Markup' }).click()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('dark mode has no WCAG 2.1 A/AA violations', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark')
  })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown input' }).waitFor()
  await expect(page.locator('html')).toHaveClass(/dark/)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
