import type { StringKey } from './en.js'

export const de: Record<StringKey, string> = {
  // ── App shell ─────────────────────────────────────────────────────────────
  appTitle: 'md2jira-previewer',
  appSubtitle: 'Markdown zu Jira Wiki Markup & ADF',

  // ── System banners ────────────────────────────────────────────────────────
  offlineBanner:
    'Du bist offline \u2014 die App l\u00e4uft aus dem Cache. Konvertierungen funktionieren weiterhin.',
  updateAvailable: 'Eine neue Version ist verf\u00fcgbar.',
  updateNow: 'Jetzt aktualisieren',

  // ── Error banners ─────────────────────────────────────────────────────────
  conversionError:
    'Konvertierungsfehler \u2014 \u00fcberpr\u00fcfe das Markdown auf nicht unterst\u00fctzte Syntax.',
  adfRenderError:
    'Vorschau-Rendering fehlgeschlagen \u2014 die ADF-Ausgabe konnte nicht angezeigt werden.',
  switchToWiki: 'Zu Wiki Markup wechseln',
  retry: 'Erneut versuchen',

  // ── Panel labels ──────────────────────────────────────────────────────────
  markdownPanelLabel: 'Markdown',
  jiraOutputPanelLabel: 'Jira-Ausgabe',
  renderingPreview: 'Vorschau wird erstellt\u2026',

  // ── Editor toolbar ────────────────────────────────────────────────────────
  newDocument: 'Neu',
  clearEditorPrompt: 'Editor leeren?',
  clearEditorYes: 'Ja',
  clearEditorNo: 'Nein',
  copyMarkdown: 'Markdown kopieren',
  copyMd: 'MD kopieren',
  importFile: 'Markdown-Datei importieren',
  importAction: 'Importieren',
  exportFile: 'Markdown-Datei exportieren',
  exportAction: 'Exportieren',
  shortcutsAction: 'Tastenkürzel',
  undoAction: 'R\u00fcckg\u00e4ngig',
  redoAction: 'Wiederholen',
  openSearch: 'Suchen',
  openShortcuts: 'Tastaturk\u00fcrzel',
  saveAction: 'Speichern',

  // ── Output panel ──────────────────────────────────────────────────────────
  outputLabel: 'Ausgabe',
  convertingLabel: 'Konvertiere\u2026',
  copyRichText: 'Als Rich Text f\u00fcr Jira Cloud kopieren',
  copyWikiMarkup: 'Wiki Markup in die Zwischenablage kopieren',
  copyForJira: 'F\u00fcr Jira kopieren',
  copied: 'Kopiert!',
  outputFormatGroup: 'Ausgabeformat',
  formatAdf: 'Jira Cloud',
  formatWiki: 'Wiki Markup',
  formatConfluence: 'Confluence',
  viewPreview: 'Vorschau',
  viewCode: 'Code',
  editToggle: 'Bearbeiten',
  viewToggle: 'Ansicht',
  adfCodeHint: 'Als Rich Text kopiert \u2014 direkt in Jira Cloud-Kommentare einf\u00fcgen',
  wikiCodeHint: 'Rohes Wiki Markup \u2014 in Jira Server/Data Center kopieren und einf\u00fcgen',
  confluenceCodeHint:
    'Confluence Storage Format (XHTML) \u2014 per REST API importieren oder in eine Confluence-Seite einf\u00fcgen',
  copyConfluenceMarkup: 'Confluence Storage Format in die Zwischenablage kopieren',

  // ── History sidebar ───────────────────────────────────────────────────────
  recentDocuments: 'Letzte Dokumente',
  closeHistory: 'Dokumentverlauf schlie\u00dfen',
  noDocumentsYet: 'Noch keine gespeicherten Dokumente.',
  searchPlaceholder: 'Suchen\u2026',
  clearAll: 'Alles l\u00f6schen',
  clearAllPrompt: 'Alles l\u00f6schen?',
  historyExport: 'Exportieren',
  historyImport: 'Importieren',
  historyImportSuccess: 'Verlauf importiert',
  deleteEntry: 'L\u00f6schen',
  renameEntry: 'Umbenennen',
  confirmRename: 'Umbenennen best\u00e4tigen',
  cancelRename: 'Umbenennen abbrechen',
  dateToday: 'Heute',
  dateYesterday: 'Gestern',
  dateThisWeek: 'Diese Woche',
  dateOlder: '\u00c4lter',

  // ── Settings modal ────────────────────────────────────────────────────────
  settingsTitle: 'Einstellungen',
  darkModeLabel: 'Dunkles Design',
  darkModeDescription: 'Zwischen hellem und dunklem Erscheinungsbild wechseln.',
  historyLabel: 'Dokumentverlauf speichern',
  historyDescription:
    'Speichert deine aktuellen Dokumente automatisch in localStorage. In der Verlaufs-Seitenleiste anzeigen.',
  maxEntriesLabel: 'Maximale gespeicherte Dokumente',

  // ── Shortcuts modal ───────────────────────────────────────────────────────
  keyboardShortcutsTitle: 'Tastaturk\u00fcrzel',

  // ── Toast messages ────────────────────────────────────────────────────────
  importSuccess: 'Importiert',
  exportSuccess: 'Exportiert',
  clipboardFail: 'Kopieren in die Zwischenablage fehlgeschlagen',
  adfWorkerStalled: 'ADF-Vorschau blockiert \u2014 Fallback-Renderer wird verwendet.',
  colorWarning:
    'Farbformatierung wird in der Jira-Ausgabe nicht unterst\u00fctzt und wird entfernt.',
  underlineWarning:
    'Unterstreichungsformatierung wird in der Jira-Ausgabe nicht unterst\u00fctzt und wird entfernt.',
  wikiEditDesyncWarning:
    'Wiki-Markup-Bearbeitungen sind unabh\u00e4ngig \u2014 \u00c4nderungen werden nicht mit der Markdown-Quelle synchronisiert.',
  confluenceEditDesyncWarning:
    'Confluence-Storage-Format-Bearbeitungen sind unabh\u00e4ngig \u2014 \u00c4nderungen werden nicht mit der Markdown-Quelle synchronisiert.',
  newDocumentSaved: 'Dokument im Verlauf gespeichert.',

  // ── Shortcuts modal groups ────────────────────────────────────────────────
  scGroupFormatting: 'Formatierung',
  scGroupStructure: 'Struktur',
  scGroupLines: 'Zeilen',
  scGroupEditor: 'Editor',
  scGroupOutputFormat: 'Ausgabeformat',
  scGroupWysiwyg: 'WYSIWYG-Editor (nur im Bearbeitungsmodus)',
  closeShortcutsModal: 'Tastaturk\u00fcrzel-Panel schlie\u00dfen',

  // ── Info modal ────────────────────────────────────────────────────────────
  infoSubtitle: 'Open-Source Markdown \u2192 Jira-Konverter',
  infoDescription:
    'md2jira konvertiert Markdown-Dokumente in Jira Wiki Markup und Atlassian Document Format (ADF). F\u00fcge dein Markdown links ein, erhalte Jira-fertigen Inhalt rechts \u2014 direkt in ein Jira Cloud-Issue, einen Kommentar oder eine Beschreibung kopieren und einf\u00fcgen.',
  infoPackages: 'Pakete',
  infoLicense: 'MIT-Lizenz',
  infoViewOnGithub: 'Auf GitHub ansehen \u2192',
  infoCoreDesc:
    'Reines TypeScript-Konvertierungsmodul. Keine Browser-Abh\u00e4ngigkeiten \u2014 funktioniert in Node.js, Browsern und VSCode-Erweiterungen.',
  infoCliDesc: 'Befehlszeilentool zum Konvertieren von Markdown-Dateien aus deinem Terminal.',
  infoWebDesc: 'Diese Web-App \u2014 Echtzeit-Zwei-Panel-Konverter mit React 18 + Vite.',

  // ── Header ────────────────────────────────────────────────────────────────
  shareLink: 'Link teilen',
  exportPdf: 'Als PDF exportieren',
  tooLarge: 'Zu gro\u00df',
  docTooLargeForUrl: 'Dokument zu gro\u00df f\u00fcr URL-Freigabe',
  documentHistory: 'Dokumentverlauf',
  historyDisabledHint: 'Dokumentverlauf (deaktiviert \u2014 in Einstellungen aktivieren)',
  shareOrExport: 'Teilen oder exportieren',
  noContentToShare: 'Noch kein Inhalt zum Teilen oder Exportieren',

  // ── WYSIWYG toolbar ───────────────────────────────────────────────────────
  wysiwygBulletList: 'Aufz\u00e4hlungsliste',
  wysiwygNumberedList: 'Nummerierte Liste',
  wysiwygTaskList: 'Aufgabenliste',
  wysiwygRemoveColor: 'Farbe entfernen',
  wysiwygColorNote:
    'Farbe ist nur im Editor und erscheint nicht im exportierten Markdown oder Jira-Markup.',
  wysiwygSearchEmojis: 'Emojis suchen',
  wysiwygEmojiPlaceholder: 'Nach Kategorie suchen (H\u00e4ufig, Personen, Objekte, Symbole\u2026)',
  wysiwygNoEmojis: 'Keine Emojis gefunden',
  wysiwygLoading: 'Wird geladen\u2026',
  wysiwygTableOptions: 'Tabellenoptionen',
  wysiwygTableAddRowBelow: 'Zeile darunter einf\u00fcgen',
  wysiwygTableAddRowAbove: 'Zeile dar\u00fcber einf\u00fcgen',
  wysiwygTableAddColRight: 'Spalte rechts einf\u00fcgen',
  wysiwygTableAddColLeft: 'Spalte links einf\u00fcgen',
  wysiwygTableDeleteRow: 'Zeile l\u00f6schen',
  wysiwygTableDeleteCol: 'Spalte l\u00f6schen',
  wysiwygTableDelete: 'Tabelle l\u00f6schen',
  historySelectMode: 'Ausw\u00e4hlen',
  historyCancelSelect: 'Abbrechen',
  historyDeleteSelected: 'Auswahl l\u00f6schen',
  historySelectAll: 'Alle ausw\u00e4hlen',
  historyDeselectAll: 'Auswahl aufheben',

  // ── History sidebar (additional) ──────────────────────────────────────────
  historyEnableHint: 'Verlauf in den Einstellungen aktivieren und mit der Bearbeitung beginnen.',
  historyNoMatch: 'Keine passenden Dokumente',
  historySelectModeAriaLabel: 'Massenauswahl-Modus aktivieren',

  // ── Settings modal (additional) ───────────────────────────────────────────
  settingsLanguageLabel: 'Sprache',
  settingsLanguageDescription:
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface \u00b7 Langue de l\u2019interface \u00b7 Sprache der Benutzeroberfl\u00e4che',
  closeSettings: 'Einstellungen schlie\u00dfen',
  settingsMaxEntriesDescription: 'Anzahl der letzten Dokumente, die im Verlauf gespeichert werden.',
  settingsAbout: '\u00dcber dieses Projekt',

  // ── Output panel / edit mode ──────────────────────────────────────────────
  switchToViewMode: 'Zum Anzeigemodus wechseln',
  switchToEditMode: 'Zum Bearbeitungsmodus wechseln',

  // ── Additional aria-labels & UI strings ───────────────────────────────────
  markdownPlaceholder: 'Markdown hier einf\u00fcgen\u2026',
  openSettings: 'Einstellungen \u00f6ffnen',
  searchHistory: 'Verlauf durchsuchen',
  clearSearch: 'Suche l\u00f6schen',
  renameEntryLabel: 'Eintrag umbenennen',
  currentlyLoaded: 'Aktuell geladen',
  saveToHistory: 'Dokument im Verlauf speichern',
  importHistory: 'Verlauf importieren',
  exportHistory: 'Verlauf exportieren',

  // ── File import validation & toast ─────────────────────────────────────────
  importUnsupportedType:
    'Nicht unterst\u00fctzter Dateityp. Bitte verwende eine .md, .txt oder .text-Datei.',
  importFileTooLarge: 'Datei zu gro\u00df. Maximale Gr\u00f6\u00dfe ist 1 MB.',
  importReadError:
    'Datei konnte nicht gelesen werden. Sie ist m\u00f6glicherweise besch\u00e4digt oder nicht zug\u00e4nglich.',

  // ── Generic modal / notification labels ───────────────────────────────────
  dismissToast: 'Benachrichtigung schlie\u00dfen',
  close: 'Schlie\u00dfen',
  historySavedCount: 'gespeichert',
  historySavedCountOne: 'gespeichert',

  // ── Structural panel / region labels ──────────────────────────────────────
  switchPanel: 'Panel wechseln',
  mainContent: 'Hauptinhalt',
  jiraOutputPanel: 'Jira-Ausgabe',
  fileActions: 'Dateiaktionen',
  markdownInputEditor: 'Markdown-Editor',
  notificationsLabel: 'Benachrichtigungen',

  // ── Header external link labels ───────────────────────────────────────────
  supportProject: 'Projekt unterst\u00fctzen \u2014 Kauf mir einen Kaffee',
  starOnGitHub: 'Auf GitHub mit Stern markieren',
  viewOnGitHub: 'Projekt auf GitHub ansehen',

  // ── Interpolated history entry labels ─────────────────────────────────────
  selectEntryLabel: '"{title}" ausw\u00e4hlen',
  renameEntryAction: '"{title}" umbenennen',
  deleteEntryLabel: '"{title}" aus dem Verlauf l\u00f6schen',

  // ── Aria labels not previously translated ─────────────────────────────────
  markdownInputSection: 'Markdown-Eingabe',
  resizePanels: 'Panels vergr\u00f6\u00dfern/verkleinern',
  editActions: 'Bearbeitungsaktionen',
  findReplace: 'Suchen / Ersetzen',
  switchToLightMode: 'Zum hellen Modus wechseln',
  switchToDarkMode: 'Zum dunklen Modus wechseln',
  copyAndEditGroup: 'Kopieren und bearbeiten',
  textFormattingToolbar: 'Textformatierung',
  codeSnippetButton: 'Code-Snippet',
  renderingJiraPreview: 'Jira-Vorschau wird gerendert',
  jiraContentEditor: 'Jira-Inhaltseditor',
  wikiMarkupEditor: 'Wiki-Markup-Editor',
  wikiMarkupPreview: 'Wiki-Markup-Vorschau',
  confluenceMarkupEditor: 'Confluence Storage Format-Editor',
  viewModeGroup: 'Anzeigemodus',

  // ── WYSIWYG toolbar — formatting buttons ─────────────────────────────────
  wysiwygBold: 'Fett',
  wysiwygItalic: 'Kursiv',
  wysiwygUnderline: 'Unterstrichen',
  wysiwygStrikethrough: 'Durchgestrichen',
  wysiwygInlineCode: 'Inline-Code',
  wysiwygSubscript: 'Tiefgestellt',
  wysiwygSuperscript: 'Hochgestellt',
  wysiwygClearFormatting: 'Formatierung entfernen',

  // ── WYSIWYG toolbar — dropdown labels ────────────────────────────────────
  wysiwygTextStyles: 'Textstile',
  wysiwygMoreFormatting: 'Weitere Formatierung',
  wysiwygLists: 'Listen',
  wysiwygTextColor: 'Textfarbe',
  wysiwygEmoji: 'Emoji',
  wysiwygInsertElements: 'Elemente einf\u00fcgen',

  // ── WYSIWYG toolbar — text style items ───────────────────────────────────
  wysiwygNormalText: 'Normaler Text',
  wysiwygHeading1: '\u00dcberschrift 1',
  wysiwygHeading2: '\u00dcberschrift 2',
  wysiwygHeading3: '\u00dcberschrift 3',
  wysiwygHeading4: '\u00dcberschrift 4',
  wysiwygHeading5: '\u00dcberschrift 5',
  wysiwygHeading6: '\u00dcberschrift 6',

  // ── WYSIWYG toolbar — Insert menu items ──────────────────────────────────
  wysiwygActionItem: 'Aufgabe',
  wysiwygActionItemDesc: 'Aufgaben erstellen und zuweisen',
  wysiwygMention: 'Erw\u00e4hnung',
  wysiwygMentionDesc: '@Erw\u00e4hnung einf\u00fcgen \u2014 Cursor landet nach dem @-Symbol',
  wysiwygInsertTable: 'Tabelle',
  wysiwygInsertTableDesc: 'Eine Tabelle einf\u00fcgen',
  wysiwygInfoPanel: 'Info-Panel',
  wysiwygInfoPanelDesc: 'Informationen in einem farbigen Panel hervorheben',
  wysiwygQuote: 'Zitat',
  wysiwygQuoteDesc: 'Ein Zitat oder eine Referenz einf\u00fcgen',
  wysiwygDecision: 'Entscheidung',
  wysiwygDecisionDesc: 'Entscheidungen erfassen und nachverfolgen',
  wysiwygDivider: 'Trennlinie',
  wysiwygDividerDesc: 'Eine Trennlinie einf\u00fcgen',

  // ── WYSIWYG — lossy-format warning ───────────────────────────────────────
  lostInJira: 'In Jira verloren',
  lostInJiraTooltip:
    'Unterstreichungs- und Farbformatierung erscheinen nicht in der Jira-Wiki-Ausgabe',

  // ── Code view region labels ───────────────────────────────────────────────
  adfCodeLabel: 'ADF-JSON-Code',
  wikiCodeLabel: 'Wiki-Markup-Code',

  // ── Skip link ─────────────────────────────────────────────────────────────
  skipToMainContent: 'Zum Hauptinhalt springen',

  // ── Tooltip titles ────────────────────────────────────────────────────────
  newDocumentTitle: 'Neues Dokument (leert den Editor)',
  importHistoryTitle: 'Verlauf aus JSON importieren',
  exportHistoryTitle: 'Verlauf als JSON exportieren',

  // ── Character count ───────────────────────────────────────────────────────
  charsLabel: 'Zeichen',

  // ── Share modal ───────────────────────────────────────────────────────────
  shareDocumentTitle: 'Dokument teilen',
  shareDocumentDesc:
    'Teile diesen Link, damit andere dein konvertiertes Markdown-Dokument ansehen k\u00f6nnen.',
  copyLinkToShare: 'Link zum Teilen kopieren',

  // ── Keyboard shortcuts — shortcut labels ──────────────────────────────────
  scLabelBold: 'Fett',
  scLabelItalic: 'Kursiv',
  scLabelInsertLink: 'Link einf\u00fcgen',
  scLabelInlineCode: 'Inline-Code',
  scLabelStrikethrough: 'Durchgestrichen',
  scLabelCycleHeading: '\u00dcberschrift wechseln (h1 \u2192 h2 \u2192 h3 \u2192 keine)',
  scLabelToggleBulletList: 'Aufz\u00e4hlungsliste umschalten',
  scLabelToggleNumberedList: 'Nummerierte Liste umschalten',
  scLabelToggleBlockquote: 'Blockzitat umschalten',
  scLabelInsertCodeBlock:
    'Codeblock einf\u00fcgen \u26a0 kann mit DevTools in Chrome/Edge kollidieren',
  scLabelInsertBlankLine: 'Leerzeile darunter einf\u00fcgen',
  scLabelMoveLineUp: 'Zeile nach oben verschieben',
  scLabelMoveLineDown: 'Zeile nach unten verschieben',
  scLabelDuplicateLine: 'Zeile duplizieren',
  scLabelIndent: 'Einr\u00fccken (2 Leerzeichen)',
  scLabelDedent: 'Ausr\u00fccken (2 Leerzeichen entfernen)',
  scLabelAutoContinueList: 'Listenelement automatisch fortsetzen',
  scLabelSaveHistory: 'Im Verlauf speichern',
  scLabelSaveHistoryDisabled: 'Im Verlauf speichern (in Einstellungen aktivieren)',
  scLabelSwitchAdf: 'Zu Jira Cloud (ADF) wechseln',
  scLabelSwitchWiki: 'Zu Wiki Markup wechseln',
  scLabelToggleHistory: 'Dokumentverlauf ein-/ausblenden',
  scLabelNewDocument: 'Neues Dokument (zuerst im Verlauf speichern)',
  scLabelUnderline: 'Unterstrichen',
  scLabelUndo: 'R\u00fcckg\u00e4ngig',
  scLabelRedo: 'Wiederholen',
  scLabelOrderedList: 'Geordnete Liste',
  scLabelBulletList: 'Aufz\u00e4hlungsliste',
  scLabelBlockquote: 'Blockzitat',

  // ── Format menu — footnote ────────────────────────────────────────────────
  wysiwygSubSupNote:
    'Tief- und Hochstellung sind nur im Editor \u2014 sie werden als HTML-Tags im exportierten Markdown serialisiert.',
  renderError: 'Renderfehler',
  retriesRemaining: 'verbleibend',
  retriesRemainingOne: 'verbleibend',
  maxRetriesLabel: 'Maximale Wiederholungsversuche erreicht. Bitte lade die Seite neu.',
  buyMeACoffee: '\u2615 Kauf mir einen Kaffee',

  // ── Screen reader live region announcements ───────────────────────────────
  editModeEnabled: 'Bearbeitungsmodus aktiviert',
  copiedToClipboard: 'In die Zwischenablage kopiert',

  // ── Settings — Base URL ───────────────────────────────────────────────────
  settingsBaseUrlLabel: 'Basis-URL f\u00fcr relative Links',
  settingsBaseUrlDescription:
    'Wird relativen Links vorangestellt (z.B. /wiki/seite \u2192 https://unternehmen.atlassian.net/wiki/seite). Leer lassen, um Links unver\u00e4ndert zu behalten.',
  settingsBaseUrlPlaceholder: 'https://deine-instanz.atlassian.net',

  // ── Insert menu — additional panels ──────────────────────────────────────
  wysiwygNotePanel: 'Notiz-Panel',
  wysiwygNotePanelDesc: 'Eine Notiz oder einen Hinweis in blau hervorheben',
  wysiwygWarningPanel: 'Warnungs-Panel',
  wysiwygWarningPanelDesc: 'Eine Warnung oder einen Hinweis in gelb hervorheben',
  wysiwygSuccessPanel: 'Erfolgs-Panel',
  wysiwygSuccessPanelDesc: 'Einen Erfolg oder ein positives Ergebnis in gr\u00fcn hervorheben',

  // ── History diff ──────────────────────────────────────────────────────────
  historyDiff: 'Diff',
  historyDiffModalTitle: 'Mit aktuellem Dokument vergleichen',
  historyDiffNoChanges:
    'Keine Unterschiede \u2014 dieser Eintrag stimmt mit dem aktuellen Dokument \u00fcberein.',
  historyDiffLabelBefore: 'Dieser Eintrag',
  historyDiffLabelAfter: 'Aktuell',
  historyDiffTruncated: 'Diff auf {n} Zeilen je Seite begrenzt',
  // ── Wiki \u2192 Markdown sync ─────────────────────────────────────────────────
  wikiSyncToMarkdown: 'Zu Markdown synchronisieren',
  wikiSyncToMarkdownTitle:
    'Wiki Markup zur\u00fcck in Markdown konvertieren und den Editor-Inhalt ersetzen',
  wikiSyncApplied: 'Wiki Markup mit Markdown-Quelle synchronisiert',

  // ── Autosave indicator ────────────────────────────────────────────────────
  autoSavedJustNow: 'Gerade gespeichert',
  autoSavedMinutesAgo: 'Vor {n} Min. gespeichert',
  resizeValueText: '{left}% linkes Panel, {right}% rechtes Panel',
  historyDeleteSelectedConfirm: 'Löschen bestätigen?',
} as const
