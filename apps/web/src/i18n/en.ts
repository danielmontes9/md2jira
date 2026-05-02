/**
 * English UI string constants — single source of truth for every user-facing
 * string in the web app.
 *
 * To add a new locale:
 *   1. Copy this file and translate the values.
 *   2. Update `src/i18n/index.ts` to import the new locale and select it based
 *      on `navigator.language` (or a user setting).
 *
 * Intentionally kept as a plain typed record (no runtime library required)
 * so this foundation can be swapped for react-i18next or @formatjs/intl with
 * minimal effort.
 */
export const en = {
  // ── App shell ─────────────────────────────────────────────────────────────
  appTitle: 'md2jira-previewer',
  appSubtitle: 'Markdown to Jira Wiki Markup & ADF',

  // ── System banners ────────────────────────────────────────────────────────
  offlineBanner: "You're offline — the app is running from cache. Conversions still work.",
  updateAvailable: 'A new version is available.',
  updateNow: 'Update now',

  // ── Error banners ─────────────────────────────────────────────────────────
  conversionError: 'Conversion error — check your Markdown for unsupported syntax.',
  adfRenderError: 'Preview rendering failed — the ADF output could not be displayed.',
  switchToWiki: 'Switch to Wiki Markup',
  retry: 'Retry',

  // ── Panel labels ──────────────────────────────────────────────────────────
  markdownPanelLabel: 'Markdown',
  jiraOutputPanelLabel: 'Jira Output',
  renderingPreview: 'Rendering preview\u2026',

  // ── Editor toolbar ────────────────────────────────────────────────────────
  newDocument: 'New',
  clearEditorPrompt: 'Clear editor?',
  clearEditorYes: 'Yes',
  clearEditorNo: 'No',
  copyMarkdown: 'Copy Markdown',
  copyMd: 'Copy MD',
  importFile: 'Import Markdown file',
  importAction: 'Import',
  exportFile: 'Export Markdown file',
  exportAction: 'Export',
  shortcutsAction: 'Shortcuts',
  undoAction: 'Undo',
  redoAction: 'Redo',
  openSearch: 'Search',
  openShortcuts: 'Keyboard shortcuts',
  saveAction: 'Save',

  // ── Output panel ──────────────────────────────────────────────────────────
  outputLabel: 'Output',
  convertingLabel: 'Converting\u2026',
  copyRichText: 'Copy as rich text for Jira Cloud',
  copyWikiMarkup: 'Copy Wiki Markup to clipboard',
  copyForJira: 'Copy for Jira',
  copied: 'Copied!',
  outputFormatGroup: 'Output format',
  formatAdf: 'Jira Cloud',
  formatWiki: 'Wiki Markup',
  viewPreview: 'Preview',
  viewCode: 'Code',
  editToggle: 'Edit',
  viewToggle: 'View',
  adfCodeHint: 'Copies as rich text \u2014 paste directly into Jira Cloud comments',
  wikiCodeHint: 'Raw Wiki Markup \u2014 copy and paste into Jira Server/Data Center',

  // ── History sidebar ───────────────────────────────────────────────────────
  recentDocuments: 'Recent documents',
  closeHistory: 'Close document history',
  noDocumentsYet: 'No saved documents yet.',
  searchPlaceholder: 'Search\u2026',
  clearAll: 'Clear all',
  clearAllPrompt: 'Clear all?',
  historyExport: 'Export',
  historyImport: 'Import',
  deleteEntry: 'Delete',
  renameEntry: 'Rename',
  confirmRename: 'Confirm rename',
  cancelRename: 'Cancel rename',
  dateToday: 'Today',
  dateYesterday: 'Yesterday',
  dateThisWeek: 'This week',
  dateOlder: 'Older',

  // ── Settings modal ────────────────────────────────────────────────────────
  settingsTitle: 'Settings',
  darkModeLabel: 'Dark mode',
  darkModeDescription: 'Switch between light and dark appearance.',
  historyLabel: 'Save document history',
  historyDescription:
    'Automatically saves your recent documents to localStorage. View them in the history sidebar.',
  maxEntriesLabel: 'Maximum saved documents',

  // ── Shortcuts modal ───────────────────────────────────────────────────────
  keyboardShortcutsTitle: 'Keyboard Shortcuts',

  // ── Toast messages ────────────────────────────────────────────────────────
  importSuccess: 'Imported',
  exportSuccess: 'Exported',
  clipboardFail: 'Failed to copy to clipboard',
  adfWorkerStalled: 'ADF preview stalled \u2014 using fallback renderer.',
  colorWarning: 'Color formatting is not supported in Jira output and will be removed.',
  underlineWarning: 'Underline formatting is not supported in Jira output and will be removed.',
  wikiEditDesyncWarning:
    'Wiki markup edits are independent \u2014 changes won\u2019t sync back to the Markdown source.',
  newDocumentSaved: 'Document saved to history.',
} as const

export type StringKey = keyof typeof en
