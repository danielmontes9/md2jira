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
  viewPreview: 'Vista previa',
  viewCode: 'C\u00f3digo',
  editToggle: 'Editar',
  viewToggle: 'Ver',
  adfCodeHint:
    'Se copia como texto enriquecido \u2014 pega directamente en comentarios de Jira Cloud',
  wikiCodeHint: 'Wiki Markup en bruto \u2014 copia y pega en Jira Server/Data Center',

  // ── History sidebar ──────────────────────────────────────────────────────────
  recentDocuments: 'Documentos recientes',
  closeHistory: 'Cerrar historial de documentos',
  noDocumentsYet: 'A\u00fan no hay documentos guardados.',
  searchPlaceholder: 'Buscar\u2026',
  clearAll: 'Limpiar todo',
  clearAllPrompt: '\u00bfLimpiar todo?',
  historyExport: 'Exportar',
  historyImport: 'Importar',
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
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface',
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
} as const
