import type { StringKey } from './en.js'

export const fr: Record<StringKey, string> = {
  // ── App shell ─────────────────────────────────────────────────────────────
  appTitle: 'md2jira-previewer',
  appSubtitle: 'Markdown vers Jira Wiki Markup et ADF',
  // ── System banners ────────────────────────────────────────────────────────
  offlineBanner:
    'Vous \u00eates hors ligne \u2014 l\u2019app fonctionne depuis le cache. Les conversions continuent de fonctionner.',
  updateAvailable: 'Une nouvelle version est disponible.',
  updateNow: 'Mettre \u00e0 jour',
  // ── Error banners ─────────────────────────────────────────────────────────
  conversionError:
    'Erreur de conversion \u2014 v\u00e9rifiez votre Markdown pour une syntaxe non prise en charge.',
  adfRenderError:
    'L\u2019aper\u00e7u a \u00e9chou\u00e9 \u2014 le document ADF n\u2019a pas pu \u00eatre affich\u00e9.',
  switchToWiki: 'Passer au Wiki Markup',
  retry: 'R\u00e9essayer',
  // ── Panel labels ──────────────────────────────────────────────────────────
  markdownPanelLabel: 'Markdown',
  jiraOutputPanelLabel: 'Sortie Jira',
  renderingPreview: 'G\u00e9n\u00e9ration de l\u2019aper\u00e7u\u2026',
  // ── Editor toolbar ────────────────────────────────────────────────────────
  newDocument: 'Nouveau',
  clearEditorPrompt: 'Vider l\u2019\u00e9diteur\u00a0?',
  clearEditorYes: 'Oui',
  clearEditorNo: 'Non',
  copyMarkdown: 'Copier le Markdown',
  copyMd: 'Copier MD',
  importFile: 'Importer un fichier Markdown',
  importAction: 'Importer',
  exportFile: 'Exporter le fichier Markdown',
  exportAction: 'Exporter',
  shortcutsAction: 'Raccourcis',
  undoAction: 'Annuler',
  redoAction: 'R\u00e9tablir',
  openSearch: 'Rechercher',
  openShortcuts: 'Raccourcis clavier',
  saveAction: 'Enregistrer',
  // ── Output panel ──────────────────────────────────────────────────────────
  outputLabel: 'Sortie',
  convertingLabel: 'Conversion\u2026',
  copyRichText: 'Copier en texte enrichi pour Jira Cloud',
  copyWikiMarkup: 'Copier le Wiki Markup dans le presse-papiers',
  copyForJira: 'Copier pour Jira',
  copied: 'Copi\u00e9\u00a0!',
  outputFormatGroup: 'Format de sortie',
  formatAdf: 'Jira Cloud',
  formatWiki: 'Wiki Markup',
  viewPreview: 'Aper\u00e7u',
  viewCode: 'Code',
  editToggle: 'Modifier',
  viewToggle: 'Afficher',
  adfCodeHint: 'Copie en texte enrichi \u2014 collez directement dans les commentaires Jira Cloud',
  wikiCodeHint: 'Wiki Markup brut \u2014 copiez et collez dans Jira Server/Data Center',
  // ── History sidebar ───────────────────────────────────────────────────────
  recentDocuments: 'Documents r\u00e9cents',
  closeHistory: 'Fermer l\u2019historique des documents',
  noDocumentsYet: 'Aucun document enregistr\u00e9.',
  searchPlaceholder: 'Rechercher\u2026',
  clearAll: 'Tout effacer',
  clearAllPrompt: 'Tout effacer\u00a0?',
  historyExport: 'Exporter',
  historyImport: 'Importer',
  deleteEntry: 'Supprimer',
  renameEntry: 'Renommer',
  confirmRename: 'Confirmer le renommage',
  cancelRename: 'Annuler le renommage',
  dateToday: 'Aujourd\u2019hui',
  dateYesterday: 'Hier',
  dateThisWeek: 'Cette semaine',
  dateOlder: 'Plus ancien',
  // ── Settings modal ────────────────────────────────────────────────────────
  settingsTitle: 'Param\u00e8tres',
  darkModeLabel: 'Mode sombre',
  darkModeDescription: 'Basculer entre l\u2019apparence claire et sombre.',
  historyLabel: 'Sauvegarder l\u2019historique des documents',
  historyDescription:
    'Enregistre automatiquement vos documents r\u00e9cents dans localStorage. Consultez-les dans le panneau lat\u00e9ral de l\u2019historique.',
  maxEntriesLabel: 'Documents enregistr\u00e9s maximum',
  // ── Shortcuts modal ───────────────────────────────────────────────────────
  keyboardShortcutsTitle: 'Raccourcis clavier',
  // ── Toast messages ────────────────────────────────────────────────────────
  importSuccess: 'Import\u00e9',
  exportSuccess: 'Export\u00e9',
  clipboardFail: 'Impossible de copier dans le presse-papiers',
  adfWorkerStalled:
    'L\u2019aper\u00e7u ADF est bloqu\u00e9 \u2014 utilisation du rendu de secours.',
  colorWarning:
    'La mise en forme des couleurs n\u2019est pas prise en charge dans la sortie Jira et sera supprim\u00e9e.',
  underlineWarning:
    'La mise en forme du soulignement n\u2019est pas prise en charge dans la sortie Jira et sera supprim\u00e9e.',
  wikiEditDesyncWarning:
    'Les \u00e9ditions Wiki Markup sont ind\u00e9pendantes \u2014 les modifications ne seront pas synchronis\u00e9es avec la source Markdown.',
  newDocumentSaved: 'Document enregistr\u00e9 dans l\u2019historique.',
  // ── Shortcuts modal groups ────────────────────────────────────────────────
  scGroupFormatting: 'Mise en forme',
  scGroupStructure: 'Structure',
  scGroupLines: 'Lignes',
  scGroupEditor: '\u00c9diteur',
  scGroupOutputFormat: 'Format de sortie',
  scGroupWysiwyg: '\u00c9diteur WYSIWYG (mode Modifier uniquement)',
  closeShortcutsModal: 'Fermer le panneau des raccourcis',
  // ── Info modal ────────────────────────────────────────────────────────────
  infoSubtitle: 'Convertisseur Markdown \u2192 Jira open-source',
  infoDescription:
    'md2jira convertit des documents Markdown en Wiki Markup Jira et en Format de Document Atlassian (ADF). Collez votre Markdown \u00e0 gauche, obtenez le contenu pr\u00eat pour Jira \u00e0 droite \u2014 copiez et collez directement dans n\u2019importe quel ticket, commentaire ou description Jira Cloud.',
  infoPackages: 'Packages',
  infoLicense: 'Licence MIT',
  infoViewOnGithub: 'Voir sur GitHub \u2192',
  infoCoreDesc:
    'Moteur de conversion TypeScript pur. Z\u00e9ro d\u00e9pendance navigateur \u2014 fonctionne dans Node.js, les navigateurs et les extensions VSCode.',
  infoCliDesc:
    'Outil en ligne de commande pour convertir des fichiers Markdown depuis votre terminal.',
  infoWebDesc:
    'Cette application web \u2014 convertisseur live en deux panneaux construit avec React 18 + Vite.',
  // ── Header ────────────────────────────────────────────────────────────────
  shareLink: 'Partager le lien',
  exportPdf: 'Exporter en PDF',
  tooLarge: 'Trop volumineux',
  docTooLargeForUrl: 'Document trop volumineux pour le partage par URL',
  documentHistory: 'Historique des documents',
  historyDisabledHint:
    'Historique des documents (d\u00e9sactiv\u00e9 \u2014 activer dans les Param\u00e8tres)',
  shareOrExport: 'Partager ou exporter',
  noContentToShare: 'Aucun contenu \u00e0 partager ou exporter pour l\u2019instant',
  // ── WYSIWYG toolbar ───────────────────────────────────────────────────────
  wysiwygBulletList: 'Liste \u00e0 puces',
  wysiwygNumberedList: 'Liste num\u00e9rot\u00e9e',
  wysiwygTaskList: 'Liste de t\u00e2ches',
  wysiwygRemoveColor: 'Supprimer la couleur',
  wysiwygColorNote:
    'La couleur est r\u00e9serv\u00e9e \u00e0 l\u2019\u00e9diteur et n\u2019appara\u00eetra pas dans le Markdown export\u00e9 ou le balisage Jira.',
  wysiwygSearchEmojis: 'Rechercher des emojis',
  wysiwygEmojiPlaceholder:
    'Rechercher par cat\u00e9gorie (Fr\u00e9quents, Personnes, Objets, Symboles\u2026)',
  wysiwygNoEmojis: 'Aucun emoji trouv\u00e9',
  wysiwygLoading: 'Chargement\u2026',
  wysiwygTableOptions: 'Options du tableau',
  wysiwygTableAddRowBelow: 'Ajouter une ligne en dessous',
  wysiwygTableAddRowAbove: 'Ajouter une ligne au-dessus',
  wysiwygTableAddColRight: 'Ajouter une colonne \u00e0 droite',
  wysiwygTableAddColLeft: 'Ajouter une colonne \u00e0 gauche',
  wysiwygTableDeleteRow: 'Supprimer la ligne',
  wysiwygTableDeleteCol: 'Supprimer la colonne',
  wysiwygTableDelete: 'Supprimer le tableau',
  historySelectMode: 'S\u00e9lectionner',
  historyCancelSelect: 'Annuler',
  historyDeleteSelected: 'Supprimer la s\u00e9lection',
  historySelectAll: 'Tout s\u00e9lectionner',
  historyDeselectAll: 'Tout d\u00e9s\u00e9lectionner',
  // ── History sidebar (additional) ──────────────────────────────────────────
  historyEnableHint:
    'Activez l\u2019historique dans les Param\u00e8tres et commencez \u00e0 \u00e9diter.',
  historyNoMatch: 'Aucun document correspondant',
  historySelectModeAriaLabel: 'Activer le mode de s\u00e9lection en masse',
  // ── Settings modal (additional) ───────────────────────────────────────────
  settingsLanguageLabel: 'Langue',
  settingsLanguageDescription:
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface \u00b7 Langue de l\u2019interface',
  closeSettings: 'Fermer les param\u00e8tres',
  settingsMaxEntriesDescription:
    'Nombre de documents r\u00e9cents \u00e0 conserver dans l\u2019historique.',
  settingsAbout: '\u00c0 propos de ce projet',
  // ── Output panel / edit mode ──────────────────────────────────────────────
  switchToViewMode: 'Passer en mode affichage',
  switchToEditMode: 'Passer en mode modification',
  // ── Additional aria-labels & UI strings ───────────────────────────────────
  markdownPlaceholder: 'Collez votre Markdown ici\u2026',
  openSettings: 'Ouvrir les param\u00e8tres',
  searchHistory: 'Rechercher dans l\u2019historique',
  clearSearch: 'Effacer la recherche',
  renameEntryLabel: 'Renommer l\u2019entr\u00e9e',
  currentlyLoaded: 'Actuellement charg\u00e9',
  saveToHistory: 'Enregistrer le document dans l\u2019historique',
  importHistory: 'Importer l\u2019historique',
  exportHistory: 'Exporter l\u2019historique',
  // ── File import validation & toast ─────────────────────────────────────────
  importUnsupportedType:
    'Type de fichier non pris en charge. Utilisez un fichier .md, .txt ou .text.',
  importFileTooLarge: 'Fichier trop volumineux. Taille maximale autoris\u00e9e : 1 Mo.',
  importReadError: 'Impossible de lire le fichier. Il est peut-\u00eatre corrompu ou inaccessible.',
  // ── Generic modal / notification labels ───────────────────────────────────
  dismissToast: 'Fermer la notification',
  close: 'Fermer',
  historySavedCount: 'enregistr\u00e9s',
  historySavedCountOne: 'enregistr\u00e9',
  // ── Structural panel / region labels ──────────────────────────────────────
  switchPanel: 'Changer de panneau',
  mainContent: 'Contenu principal',
  jiraOutputPanel: 'Sortie Jira',
  fileActions: 'Actions sur les fichiers',
  markdownInputEditor: '\u00c9diteur Markdown',
  notificationsLabel: 'Notifications',
  // ── Header external link labels ───────────────────────────────────────────
  supportProject: 'Soutenir le projet \u2014 Offrez-moi un caf\u00e9',
  starOnGitHub: 'Mettre une \u00e9toile sur GitHub',
  viewOnGitHub: 'Voir le projet sur GitHub',
  // ── Interpolated history entry labels ─────────────────────────────────────
  selectEntryLabel: 'S\u00e9lectionner "{title}"',
  renameEntryAction: 'Renommer "{title}"',
  deleteEntryLabel: 'Supprimer "{title}" de l\u2019historique',
  // ── Étiquettes aria non traduites précédemment ─────────────────────────────
  markdownInputSection: 'Saisie Markdown',
  resizePanels: 'Redimensionner les panneaux',
  editActions: 'Actions d\u2019\u00e9dition',
  findReplace: 'Chercher / Remplacer',
  switchToLightMode: 'Passer en mode clair',
  switchToDarkMode: 'Passer en mode sombre',
  copyAndEditGroup: 'Copier et modifier',
  textFormattingToolbar: 'Mise en forme du texte',
  codeSnippetButton: 'Extrait de code',
  renderingJiraPreview: 'Affichage de la pr\u00e9visualisation Jira',
  jiraContentEditor: '\u00c9diteur de contenu Jira',
  wikiMarkupEditor: '\u00c9diteur Wiki Markup',
  wikiMarkupPreview: 'Pr\u00e9visualisation Wiki Markup',
  viewModeGroup: 'Mode d\u2019affichage',
  // ── WYSIWYG toolbar — boutons de mise en forme ────────────────────────────
  wysiwygBold: 'Gras',
  wysiwygItalic: 'Italique',
  wysiwygUnderline: 'Soulign\u00e9',
  wysiwygStrikethrough: 'Barr\u00e9',
  wysiwygInlineCode: 'Code en ligne',
  wysiwygSubscript: 'Indice',
  wysiwygSuperscript: 'Exposant',
  wysiwygClearFormatting: 'Effacer la mise en forme',
  // ── WYSIWYG toolbar — \u00e9tiquettes de menu ───────────────────────────────────
  wysiwygTextStyles: 'Styles de texte',
  wysiwygMoreFormatting: 'Plus de mise en forme',
  wysiwygLists: 'Listes',
  wysiwygTextColor: 'Couleur du texte',
  wysiwygEmoji: 'Emoji',
  wysiwygInsertElements: 'Ins\u00e9rer des \u00e9l\u00e9ments',
  // ── WYSIWYG toolbar — styles de texte ────────────────────────────────────
  wysiwygNormalText: 'Texte normal',
  wysiwygHeading1: 'Titre 1',
  wysiwygHeading2: 'Titre 2',
  wysiwygHeading3: 'Titre 3',
  wysiwygHeading4: 'Titre 4',
  wysiwygHeading5: 'Titre 5',
  wysiwygHeading6: 'Titre 6',
  // ── WYSIWYG toolbar — \u00e9l\u00e9ments du menu Ins\u00e9rer ──────────────────────────
  wysiwygActionItem: '\u00c9l\u00e9ment d\u2019action',
  wysiwygActionItemDesc: 'Cr\u00e9er et attribuer des \u00e9l\u00e9ments d\u2019action',
  wysiwygMention: 'Mention',
  wysiwygMentionDesc:
    'Ins\u00e9rer une @mention \u2014 le curseur se place apr\u00e8s le symbole @',
  wysiwygInsertTable: 'Tableau',
  wysiwygInsertTableDesc: 'Ins\u00e9rer un tableau',
  wysiwygInfoPanel: 'Panneau d\u2019information',
  wysiwygInfoPanelDesc: 'Mettre en \u00e9vidence des informations dans un panneau color\u00e9',
  wysiwygQuote: 'Citation',
  wysiwygQuoteDesc: 'Ins\u00e9rer une citation ou une r\u00e9f\u00e9rence',
  wysiwygDecision: 'D\u00e9cision',
  wysiwygDecisionDesc: 'Enregistrer des d\u00e9cisions pour les suivre',
  wysiwygDivider: 'S\u00e9parateur',
  wysiwygDividerDesc: 'Ins\u00e9rer une ligne de s\u00e9paration',
  // ── WYSIWYG — avertissement de format perdu ───────────────────────────────
  lostInJira: 'Perdu dans Jira',
  lostInJiraTooltip:
    'La mise en forme soulign\u00e9e et couleur n\u2019appara\u00eetront pas dans la sortie Jira Wiki',
  // ── \u00c9tiquettes de r\u00e9gion vue code ────────────────────────────────────────
  adfCodeLabel: 'Code ADF JSON',
  wikiCodeLabel: 'Code Wiki Markup',
  // ── Lien d\u2019acc\u00e8s rapide ───────────────────────────────────────────────
  skipToMainContent: 'Passer au contenu principal',
  // ── Titres de tooltip ─────────────────────────────────────────────────────
  newDocumentTitle: 'Nouveau document (efface l\u2019\u00e9diteur)',
  importHistoryTitle: 'Importer l\u2019historique depuis JSON',
  exportHistoryTitle: 'Exporter l\u2019historique en JSON',
  // ── Compteur de caract\u00e8res ───────────────────────────────────────────────
  charsLabel: 'car.',
  // ── Modal de partage ─────────────────────────────────────────────────────
  shareDocumentTitle: 'Partager le document',
  shareDocumentDesc:
    'Partagez ce lien pour que d\u2019autres puissent consulter votre document Markdown converti.',
  copyLinkToShare: 'Copier le lien \u00e0 partager',
  // ── Raccourcis clavier \u2014 \u00e9tiquettes d\u2019actions ──────────────────────────────────
  scLabelBold: 'Gras',
  scLabelItalic: 'Italique',
  scLabelInsertLink: 'Ins\u00e9rer un lien',
  scLabelInlineCode: 'Code en ligne',
  scLabelStrikethrough: 'Barr\u00e9',
  scLabelCycleHeading: 'Faire d\u00e9filer les titres (h1 \u2192 h2 \u2192 h3 \u2192 aucun)',
  scLabelToggleBulletList: 'Activer/d\u00e9sactiver la liste \u00e0 puces',
  scLabelToggleNumberedList: 'Activer/d\u00e9sactiver la liste num\u00e9rot\u00e9e',
  scLabelToggleBlockquote: 'Activer/d\u00e9sactiver le bloc de citation',
  scLabelInsertCodeBlock:
    'Ins\u00e9rer un bloc de code \u26a0 peut entrer en conflit avec les DevTools sur Chrome/Edge',
  scLabelInsertBlankLine: 'Ins\u00e9rer une ligne vide en dessous',
  scLabelMoveLineUp: 'D\u00e9placer la ligne vers le haut',
  scLabelMoveLineDown: 'D\u00e9placer la ligne vers le bas',
  scLabelDuplicateLine: 'Dupliquer la ligne',
  scLabelIndent: 'Indenter (2 espaces)',
  scLabelDedent: 'D\u00e9sindenter (retirer 2 espaces)',
  scLabelAutoContinueList: 'Continuer l\u2019\u00e9l\u00e9ment de liste automatiquement',
  scLabelSaveHistory: 'Enregistrer dans l\u2019historique',
  scLabelSaveHistoryDisabled:
    'Enregistrer dans l\u2019historique (activer dans les Param\u00e8tres)',
  scLabelSwitchAdf: 'Passer \u00e0 Jira Cloud (ADF)',
  scLabelSwitchWiki: 'Passer \u00e0 Wiki Markup',
  scLabelToggleHistory: 'Afficher/masquer l\u2019historique des documents',
  scLabelNewDocument: 'Nouveau document (enregistre d\u2019abord dans l\u2019historique)',
  scLabelUnderline: 'Soulign\u00e9',
  scLabelUndo: 'Annuler',
  scLabelRedo: 'R\u00e9tablir',
  scLabelOrderedList: 'Liste ordonn\u00e9e',
  scLabelBulletList: 'Liste \u00e0 puces',
  scLabelBlockquote: 'Bloc de citation',
  // ── Menu format \u2014 note de bas de menu ──────────────────────────────────────
  wysiwygSubSupNote:
    'L\u2019indice et l\u2019exposant ne sont que dans l\u2019\u00e9diteur \u2014 ils se s\u00e9rialisent en balises HTML dans le Markdown export\u00e9.',
  renderError: 'Erreur de rendu',
  retriesRemaining: 'restants',
  retriesRemainingOne: 'restant',
  maxRetriesLabel: 'Nombre maximal de tentatives atteint. Veuillez recharger la page.',
  buyMeACoffee: '\u2615 Offrez-moi un caf\u00e9',
  // ── Annonces de r\u00e9gion aria-live ──────────────────────────────────────────
  editModeEnabled: 'Mode d\u2019\u00e9dition activ\u00e9',
  copiedToClipboard: 'Copi\u00e9 dans le presse-papiers',
} as const
