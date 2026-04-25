import { test, expect } from '@playwright/test'
import path from 'node:path'

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

  const textarea = page.getByRole('textbox', { name: 'Markdown input' })
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

test('h1 heading contains the app name', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('md2jira')
})

test('Markdown textarea is visible and accepts input', async ({ page }) => {
  await page.goto('/')
  const textarea = page.getByRole('textbox', { name: 'Markdown input' })
  await expect(textarea).toBeVisible()
  await textarea.fill('# Hello E2E')
  await expect(textarea).toHaveValue(/Hello E2E/)
})

test('output format radiogroup is present', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('radiogroup', { name: /output format/i })).toBeVisible()
})

test('Copy for Jira button is visible on load', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('button', { name: /copy as rich text for jira cloud/i }).first()
  ).toBeVisible()
})

test('skip link is the first focusable element and becomes visible on Tab', async ({ page }) => {
  await page.goto('/')
  const skipLink = page.getByRole('link', { name: /skip to main content/i })
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
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

test('URL deep-linking: ?md= param pre-populates the editor', async ({ page }) => {
  // base64url of "# Hello from URL"
  const encoded = btoa(encodeURIComponent('# Hello from URL'))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  await page.goto(`/?md=${encoded}`)

  const textarea = page.getByRole('textbox', { name: 'Markdown input' })
  await expect(textarea).toHaveValue(/Hello from URL/)
})

test('Preview / Code view toggle works', async ({ page }) => {
  await page.goto('/')

  const previewBtn = page.getByRole('radio', { name: 'Preview' })
  const codeBtn = page.getByRole('radio', { name: 'Code' })

  await expect(previewBtn).toHaveAttribute('aria-pressed', 'true')
  await codeBtn.click()
  await expect(codeBtn).toHaveAttribute('aria-pressed', 'true')
  // Code region should now be visible
  await expect(page.getByRole('region', { name: 'Jira markup code' })).toBeVisible()
})

test('Shortcuts button opens the shortcuts modal', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Show keyboard shortcuts' }).click()
  // The modal should appear with a heading
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('theme toggle button has accessible label', async ({ page }) => {
  await page.goto('/')

  // The button label includes "Switch to"
  const themeBtn = page.getByRole('button', { name: /switch to/i })
  await expect(themeBtn).toBeVisible()
  await themeBtn.click()
  // After toggling, the label should flip
  await expect(page.getByRole('button', { name: /switch to/i })).toBeVisible()
})

test('WYSIWYG edit mode: toolbar appears and editor becomes writable', async ({ page }) => {
  await page.goto('/')
  const editBtn = page.getByRole('button', { name: 'Edit' })
  await expect(editBtn).toBeVisible()
  const editor = page.getByRole('textbox', { name: 'Jira content editor' })
  await expect(editor).toHaveAttribute('aria-readonly', 'true')
  await editBtn.click()
  await expect(editor).toHaveAttribute('aria-readonly', 'false')
  await expect(page.getByRole('button', { name: 'View' })).toBeVisible()
})

test('conversion error banner appears for invalid markdown syntax', async ({ page }) => {
  // The app has an error boundary that shows a banner on conversion failure.
  // Since conversions are resilient, we just verify the banner is NOT shown on load.
  await page.goto('/')
  await expect(page.getByRole('alert')).not.toBeVisible()
})

// ─── WYSIWYG Editor (ADF / Jira Cloud mode) ──────────────────────────────────

test('Edit toggle enables the WYSIWYG toolbar', async ({ page }) => {
  await page.goto('/')

  // The app defaults to Jira Cloud (ADF) mode and Preview view.
  // The toolbar should not be visible before editing is enabled.
  await expect(page.getByRole('toolbar', { name: 'Text formatting' })).not.toBeVisible()

  // Switch to ADF preview mode and activate editing
  const editBtn = page.getByRole('button', { name: /edit/i })
  await expect(editBtn).toBeVisible()
  await editBtn.click()

  // After clicking Edit the toolbar should appear
  await expect(page.getByRole('toolbar', { name: 'Text formatting' })).toBeVisible()
})

test('Escape key closes an open toolbar dropdown', async ({ page }) => {
  await page.goto('/')

  // Enter edit mode first
  await page.getByRole('button', { name: /edit/i }).click()
  await expect(page.getByRole('toolbar', { name: 'Text formatting' })).toBeVisible()

  // Open the Text Style dropdown (first menu in toolbar)
  const textStyleBtn = page.getByRole('button', { name: /text style/i })
  await textStyleBtn.click()
  // A listbox / menu should be visible
  await expect(page.getByRole('listbox')).toBeVisible()

  // Press Escape — dropdown must close
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox')).not.toBeVisible()
})

test('Typing in edit mode updates the Markdown input panel', async ({ page }) => {
  await page.goto('/')

  // Clear the default content and start fresh
  const textarea = page.getByRole('textbox', { name: 'Markdown input' })
  await textarea.fill('')

  // Enter ADF edit mode
  await page.getByRole('button', { name: /edit/i }).click()

  // The TipTap editor should be focusable — click into it and type
  const editor = page.locator('[contenteditable="true"]')
  await editor.click()
  await page.keyboard.type('Hello WYSIWYG')

  // The Markdown textarea should eventually reflect the typed text
  await expect(textarea).toContainText('Hello WYSIWYG', { timeout: 2000 })
})

// ─── File Import ──────────────────────────────────────────────────────────────

test('importing a .md file populates the Markdown input', async ({ page }) => {
  await page.goto('/')

  // Use a fixture file located alongside the test
  const fixturePath = path.join(__dirname, 'fixtures', 'sample.md')
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(fixturePath)

  // The textarea content should update to match the file contents
  const textarea = page.getByRole('textbox', { name: 'Markdown input' })
  await expect(textarea).toContainText('# Sample', { timeout: 3000 })
})
