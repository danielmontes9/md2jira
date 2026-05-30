import type { StringKey } from './en.js'

export const es: Record<StringKey, string> = {
  // ── App shell ───────────────────────────────────────────────────────────────
  appTitle: 'md2jira-previewer',
  appSubtitle: 'Markdown a Jira Wiki Markup y ADF',

  // ── System banners ──────────────────────────────────────────────────────────
  offlineBanner:
    'Sin conexi\u00f3n \u2014 la app funciona desde cach\u00e9. Las conversiones siguen funcionando.',
  updateAvailable: 'Hay una nueva versi\u00f3n disponible.',
  updateNow: 'Actualizar',

  // ── Error banners ────────────────────────────────────────────────────────────
  conversionError:
    'Error de conversi\u00f3n \u2014 revisa tu Markdown para detectar sintaxis no compatible.',
  adfRenderError: 'Error al renderizar la vista previa \u2014 no se pudo mostrar el ADF.',
  switchToWiki: 'Cambiar a Wiki Markup',
  retry: 'Reintentar',

  // ── Panel labels ─────────────────────────────────────────────────────────────
  markdownPanelLabel: 'Markdown',
  jiraOutputPanelLabel: 'Salida Jira',
  renderingPreview: 'Generando vista previa\u2026',

  // ── Editor toolbar ───────────────────────────────────────────────────────────
  newDocument: 'Nuevo',
  clearEditorPrompt: '\u00bfLimpiar editor?',
  clearEditorYes: 'S\u00ed',
  clearEditorNo: 'No',
  copyMarkdown: 'Copiar Markdown',
  copyMd: 'Copiar MD',
  importFile: 'Importar archivo Markdown',
  importAction: 'Importar',
  exportFile: 'Exportar archivo Markdown',
  exportAction: 'Exportar',
  shortcutsAction: 'Atajos',
  undoAction: 'Deshacer',
  redoAction: 'Rehacer',
  openSearch: 'Buscar',
  openShortcuts: 'Atajos de teclado',
  saveAction: 'Guardar',

  // ── Output panel ─────────────────────────────────────────────────────────────
  outputLabel: 'Salida',
  convertingLabel: 'Convirtiendo\u2026',
  copyRichText: 'Copiar como texto enriquecido para Jira Cloud',
  copyWikiMarkup: 'Copiar Wiki Markup al portapapeles',
  copyForJira: 'Copiar para Jira',
  copied: '\u00a1Copiado!',
  outputFormatGroup: 'Formato de salida',
  formatAdf: 'Jira Cloud',
  formatWiki: 'Wiki Markup',
  formatConfluence: 'Confluence',
  viewPreview: 'Vista previa',
  viewCode: 'C\u00f3digo',
  editToggle: 'Editar',
  viewToggle: 'Ver',
  adfCodeHint:
    'Se copia como texto enriquecido \u2014 pega directamente en comentarios de Jira Cloud',
  wikiCodeHint: 'Wiki Markup en bruto \u2014 copia y pega en Jira Server/Data Center',
  confluenceCodeHint:
    'Formato de almacenamiento de Confluence (XHTML) \u2014 importa v\u00eda API REST o pega en una p\u00e1gina de Confluence',
  copyConfluenceMarkup: 'Copiar formato de almacenamiento de Confluence al portapapeles',

  // ── History sidebar ──────────────────────────────────────────────────────────
  recentDocuments: 'Documentos recientes',
  closeHistory: 'Cerrar historial de documentos',
  noDocumentsYet: 'A\u00fan no hay documentos guardados.',
  searchPlaceholder: 'Buscar\u2026',
  clearAll: 'Limpiar todo',
  clearAllPrompt: '\u00bfLimpiar todo?',
  historyExport: 'Exportar',
  historyImport: 'Importar',
  historyImportSuccess: 'Historial importado',
  deleteEntry: 'Eliminar',
  renameEntry: 'Renombrar',
  confirmRename: 'Confirmar renombre',
  cancelRename: 'Cancelar renombre',
  dateToday: 'Hoy',
  dateYesterday: 'Ayer',
  dateThisWeek: 'Esta semana',
  dateOlder: 'M\u00e1s antiguo',

  // ── Settings modal ───────────────────────────────────────────────────────────
  settingsTitle: 'Configuraci\u00f3n',
  darkModeLabel: 'Modo oscuro',
  darkModeDescription: 'Cambiar entre apariencia clara y oscura.',
  historyLabel: 'Guardar historial de documentos',
  historyDescription:
    'Guarda autom\u00e1ticamente tus documentos recientes en localStorage. Acc\u00e9delos desde el panel lateral.',
  maxEntriesLabel: 'M\u00e1ximo de documentos guardados',

  // ── Shortcuts modal ──────────────────────────────────────────────────────────
  keyboardShortcutsTitle: 'Atajos de Teclado',

  // ── Toast messages ───────────────────────────────────────────────────────────
  importSuccess: 'Importado',
  exportSuccess: 'Exportado',
  clipboardFail: 'Error al copiar al portapapeles',
  adfWorkerStalled: 'Vista previa ADF detenida \u2014 usando renderizador alternativo.',
  colorWarning: 'El formato de color no es compatible con la salida de Jira y ser\u00e1 eliminado.',
  underlineWarning: 'El subrayado no es compatible con la salida de Jira y ser\u00e1 eliminado.',
  wikiEditDesyncWarning:
    'Las ediciones de Wiki Markup son independientes \u2014 los cambios no se sincronizar\u00e1n con el Markdown original.',
  confluenceEditDesyncWarning:
    'Las ediciones del formato de almacenamiento de Confluence son independientes \u2014 los cambios no se sincronizar\u00e1n con el Markdown original.',
  newDocumentSaved: 'Documento guardado en el historial.',

  // ── Grupos del modal de atajos ────────────────────────────────────────────
  scGroupFormatting: 'Formato',
  scGroupStructure: 'Estructura',
  scGroupLines: 'L\u00edneas',
  scGroupEditor: 'Editor',
  scGroupOutputFormat: 'Formato de salida',
  scGroupWysiwyg: 'Editor WYSIWYG (solo en modo edici\u00f3n)',
  closeShortcutsModal: 'Cerrar panel de atajos',

  // ── Modal de informaci\u00f3n ─────────────────────────────────────────────────
  infoSubtitle: 'Conversor Markdown \u2192 Jira de c\u00f3digo abierto',
  infoDescription:
    'md2jira convierte documentos Markdown en Jira Wiki Markup y Atlassian Document Format (ADF). Pega tu Markdown a la izquierda, obt\u00e9n contenido listo para Jira a la derecha \u2014 copia y pega directamente en cualquier issue, comentario o descripci\u00f3n de Jira Cloud.',
  infoPackages: 'Paquetes',
  infoLicense: 'Licencia MIT',
  infoViewOnGithub: 'Ver en GitHub \u2192',
  infoCoreDesc:
    'Motor de conversi\u00f3n en TypeScript puro. Sin dependencias del navegador \u2014 funciona en Node.js, navegadores y extensiones de VSCode.',
  infoCliDesc:
    'Herramienta de l\u00ednea de comandos para convertir archivos Markdown desde la terminal.',
  infoWebDesc:
    'Esta aplicaci\u00f3n web \u2014 conversor en vivo de dos paneles con React 18 + Vite.',

  // ── Encabezado ────────────────────────────────────────────────────────────
  shareLink: 'Compartir enlace',
  exportPdf: 'Exportar PDF',
  tooLarge: 'Demasiado grande',
  docTooLargeForUrl: 'Documento demasiado grande para compartir por URL',
  documentHistory: 'Historial de documentos',
  historyDisabledHint:
    'Historial de documentos (desactivado \u2014 act\u00edvalo en Configuraci\u00f3n)',
  shareOrExport: 'Compartir o exportar',
  noContentToShare: 'No hay contenido para compartir o exportar a\u00fan',

  // ── Barra de herramientas WYSIWYG ─────────────────────────────────────────
  wysiwygBulletList: 'Lista con vi\u00f1etas',
  wysiwygNumberedList: 'Lista numerada',
  wysiwygTaskList: 'Lista de tareas',
  wysiwygRemoveColor: 'Eliminar color',
  wysiwygColorNote:
    'El color es solo del editor y no aparecer\u00e1 en el Markdown exportado ni en el marcado de Jira.',
  wysiwygSearchEmojis: 'Buscar emojis',
  wysiwygEmojiPlaceholder:
    'Buscar por categor\u00eda (Frecuentes, Personas, Objetos, S\u00edmbolos\u2026)',
  wysiwygNoEmojis: 'No se encontraron emojis',
  wysiwygLoading: 'Cargando\u2026',
  wysiwygTableOptions: 'Opciones de tabla',
  wysiwygTableAddRowBelow: 'Añadir fila abajo',
  wysiwygTableAddRowAbove: 'Añadir fila arriba',
  wysiwygTableAddColRight: 'Añadir columna a la derecha',
  wysiwygTableAddColLeft: 'Añadir columna a la izquierda',
  wysiwygTableDeleteRow: 'Eliminar fila',
  wysiwygTableDeleteCol: 'Eliminar columna',
  wysiwygTableDelete: 'Eliminar tabla',
  historySelectMode: 'Seleccionar',
  historyCancelSelect: 'Cancelar',
  historyDeleteSelected: 'Eliminar seleccionados',
  historySelectAll: 'Seleccionar todo',
  historyDeselectAll: 'Deseleccionar todo',

  // ── Historial (adicional) ─────────────────────────────────────────────────
  historyEnableHint: 'Activa el historial en Configuraci\u00f3n y empieza a editar.',
  historyNoMatch: 'No hay documentos que coincidan con',
  historySelectModeAriaLabel: 'Entrar en modo de selecci\u00f3n m\u00faltiple',

  // ── Modal de configuraci\u00f3n (adicional) ──────────────────────────────────
  settingsLanguageLabel: 'Idioma',
  settingsLanguageDescription:
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface \u00b7 Langue de l\u2019interface',
  closeSettings: 'Cerrar configuraci\u00f3n',
  settingsMaxEntriesDescription: 'Cu\u00e1ntos documentos recientes conservar en el historial.',
  settingsAbout: 'Acerca de este proyecto',

  // ── Panel de salida / modo edici\u00f3n ─────────────────────────────────────
  switchToViewMode: 'Cambiar a modo visualizaci\u00f3n',
  switchToEditMode: 'Cambiar a modo edici\u00f3n',
  // -- Etiquetas ARIA adicionales y cadenas de UI --------------------------
  markdownPlaceholder: 'Pega tu Markdown aqu\u00ed\u2026',
  openSettings: 'Abrir configuraci\u00f3n',
  searchHistory: 'Buscar en el historial',
  clearSearch: 'Limpiar b\u00fasqueda',
  renameEntryLabel: 'Renombrar entrada',
  currentlyLoaded: 'Cargado actualmente',
  saveToHistory: 'Guardar documento en el historial',
  importHistory: 'Importar historial',
  exportHistory: 'Exportar historial',
  importUnsupportedType: 'Tipo de archivo no compatible. Use un archivo .md, .txt o .text.',
  importFileTooLarge: 'Archivo demasiado grande. Tama\u00f1o m\u00e1ximo permitido: 1 MB.',
  importReadError: 'No se pudo leer el archivo. Puede estar da\u00f1ado o inaccesible.',
  dismissToast: 'Cerrar notificaci\u00f3n',
  close: 'Cerrar',
  historySavedCount: 'guardados',
  historySavedCountOne: 'guardado',
  switchPanel: 'Cambiar panel',
  mainContent: 'Contenido principal',
  jiraOutputPanel: 'Salida de Jira',
  fileActions: 'Acciones de archivo',
  markdownInputEditor: 'Editor de Markdown',
  notificationsLabel: 'Notificaciones',
  supportProject: 'Apoya el proyecto \u2014 C\u00f3mprame un caf\u00e9',
  starOnGitHub: 'Dar estrella en GitHub',
  viewOnGitHub: 'Ver proyecto en GitHub',
  selectEntryLabel: 'Seleccionar "{title}"',
  renameEntryAction: 'Renombrar "{title}"',
  deleteEntryLabel: 'Eliminar "{title}" del historial',
  // ── Etiquetas aria no traducidas anteriormente ─────────────────────────────
  markdownInputSection: 'Entrada de Markdown',
  resizePanels: 'Ajustar paneles',
  editActions: 'Acciones de edici\u00f3n',
  findReplace: 'Buscar / Reemplazar',
  switchToLightMode: 'Cambiar a modo claro',
  switchToDarkMode: 'Cambiar a modo oscuro',
  copyAndEditGroup: 'Copiar y editar',
  textFormattingToolbar: 'Formato de texto',
  codeSnippetButton: 'Fragmento de c\u00f3digo',
  renderingJiraPreview: 'Renderizando vista previa de Jira',
  jiraContentEditor: 'Editor de contenido Jira',
  wikiMarkupEditor: 'Editor de Wiki Markup',
  wikiMarkupPreview: 'Vista previa de Wiki Markup',
  confluenceMarkupEditor: 'Editor del formato de almacenamiento de Confluence',
  viewModeGroup: 'Modo de vista',
  // ── WYSIWYG toolbar — botones de formato ─────────────────────────────────
  wysiwygBold: 'Negrita',
  wysiwygItalic: 'Cursiva',
  wysiwygUnderline: 'Subrayado',
  wysiwygStrikethrough: 'Tachado',
  wysiwygInlineCode: 'C\u00f3digo en l\u00ednea',
  wysiwygSubscript: 'Sub\u00edndice',
  wysiwygSuperscript: 'Super\u00edndice',
  wysiwygClearFormatting: 'Borrar formato',
  // ── WYSIWYG toolbar — etiquetas de men\u00fa ─────────────────────────────────
  wysiwygTextStyles: 'Estilos de texto',
  wysiwygMoreFormatting: 'M\u00e1s formato',
  wysiwygLists: 'Listas',
  wysiwygTextColor: 'Color de texto',
  wysiwygEmoji: 'Emoji',
  wysiwygInsertElements: 'Insertar elementos',
  // ── WYSIWYG toolbar — estilos de texto ────────────────────────────────────
  wysiwygNormalText: 'Texto normal',
  wysiwygHeading1: 'Encabezado 1',
  wysiwygHeading2: 'Encabezado 2',
  wysiwygHeading3: 'Encabezado 3',
  wysiwygHeading4: 'Encabezado 4',
  wysiwygHeading5: 'Encabezado 5',
  wysiwygHeading6: 'Encabezado 6',
  // ── WYSIWYG toolbar — elementos del men\u00fa Insertar ──────────────────────
  wysiwygActionItem: 'Elemento de acci\u00f3n',
  wysiwygActionItemDesc: 'Crear y asignar elementos de acci\u00f3n',
  wysiwygMention: 'Menci\u00f3n',
  wysiwygMentionDesc:
    'Insertar @menci\u00f3n \u2014 el cursor queda despu\u00e9s del s\u00edmbolo @',
  wysiwygInsertTable: 'Tabla',
  wysiwygInsertTableDesc: 'Insertar una tabla',
  wysiwygInfoPanel: 'Panel de informaci\u00f3n',
  wysiwygInfoPanelDesc: 'Resaltar informaci\u00f3n en un panel de color',
  wysiwygQuote: 'Cita',
  wysiwygQuoteDesc: 'Insertar una cita o referencia',
  wysiwygDecision: 'Decisi\u00f3n',
  wysiwygDecisionDesc: 'Capturar decisiones para hacerles seguimiento',
  wysiwygDivider: 'Divisor',
  wysiwygDividerDesc: 'Insertar una l\u00ednea divisoria',
  // ── WYSIWYG — aviso de formato perdido ────────────────────────────────────
  lostInJira: 'Perdido en Jira',
  lostInJiraTooltip: 'El formato de subrayado y color no aparecer\u00e1 en la salida de Jira Wiki',
  // ── Etiquetas de regi\u00f3n de vista c\u00f3digo ────────────────────────────────
  adfCodeLabel: 'C\u00f3digo ADF JSON',
  wikiCodeLabel: 'C\u00f3digo Wiki Markup',
  // ── Enlace de salto ───────────────────────────────────────────────────────
  skipToMainContent: 'Ir al contenido principal',
  // ── T\u00edtulos de tooltip ─────────────────────────────────────────────────
  newDocumentTitle: 'Nuevo documento (limpia el editor)',
  importHistoryTitle: 'Importar historial desde JSON',
  exportHistoryTitle: 'Exportar historial como JSON',
  // ── Contador de caracteres ────────────────────────────────────────────────
  charsLabel: 'car.',
  // ── Modal de compartir ───────────────────────────────────────────────────
  shareDocumentTitle: 'Compartir documento',
  shareDocumentDesc:
    'Comparte este enlace para que otros puedan ver tu documento Markdown convertido.',
  copyLinkToShare: 'Copiar enlace para compartir',
  // ── Atajos de teclado — etiquetas de acciones ─────────────────────────────
  scLabelBold: 'Negrita',
  scLabelItalic: 'Cursiva',
  scLabelInsertLink: 'Insertar enlace',
  scLabelInlineCode: 'C\u00f3digo en l\u00ednea',
  scLabelStrikethrough: 'Tachado',
  scLabelCycleHeading: 'Rotar encabezado (h1 \u2192 h2 \u2192 h3 \u2192 ninguno)',
  scLabelToggleBulletList: 'Alternar lista con vi\u00f1etas',
  scLabelToggleNumberedList: 'Alternar lista numerada',
  scLabelToggleBlockquote: 'Alternar cita en bloque',
  scLabelInsertCodeBlock:
    'Insertar bloque de c\u00f3digo \u26a0 puede entrar en conflicto con DevTools en Chrome/Edge',
  scLabelInsertBlankLine: 'Insertar l\u00ednea en blanco abajo',
  scLabelMoveLineUp: 'Mover l\u00ednea arriba',
  scLabelMoveLineDown: 'Mover l\u00ednea abajo',
  scLabelDuplicateLine: 'Duplicar l\u00ednea',
  scLabelIndent: 'Sangr\u00eda (2 espacios)',
  scLabelDedent: 'Quitar sangr\u00eda (2 espacios)',
  scLabelAutoContinueList: 'Continuar elemento de lista autom\u00e1ticamente',
  scLabelSaveHistory: 'Guardar en el historial',
  scLabelSaveHistoryDisabled: 'Guardar en el historial (activar en Configuraci\u00f3n)',
  scLabelSwitchAdf: 'Cambiar a Jira Cloud (ADF)',
  scLabelSwitchWiki: 'Cambiar a Wiki Markup',
  scLabelToggleHistory: 'Mostrar/ocultar historial de documentos',
  scLabelNewDocument: 'Nuevo documento (guarda primero en el historial)',
  scLabelUnderline: 'Subrayado',
  scLabelUndo: 'Deshacer',
  scLabelRedo: 'Rehacer',
  scLabelOrderedList: 'Lista ordenada',
  scLabelBulletList: 'Lista con vi\u00f1etas',
  scLabelBlockquote: 'Cita en bloque',
  // ── Men\u00fa de formato \u2014 nota al pie ────────────────────────────────────────
  wysiwygSubSupNote:
    'El sub\u00edndice y el super\u00edndice son solo del editor \u2014 se serializan como etiquetas HTML en el Markdown exportado.',
  renderError: 'Error de renderizado',
  retriesRemaining: 'restantes',
  retriesRemainingOne: 'restante',
  maxRetriesLabel:
    'Se alcanz\u00f3 el m\u00e1ximo de reintentos. Por favor, recarga la p\u00e1gina.',
  buyMeACoffee: '\u2615 Inv\u00edtame a un caf\u00e9',
  // ── Anuncios de regi\u00f3n aria-live ─────────────────────────────────────────
  editModeEnabled: 'Modo de edici\u00f3n activado',
  copiedToClipboard: 'Copiado al portapapeles', // ── Configuración — URL base ──────────────────────────────────────────────
  settingsBaseUrlLabel: 'URL base para enlaces relativos',
  settingsBaseUrlDescription:
    'Se antepone a los enlaces relativos (ej. /wiki/página → https://empresa.atlassian.net/wiki/página). Dejar vacío para mantener los enlaces sin cambios.',
  settingsBaseUrlPlaceholder: 'https://tu-instancia.atlassian.net',
  // ── Menú de inserción — paneles adicionales ──────────────────────────────
  wysiwygNotePanel: 'Panel de nota',
  wysiwygNotePanelDesc: 'Destacar una nota o consejo en azul',
  wysiwygWarningPanel: 'Panel de advertencia',
  wysiwygWarningPanelDesc: 'Destacar una advertencia o precaución en amarillo',
  wysiwygSuccessPanel: 'Panel de éxito',
  wysiwygSuccessPanelDesc: 'Destacar un éxito o resultado positivo en verde',
  // ── Diferencia de historial ────────────────────────────────────────────────
  historyDiff: 'Diff',
  historyDiffModalTitle: 'Comparar con el documento actual',
  historyDiffNoChanges: 'Sin diferencias — esta entrada coincide con el documento actual.',
  historyDiffLabelBefore: 'Esta entrada',
  historyDiffLabelAfter: 'Actual',
  historyDiffTruncated: 'Diff truncado a {n} líneas por lado',
  // ── Wiki → Markdown — sincronización ──────────────────────────────────────
  wikiSyncToMarkdown: 'Sincronizar a Markdown',
  wikiSyncToMarkdownTitle:
    'Convierte el Wiki Markup de vuelta a Markdown y reemplaza el contenido del editor',
  wikiSyncApplied: 'Wiki Markup sincronizado con el origen Markdown',
  // ── Indicador de autoguardado ─────────────────────────────────────────────
  autoSavedJustNow: 'Guardado ahora mismo',
  autoSavedMinutesAgo: 'Guardado hace {n} min',
  resizeValueText: '{left}% panel izquierdo, {right}% panel derecho',
  historyDeleteSelectedConfirm: '¿Confirmar eliminación?',
} as const
