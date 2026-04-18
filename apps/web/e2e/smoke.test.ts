import { test, expect } from '@playwright/test'

/**
 * Smoke tests — verify core user flows work end-to-end in a real browser.
 *
 * Prerequisites:
 *   pnpm --filter web exec playwright install chromium
 *   pnpm --filter web exec playwright test
 */

test('page title is correct', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/md2jira/)
})

test('typing markdown converts to Jira Wiki Markup', async ({ page }) => {
  await page.goto('/')

  const textarea = page.getByLabel('Markdown input')
  await textarea.fill('# Hello World\n\nThis is **bold** text.')

  // Switch to Wiki Markup format if not already selected
  await page.getByRole('button', { name: 'Wiki Markup' }).click()
  // Switch to Code view to see raw output
  await page.getByRole('button', { name: 'Code' }).click()

  const codeRegion = page.getByRole('region', { name: 'Jira markup code' })
  await expect(codeRegion).toContainText('h1. Hello World')
  await expect(codeRegion).toContainText('*bold*')
})

test('import button is visible and labelled', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Import Markdown file' })).toBeVisible()
})

test('export button is visible and labelled', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Export Markdown file' })).toBeVisible()
})

test('format toggle switches between Jira Cloud and Wiki Markup', async ({ page }) => {
  await page.goto('/')

  const jiraCloudBtn = page.getByRole('button', { name: 'Jira Cloud' })
  const wikiBtn = page.getByRole('button', { name: 'Wiki Markup' })

  await expect(jiraCloudBtn).toHaveAttribute('aria-pressed', 'true')
  await wikiBtn.click()
  await expect(wikiBtn).toHaveAttribute('aria-pressed', 'true')
  await expect(jiraCloudBtn).toHaveAttribute('aria-pressed', 'false')
})
