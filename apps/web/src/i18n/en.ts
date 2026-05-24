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

  // ── Shortcuts modal groups ────────────────────────────────────────────────
  scGroupFormatting: 'Formatting',
  scGroupStructure: 'Structure',
  scGroupLines: 'Lines',
  scGroupEditor: 'Editor',
  scGroupOutputFormat: 'Output format',
  scGroupWysiwyg: 'WYSIWYG editor (Edit mode only)',
  closeShortcutsModal: 'Close shortcuts panel',

  // ── Info modal ────────────────────────────────────────────────────────────
  infoSubtitle: 'Open-source Markdown \u2192 Jira converter',
  infoDescription:
    'md2jira converts Markdown documents into Jira Wiki Markup and Atlassian Document Format (ADF). Paste your Markdown on the left, get Jira-ready content on the right \u2014 copy and paste directly into any Jira Cloud issue, comment, or description.',
  infoPackages: 'Packages',
  infoLicense: 'MIT License',
  infoViewOnGithub: 'View on GitHub \u2192',
  infoCoreDesc:
    'Pure TypeScript conversion engine. Zero browser dependencies \u2014 works in Node.js, browsers, and VSCode extensions.',
  infoCliDesc: 'Command-line tool to convert Markdown files from your terminal.',
  infoWebDesc: 'This web app \u2014 live two-panel converter built with React 18 + Vite.',

  // ── Header ────────────────────────────────────────────────────────────────
  shareLink: 'Share link',
  exportPdf: 'Export PDF',
  tooLarge: 'Too large',
  docTooLargeForUrl: 'Document too large for URL sharing',
  documentHistory: 'Document history',
  historyDisabledHint: 'Document history (disabled \u2014 enable in Settings)',
  shareOrExport: 'Share or export',
  noContentToShare: 'No content to share or export yet',

  // ── WYSIWYG toolbar ───────────────────────────────────────────────────────
  wysiwygBulletList: 'Bullet list',
  wysiwygNumberedList: 'Numbered list',
  wysiwygTaskList: 'Task list',
  wysiwygRemoveColor: 'Remove color',
  wysiwygColorNote:
    'Color is editor-only and won\u2019t appear in exported Markdown or Jira markup.',
  wysiwygSearchEmojis: 'Search emojis',
  wysiwygEmojiPlaceholder: 'Search by category (Frequent, People, Objects, Symbols\u2026)',
  wysiwygNoEmojis: 'No emojis found',
  wysiwygLoading: 'Loading\u2026',
  wysiwygTableOptions: 'Table options',
  wysiwygTableAddRowBelow: 'Add row below',
  wysiwygTableAddRowAbove: 'Add row above',
  wysiwygTableAddColRight: 'Add column right',
  wysiwygTableAddColLeft: 'Add column left',
  wysiwygTableDeleteRow: 'Delete row',
  wysiwygTableDeleteCol: 'Delete column',
  wysiwygTableDelete: 'Delete table',
  historySelectMode: 'Select',
  historyCancelSelect: 'Cancel',
  historyDeleteSelected: 'Delete selected',
  historySelectAll: 'Select all',
  historyDeselectAll: 'Deselect all',

  // ── History sidebar (additional) ──────────────────────────────────────────
  historyEnableHint: 'Enable history in Settings and start editing.',
  historyNoMatch: 'No documents match',
  historySelectModeAriaLabel: 'Enter bulk selection mode',

  // ── Settings modal (additional) ───────────────────────────────────────────
  settingsLanguageLabel: 'Language',
  settingsLanguageDescription:
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface',
  closeSettings: 'Close settings',
  settingsMaxEntriesDescription: 'How many recent documents to keep in history.',
  settingsAbout: 'About this project',

  // ── Output panel / edit mode ──────────────────────────────────────────────
  switchToViewMode: 'Switch to view mode',
  switchToEditMode: 'Switch to edit mode',

  // ── Additional aria-labels & UI strings ───────────────────────────────────
  markdownPlaceholder: 'Paste your Markdown here...',
  openSettings: 'Open settings',
  searchHistory: 'Search history',
  clearSearch: 'Clear search',
  renameEntryLabel: 'Rename entry',
  currentlyLoaded: 'Currently loaded',
  saveToHistory: 'Save document to history',
  importHistory: 'Import history',
  exportHistory: 'Export history',
} as const

export type StringKey = keyof typeof en
