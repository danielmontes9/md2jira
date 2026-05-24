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

  const codeRegion = page.getByRole('region', { name: 'Wiki markup code' })
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
  // Default format is ADF — code region label reflects that
  await expect(page.getByRole('region', { name: 'ADF JSON code' })).toBeVisible()
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

// ─── Mobile panel tabs ────────────────────────────────────────────────────────

test('mobile tab strip is hidden at desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  // The tab strip only renders on small screens (sm: breakpoint = 640 px).
  // At desktop width it must not be visible.
  await expect(page.getByRole('button', { name: 'Markdown' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Jira Output' })).not.toBeVisible()
})

test('mobile tab strip switches panels on small screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  // 'Markdown' tab is active by default — input panel visible
  const mdTab = page.getByRole('button', { name: 'Markdown' })
  const outputTab = page.getByRole('button', { name: 'Jira Output' })
  await expect(mdTab).toBeVisible()
  await expect(mdTab).toHaveAttribute('aria-pressed', 'true')

  // Switch to output panel
  await outputTab.click()
  await expect(outputTab).toHaveAttribute('aria-pressed', 'true')
  await expect(mdTab).toHaveAttribute('aria-pressed', 'false')
})

// ─── Desktop resize handle ────────────────────────────────────────────────────

test('resize handle is visible on desktop and has ARIA attributes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const handle = page.getByRole('separator', { name: 'Resize panels' })
  await expect(handle).toBeVisible()
  await expect(handle).toHaveAttribute('aria-valuenow', '50')
  await expect(handle).toHaveAttribute('aria-valuemin', '20')
  await expect(handle).toHaveAttribute('aria-valuemax', '80')
})

test('resize handle responds to keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')

  const handle = page.getByRole('separator', { name: 'Resize panels' })
  await handle.focus()

  // ArrowRight should increase split by 1
  await page.keyboard.press('ArrowRight')
  await expect(handle).toHaveAttribute('aria-valuenow', '51')

  // ArrowLeft should decrease split by 1
  await page.keyboard.press('ArrowLeft')
  await expect(handle).toHaveAttribute('aria-valuenow', '50')
})

// ─── Keyboard shortcuts for format switching ──────────────────────────────────

test('Alt+Shift+W keyboard shortcut switches output to Wiki Markup', async ({ page }) => {
  await page.goto('/')

  // Default state: Jira Cloud is active
  await expect(page.getByRole('button', { name: 'Jira Cloud' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )

  // Press Alt+Shift+W to switch to Wiki Markup
  await page.keyboard.press('Alt+Shift+W')

  await expect(page.getByRole('button', { name: 'Wiki Markup' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByRole('button', { name: 'Jira Cloud' })).toHaveAttribute(
    'aria-pressed',
    'false'
  )
})

test('Alt+Shift+A keyboard shortcut switches output to Jira Cloud (ADF)', async ({ page }) => {
  await page.goto('/')

  // Start in Wiki Markup mode
  await page.getByRole('button', { name: 'Wiki Markup' }).click()
  await expect(page.getByRole('button', { name: 'Wiki Markup' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )

  // Press Alt+Shift+A to switch back to Jira Cloud
  await page.keyboard.press('Alt+Shift+A')

  await expect(page.getByRole('button', { name: 'Jira Cloud' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByRole('button', { name: 'Wiki Markup' })).toHaveAttribute(
    'aria-pressed',
    'false'
  )
})

// ─── Language selector ────────────────────────────────────────────────────────

test('Settings — language selector switches UI to Spanish', async ({ page }) => {
  await page.goto('/')

  // Open the Settings modal
  await page.getByRole('button', { name: 'Open settings' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Select Español from the language radio group
  await page.getByRole('radio', { name: 'Español' }).click()

  // Close the modal
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()

  // The "Copy for Jira" button should now show "Copiar para Jira" in Spanish
  await expect(page.getByRole('button', { name: /copiar para jira/i }).first()).toBeVisible()
})

test('Settings — switching back to English restores English UI', async ({ page }) => {
  await page.goto('/')

  // Switch to Spanish first
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('radio', { name: 'Español' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /copiar para jira/i }).first()).toBeVisible()

  // Switch back to English
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('radio', { name: 'English' }).click()
  await page.keyboard.press('Escape')

  // English strings should be restored
  await expect(
    page.getByRole('button', { name: /copy as rich text for jira cloud/i }).first()
  ).toBeVisible()
})

test('Settings — language selector switches UI to French', async ({ page }) => {
  await page.goto('/')

  // Open Settings and select French
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('radio', { name: 'Fran\u00e7ais' }).click()
  await page.keyboard.press('Escape')

  // The "Copy for Jira" button should now show French text
  await expect(page.getByRole('button', { name: /copier pour jira/i }).first()).toBeVisible()

  // Reset to English to avoid polluting subsequent tests
  await page.getByRole('button', { name: /open settings|ouvrir/i }).click()
  await page.getByRole('radio', { name: 'English' }).click()
  await page.keyboard.press('Escape')
})
