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
  formatConfluence: 'Confluence',
  viewPreview: 'Preview',
  viewCode: 'Code',
  editToggle: 'Edit',
  viewToggle: 'View',
  adfCodeHint: 'Copies as rich text \u2014 paste directly into Jira Cloud comments',
  wikiCodeHint: 'Raw Wiki Markup \u2014 copy and paste into Jira Server/Data Center',
  confluenceCodeHint:
    'Confluence Storage Format (XHTML) \u2014 import via REST API or paste into a Confluence page',
  copyConfluenceMarkup: 'Copy Confluence Storage Format to clipboard',

  // ── History sidebar ───────────────────────────────────────────────────────
  recentDocuments: 'Recent documents',
  closeHistory: 'Close document history',
  noDocumentsYet: 'No saved documents yet.',
  searchPlaceholder: 'Search\u2026',
  clearAll: 'Clear all',
  clearAllPrompt: 'Clear all?',
  historyExport: 'Export',
  historyImport: 'Import',
  historyImportSuccess: 'History imported',
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
  confluenceEditDesyncWarning:
    'Confluence Storage Format edits are independent \u2014 changes won\u2019t sync back to the Markdown source.',
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
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface \u00b7 Langue de l\u2019interface',
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
  // ── File import validation & toast ─────────────────────────────────────────
  importUnsupportedType: 'Unsupported file type. Please use a .md, .txt, or .text file.',
  importFileTooLarge: 'File too large. Maximum allowed size is 1 MB.',
  importReadError: 'Could not read the file. It may be corrupted or inaccessible.',
  // ── Generic modal / notification labels ───────────────────────────────────
  dismissToast: 'Dismiss notification',
  close: 'Close',
  historySavedCount: 'saved',
  historySavedCountOne: 'saved',
  // ── Structural panel / region labels ──────────────────────────────────────
  switchPanel: 'Switch panel',
  mainContent: 'Main content',
  jiraOutputPanel: 'Jira output',
  fileActions: 'File actions',
  markdownInputEditor: 'Markdown input editor',
  notificationsLabel: 'Notifications',
  // ── Header external link labels ───────────────────────────────────────────
  supportProject: 'Support the project \u2014 Buy me a coffee',
  starOnGitHub: 'Star on GitHub',
  viewOnGitHub: 'View project on GitHub',
  // ── Interpolated history entry labels ─────────────────────────────────────
  selectEntryLabel: 'Select "{title}"',
  renameEntryAction: 'Rename "{title}"',
  deleteEntryLabel: 'Delete "{title}" from history',
  // ── Aria labels not previously translated ─────────────────────────────────
  markdownInputSection: 'Markdown input',
  resizePanels: 'Resize panels',
  editActions: 'Edit actions',
  findReplace: 'Find / Replace',
  switchToLightMode: 'Switch to light mode',
  switchToDarkMode: 'Switch to dark mode',
  copyAndEditGroup: 'Copy and edit',
  textFormattingToolbar: 'Text formatting',
  codeSnippetButton: 'Code snippet',
  renderingJiraPreview: 'Rendering Jira preview',
  jiraContentEditor: 'Jira content editor',
  wikiMarkupEditor: 'Wiki Markup editor',
  wikiMarkupPreview: 'Wiki markup preview',
  confluenceMarkupEditor: 'Confluence Storage Format editor',
  viewModeGroup: 'View mode',
  // ── WYSIWYG toolbar — formatting buttons ─────────────────────────────────
  wysiwygBold: 'Bold',
  wysiwygItalic: 'Italic',
  wysiwygUnderline: 'Underline',
  wysiwygStrikethrough: 'Strikethrough',
  wysiwygInlineCode: 'Inline code',
  wysiwygSubscript: 'Subscript',
  wysiwygSuperscript: 'Superscript',
  wysiwygClearFormatting: 'Clear formatting',
  // ── WYSIWYG toolbar — dropdown labels ────────────────────────────────────
  wysiwygTextStyles: 'Text styles',
  wysiwygMoreFormatting: 'More formatting',
  wysiwygLists: 'Lists',
  wysiwygTextColor: 'Text color',
  wysiwygEmoji: 'Emoji',
  wysiwygInsertElements: 'Insert elements',
  // ── WYSIWYG toolbar — text style items ───────────────────────────────────
  wysiwygNormalText: 'Normal text',
  wysiwygHeading1: 'Heading 1',
  wysiwygHeading2: 'Heading 2',
  wysiwygHeading3: 'Heading 3',
  wysiwygHeading4: 'Heading 4',
  wysiwygHeading5: 'Heading 5',
  wysiwygHeading6: 'Heading 6',
  // ── WYSIWYG toolbar — Insert menu items ──────────────────────────────────
  wysiwygActionItem: 'Action item',
  wysiwygActionItemDesc: 'Create and assign action items',
  wysiwygMention: 'Mention',
  wysiwygMentionDesc: 'Insert @mention \u2014 cursor lands after the @ symbol',
  wysiwygInsertTable: 'Table',
  wysiwygInsertTableDesc: 'Insert a table',
  wysiwygInfoPanel: 'Info panel',
  wysiwygInfoPanelDesc: 'Highlight information in a color panel',
  wysiwygQuote: 'Quote',
  wysiwygQuoteDesc: 'Insert a quote or reference',
  wysiwygDecision: 'Decision',
  wysiwygDecisionDesc: 'Capture decisions to track them',
  wysiwygDivider: 'Divider',
  wysiwygDividerDesc: 'Insert a dividing line',
  // ── WYSIWYG — lossy-format warning ───────────────────────────────────────
  lostInJira: 'Lost in Jira',
  lostInJiraTooltip: 'Underline and color formatting will not appear in the Jira Wiki output',
  // ── Code view region labels ───────────────────────────────────────────────
  adfCodeLabel: 'ADF JSON code',
  wikiCodeLabel: 'Wiki markup code',
  // ── Skip link ─────────────────────────────────────────────────────────────
  skipToMainContent: 'Skip to main content',
  // ── New document modal ─────────────────────────────────────────────────────
  newDocumentModalTitle: 'New document',
  newDocumentNameLabel: 'Document name',
  newDocumentNamePlaceholder: 'Optional',
  newDocumentCreate: 'Create',
  // ── Tooltip titles ────────────────────────────────────────────────────────
  newDocumentTitle: 'New document (clears editor)',
  importHistoryTitle: 'Import history from JSON',
  exportHistoryTitle: 'Export history as JSON',
  // ── Character count ───────────────────────────────────────────────────────
  charsLabel: 'chars',
  // ── Share modal ───────────────────────────────────────────────────────────
  shareDocumentTitle: 'Share document',
  shareDocumentDesc: 'Share this link so others can view your converted Markdown document.',
  copyLinkToShare: 'Copy link to share',
  // ── Keyboard shortcuts — shortcut labels ──────────────────────────────────
  scLabelBold: 'Bold',
  scLabelItalic: 'Italic',
  scLabelInsertLink: 'Insert link',
  scLabelInlineCode: 'Inline code',
  scLabelStrikethrough: 'Strikethrough',
  scLabelCycleHeading: 'Cycle heading (h1 \u2192 h2 \u2192 h3 \u2192 none)',
  scLabelToggleBulletList: 'Toggle bullet list',
  scLabelToggleNumberedList: 'Toggle numbered list',
  scLabelToggleBlockquote: 'Toggle blockquote',
  scLabelInsertCodeBlock: 'Insert code block \u26a0 may conflict with DevTools on Chrome/Edge',
  scLabelInsertBlankLine: 'Insert blank line below',
  scLabelMoveLineUp: 'Move line up',
  scLabelMoveLineDown: 'Move line down',
  scLabelDuplicateLine: 'Duplicate line',
  scLabelIndent: 'Indent (2 spaces)',
  scLabelDedent: 'Dedent (remove 2 spaces)',
  scLabelAutoContinueList: 'Auto-continue list item',
  scLabelSaveHistory: 'Save to history',
  scLabelSaveHistoryDisabled: 'Save to history (enable in Settings)',
  scLabelSwitchAdf: 'Switch to Jira Cloud (ADF)',
  scLabelSwitchWiki: 'Switch to Wiki Markup',
  scLabelToggleHistory: 'Toggle document history',
  scLabelNewDocument: 'New document (saves to history first)',
  scLabelUnderline: 'Underline',
  scLabelUndo: 'Undo',
  scLabelRedo: 'Redo',
  scLabelOrderedList: 'Ordered list',
  scLabelBulletList: 'Bullet list',
  scLabelBlockquote: 'Blockquote',
  // ── Format menu — footnote ────────────────────────────────────────────────
  wysiwygSubSupNote:
    'Subscript and superscript are editor-only \u2014 they serialize to HTML tags in exported Markdown.',
  renderError: 'Render error',
  retriesRemaining: 'remaining',
  retriesRemainingOne: 'remaining',
  maxRetriesLabel: 'Maximum retries reached. Please reload the page.',
  buyMeACoffee: '☕ Buy me a coffee',
  // ── Screen reader live region announcements ───────────────────────────────
  editModeEnabled: 'Edit mode enabled',
  copiedToClipboard: 'Copied to clipboard',
  // ── Settings — Base URL ───────────────────────────────────────────────────
  settingsBaseUrlLabel: 'Base URL for relative links',
  settingsBaseUrlDescription:
    'Prepended to relative links (e.g. /wiki/page \u2192 https://company.atlassian.net/wiki/page). Leave empty to keep links unchanged.',
  settingsBaseUrlPlaceholder: 'https://your-instance.atlassian.net',
  // ── Insert menu — additional panels ──────────────────────────────────────
  wysiwygNotePanel: 'Note panel',
  wysiwygNotePanelDesc: 'Highlight a note or tip in blue',
  wysiwygWarningPanel: 'Warning panel',
  wysiwygWarningPanelDesc: 'Highlight a warning or caution in yellow',
  wysiwygSuccessPanel: 'Success panel',
  wysiwygSuccessPanelDesc: 'Highlight a success or positive outcome in green',
  // ── History diff ──────────────────────────────────────────────────────────
  historyDiff: 'Diff',
  historyDiffModalTitle: 'Compare with current document',
  historyDiffNoChanges: 'No differences \u2014 this entry matches the current document.',
  historyDiffLabelBefore: 'This entry',
  historyDiffLabelAfter: 'Current',
  historyDiffTruncated: 'Diff truncated to {n} lines per side', // ── Wiki \u2192 Markdown sync ─────────────────────────────────────────────────
  wikiSyncToMarkdown: 'Sync to Markdown',
  wikiSyncToMarkdownTitle:
    'Convert the Wiki Markup back to Markdown and replace the editor content',
  wikiSyncApplied: 'Wiki markup synced to Markdown source',
  // ── Autosave indicator ────────────────────────────────────────────────────
  autoSavedJustNow: 'Saved just now',
  autoSavedMinutesAgo: 'Saved {n}m ago',
  // ── Resize handle ─────────────────────────────────────────────────────────
  resizeValueText: '{left}% left panel, {right}% right panel',
  // ── Bulk delete confirmation ───────────────────────────────────────────────
  historyDeleteSelectedConfirm: 'Confirm delete?',
  historyBulkDeleteTitle: 'Delete selected documents?',
  historyBulkDeleteWarning: 'This action cannot be undone.',
} as const

export type StringKey = keyof typeof en
