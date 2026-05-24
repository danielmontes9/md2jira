import type { StringKey } from './en.js'

export const pt: Record<StringKey, string> = {
  // ── App shell ─────────────────────────────────────────────────────────────
  appTitle: 'md2jira-previewer',
  appSubtitle: 'Markdown para Jira Wiki Markup e ADF',

  // ── System banners ────────────────────────────────────────────────────────
  offlineBanner:
    'Voc\u00ea est\u00e1 offline \u2014 o app est\u00e1 usando cache. As convers\u00f5es ainda funcionam.',
  updateAvailable: 'Uma nova vers\u00e3o est\u00e1 dispon\u00edvel.',
  updateNow: 'Atualizar',

  // ── Error banners ─────────────────────────────────────────────────────────
  conversionError:
    'Erro de convers\u00e3o \u2014 verifique seu Markdown para detectar sintaxe n\u00e3o suportada.',
  adfRenderError:
    'Falha na renderiza\u00e7\u00e3o \u2014 o documento ADF n\u00e3o p\u00f4de ser exibido.',
  switchToWiki: 'Usar Wiki Markup',
  retry: 'Tentar novamente',

  // ── Panel labels ──────────────────────────────────────────────────────────
  markdownPanelLabel: 'Markdown',
  jiraOutputPanelLabel: 'Sa\u00edda Jira',
  renderingPreview: 'Gerando visualiza\u00e7\u00e3o\u2026',

  // ── Editor toolbar ────────────────────────────────────────────────────────
  newDocument: 'Novo',
  clearEditorPrompt: 'Limpar editor?',
  clearEditorYes: 'Sim',
  clearEditorNo: 'N\u00e3o',
  copyMarkdown: 'Copiar Markdown',
  copyMd: 'Copiar MD',
  importFile: 'Importar arquivo Markdown',
  importAction: 'Importar',
  exportFile: 'Exportar arquivo Markdown',
  exportAction: 'Exportar',
  shortcutsAction: 'Atalhos',
  undoAction: 'Desfazer',
  redoAction: 'Refazer',
  openSearch: 'Pesquisar',
  openShortcuts: 'Atalhos de teclado',
  saveAction: 'Salvar',

  // ── Output panel ──────────────────────────────────────────────────────────
  outputLabel: 'Sa\u00edda',
  convertingLabel: 'Convertendo\u2026',
  copyRichText: 'Copiar como texto rico para Jira Cloud',
  copyWikiMarkup: 'Copiar Wiki Markup para a \u00e1rea de transfer\u00eancia',
  copyForJira: 'Copiar para Jira',
  copied: 'Copiado!',
  outputFormatGroup: 'Formato de sa\u00edda',
  formatAdf: 'Jira Cloud',
  formatWiki: 'Wiki Markup',
  viewPreview: 'Pr\u00e9-visualiza\u00e7\u00e3o',
  viewCode: 'C\u00f3digo',
  editToggle: 'Editar',
  viewToggle: 'Ver',
  adfCodeHint: 'Copiado como texto rico \u2014 cole diretamente nos coment\u00e1rios do Jira Cloud',
  wikiCodeHint: 'Wiki Markup bruto \u2014 copie e cole no Jira Server/Data Center',

  // ── History sidebar ───────────────────────────────────────────────────────
  recentDocuments: 'Documentos recentes',
  closeHistory: 'Fechar hist\u00f3rico de documentos',
  noDocumentsYet: 'Nenhum documento salvo ainda.',
  searchPlaceholder: 'Pesquisar\u2026',
  clearAll: 'Limpar tudo',
  clearAllPrompt: 'Limpar tudo?',
  historyExport: 'Exportar',
  historyImport: 'Importar',
  deleteEntry: 'Excluir',
  renameEntry: 'Renomear',
  confirmRename: 'Confirmar renomea\u00e7\u00e3o',
  cancelRename: 'Cancelar renomea\u00e7\u00e3o',
  dateToday: 'Hoje',
  dateYesterday: 'Ontem',
  dateThisWeek: 'Esta semana',
  dateOlder: 'Mais antigo',

  // ── Settings modal ────────────────────────────────────────────────────────
  settingsTitle: 'Configura\u00e7\u00f5es',
  darkModeLabel: 'Modo escuro',
  darkModeDescription: 'Alternar entre apar\u00eancia clara e escura.',
  historyLabel: 'Salvar hist\u00f3rico de documentos',
  historyDescription:
    'Salva automaticamente seus documentos recentes no localStorage. Acesse-os na barra lateral de hist\u00f3rico.',
  maxEntriesLabel: 'M\u00e1ximo de documentos salvos',

  // ── Shortcuts modal ───────────────────────────────────────────────────────
  keyboardShortcutsTitle: 'Atalhos de Teclado',

  // ── Toast messages ────────────────────────────────────────────────────────
  importSuccess: 'Importado',
  exportSuccess: 'Exportado',
  clipboardFail: 'Falha ao copiar para a \u00e1rea de transfer\u00eancia',
  adfWorkerStalled:
    'Pr\u00e9-visualiza\u00e7\u00e3o ADF travada \u2014 usando renderizador alternativo.',
  colorWarning:
    'Formata\u00e7\u00e3o de cor n\u00e3o \u00e9 suportada na sa\u00edda Jira e ser\u00e1 removida.',
  underlineWarning: 'Sublinhado n\u00e3o \u00e9 suportado na sa\u00edda Jira e ser\u00e1 removido.',
  wikiEditDesyncWarning:
    'Edi\u00e7\u00f5es de Wiki Markup s\u00e3o independentes \u2014 as altera\u00e7\u00f5es n\u00e3o ser\u00e3o sincronizadas de volta com o Markdown original.',
  newDocumentSaved: 'Documento salvo no hist\u00f3rico.',

  // ── Shortcuts modal groups ────────────────────────────────────────────────
  scGroupFormatting: 'Formata\u00e7\u00e3o',
  scGroupStructure: 'Estrutura',
  scGroupLines: 'Linhas',
  scGroupEditor: 'Editor',
  scGroupOutputFormat: 'Formato de sa\u00edda',
  scGroupWysiwyg: 'Editor WYSIWYG (somente no modo de edi\u00e7\u00e3o)',
  closeShortcutsModal: 'Fechar painel de atalhos',

  // ── Info modal ────────────────────────────────────────────────────────────
  infoSubtitle: 'Conversor Markdown \u2192 Jira de c\u00f3digo aberto',
  infoDescription:
    'md2jira converte documentos Markdown em Jira Wiki Markup e Atlassian Document Format (ADF). Cole seu Markdown \u00e0 esquerda, obtenha conte\u00fado pronto para Jira \u00e0 direita \u2014 copie e cole diretamente em qualquer issue, coment\u00e1rio ou descri\u00e7\u00e3o do Jira Cloud.',
  infoPackages: 'Pacotes',
  infoLicense: 'Licen\u00e7a MIT',
  infoViewOnGithub: 'Ver no GitHub \u2192',
  infoCoreDesc:
    'Motor de convers\u00e3o em TypeScript puro. Zero depend\u00eancias do navegador \u2014 funciona em Node.js, navegadores e extens\u00f5es VSCode.',
  infoCliDesc: 'Ferramenta de linha de comando para converter arquivos Markdown pelo terminal.',
  infoWebDesc: 'Este app web \u2014 conversor em dois pain\u00e9is ao vivo com React 18 + Vite.',

  // ── Header ────────────────────────────────────────────────────────────────
  shareLink: 'Compartilhar link',
  exportPdf: 'Exportar PDF',
  tooLarge: 'Muito grande',
  docTooLargeForUrl: 'Documento grande demais para compartilhamento por URL',
  documentHistory: 'Hist\u00f3rico de documentos',
  historyDisabledHint:
    'Hist\u00f3rico de documentos (desativado \u2014 ative nas Configura\u00e7\u00f5es)',
  shareOrExport: 'Compartilhar ou exportar',
  noContentToShare: 'Nenhum conte\u00fado para compartilhar ou exportar ainda',

  // ── WYSIWYG toolbar ───────────────────────────────────────────────────────
  wysiwygBulletList: 'Lista com marcadores',
  wysiwygNumberedList: 'Lista numerada',
  wysiwygTaskList: 'Lista de tarefas',
  wysiwygRemoveColor: 'Remover cor',
  wysiwygColorNote:
    'A cor \u00e9 somente do editor e n\u00e3o aparecer\u00e1 no Markdown exportado ou na marca\u00e7\u00e3o Jira.',
  wysiwygSearchEmojis: 'Pesquisar emojis',
  wysiwygEmojiPlaceholder:
    'Pesquisar por categoria (Frequentes, Pessoas, Objetos, S\u00edmbolos\u2026)',
  wysiwygNoEmojis: 'Nenhum emoji encontrado',
  wysiwygLoading: 'Carregando\u2026',
  wysiwygTableOptions: 'Opções de tabela',
  wysiwygTableAddRowBelow: 'Adicionar linha abaixo',
  wysiwygTableAddRowAbove: 'Adicionar linha acima',
  wysiwygTableAddColRight: 'Adicionar coluna à direita',
  wysiwygTableAddColLeft: 'Adicionar coluna à esquerda',
  wysiwygTableDeleteRow: 'Excluir linha',
  wysiwygTableDeleteCol: 'Excluir coluna',
  wysiwygTableDelete: 'Excluir tabela',
  historySelectMode: 'Selecionar',
  historyCancelSelect: 'Cancelar',
  historyDeleteSelected: 'Excluir selecionados',
  historySelectAll: 'Selecionar tudo',
  historyDeselectAll: 'Desmarcar tudo',

  // ── Hist\u00f3rico (adicional) ──────────────────────────────────────────────
  historyEnableHint: 'Ative o hist\u00f3rico nas Configura\u00e7\u00f5es e comece a editar.',
  historyNoMatch: 'Nenhum documento corresponde a',
  historySelectModeAriaLabel: 'Entrar no modo de sele\u00e7\u00e3o em massa',

  // ── Modal de configura\u00e7\u00f5es (adicional) ───────────────────────────────
  settingsLanguageLabel: 'Idioma',
  settingsLanguageDescription:
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface',
  closeSettings: 'Fechar configura\u00e7\u00f5es',
  settingsMaxEntriesDescription: 'Quantos documentos recentes manter no hist\u00f3rico.',
  settingsAbout: 'Sobre este projeto',

  // ── Painel de sa\u00edda / modo de edi\u00e7\u00e3o ────────────────────────────────
  switchToViewMode: 'Mudar para modo de visualiza\u00e7\u00e3o',
  switchToEditMode: 'Mudar para modo de edi\u00e7\u00e3o',
  // -- Rotulos ARIA adicionais e strings de UI ------------------------------
  markdownPlaceholder: 'Cole seu Markdown aqui\u2026',
  openSettings: 'Abrir configura\u00e7\u00f5es',
  searchHistory: 'Pesquisar no hist\u00f3rico',
  clearSearch: 'Limpar pesquisa',
  renameEntryLabel: 'Renomear entrada',
  currentlyLoaded: 'Carregado atualmente',
  saveToHistory: 'Salvar documento no hist\u00f3rico',
  importHistory: 'Importar hist\u00f3rico',
  exportHistory: 'Exportar hist\u00f3rico',
  importUnsupportedType: 'Tipo de arquivo n\u00e3o suportado. Use um arquivo .md, .txt ou .text.',
  importFileTooLarge: 'Arquivo muito grande. Tamanho m\u00e1ximo permitido: 1 MB.',
  importReadError: 'N\u00e3o foi poss\u00edvel ler o arquivo. Pode estar corrompido ou inacess\u00edvel.',
  dismissToast: 'Fechar notifica\u00e7\u00e3o',
  close: 'Fechar',
  historySavedCount: 'salvos',
} as const