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
    'Interface language \u00b7 Idioma de la interfaz \u00b7 Idioma da interface \u00b7 Langue de l\u2019interface',
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
  importReadError:
    'N\u00e3o foi poss\u00edvel ler o arquivo. Pode estar corrompido ou inacess\u00edvel.',
  dismissToast: 'Fechar notifica\u00e7\u00e3o',
  close: 'Fechar',
  historySavedCount: 'salvos',
  historySavedCountOne: 'salvo',
  switchPanel: 'Alternar painel',
  mainContent: 'Conte\u00fado principal',
  jiraOutputPanel: 'Sa\u00edda do Jira',
  fileActions: 'A\u00e7\u00f5es de arquivo',
  markdownInputEditor: 'Editor de Markdown',
  notificationsLabel: 'Notifica\u00e7\u00f5es',
  supportProject: 'Apoie o projeto \u2014 Me pague um caf\u00e9',
  starOnGitHub: 'Dar estrela no GitHub',
  viewOnGitHub: 'Ver projeto no GitHub',
  selectEntryLabel: 'Selecionar "{title}"',
  renameEntryAction: 'Renomear "{title}"',
  deleteEntryLabel: 'Excluir "{title}" do hist\u00f3rico',
  // ── R\u00f3tulos aria n\u00e3o traduzidos anteriormente ─────────────────────────────
  markdownInputSection: 'Entrada de Markdown',
  resizePanels: 'Redimensionar pain\u00e9is',
  editActions: 'A\u00e7\u00f5es de edi\u00e7\u00e3o',
  findReplace: 'Localizar / Substituir',
  switchToLightMode: 'Mudar para modo claro',
  switchToDarkMode: 'Mudar para modo escuro',
  copyAndEditGroup: 'Copiar e editar',
  textFormattingToolbar: 'Formata\u00e7\u00e3o de texto',
  codeSnippetButton: 'Trecho de c\u00f3digo',
  renderingJiraPreview: 'Renderizando pr\u00e9via do Jira',
  jiraContentEditor: 'Editor de conte\u00fado Jira',
  wikiMarkupEditor: 'Editor de Wiki Markup',
  wikiMarkupPreview: 'Pr\u00e9-visualiza\u00e7\u00e3o de Wiki Markup',
  viewModeGroup: 'Modo de visualiza\u00e7\u00e3o',
  // ── WYSIWYG toolbar — bot\u00f5es de formata\u00e7\u00e3o ──────────────────────────────
  wysiwygBold: 'Negrito',
  wysiwygItalic: 'It\u00e1lico',
  wysiwygUnderline: 'Sublinhado',
  wysiwygStrikethrough: 'Tachado',
  wysiwygInlineCode: 'C\u00f3digo inline',
  wysiwygSubscript: 'Subscrito',
  wysiwygSuperscript: 'Sobrescrito',
  wysiwygClearFormatting: 'Limpar formata\u00e7\u00e3o',
  // ── WYSIWYG toolbar — r\u00f3tulos de menu ────────────────────────────────────
  wysiwygTextStyles: 'Estilos de texto',
  wysiwygMoreFormatting: 'Mais formata\u00e7\u00e3o',
  wysiwygLists: 'Listas',
  wysiwygTextColor: 'Cor do texto',
  wysiwygEmoji: 'Emoji',
  wysiwygInsertElements: 'Inserir elementos',
  // ── WYSIWYG toolbar — estilos de texto ───────────────────────────────────
  wysiwygNormalText: 'Texto normal',
  wysiwygHeading1: 'T\u00edtulo 1',
  wysiwygHeading2: 'T\u00edtulo 2',
  wysiwygHeading3: 'T\u00edtulo 3',
  wysiwygHeading4: 'T\u00edtulo 4',
  wysiwygHeading5: 'T\u00edtulo 5',
  wysiwygHeading6: 'T\u00edtulo 6',
  // ── WYSIWYG toolbar — itens do menu Inserir ──────────────────────────────
  wysiwygActionItem: 'Item de a\u00e7\u00e3o',
  wysiwygActionItemDesc: 'Criar e atribuir itens de a\u00e7\u00e3o',
  wysiwygMention: 'Men\u00e7\u00e3o',
  wysiwygMentionDesc: 'Inserir @men\u00e7\u00e3o \u2014 cursor fica ap\u00f3s o s\u00edmbolo @',
  wysiwygInsertTable: 'Tabela',
  wysiwygInsertTableDesc: 'Inserir uma tabela',
  wysiwygInfoPanel: 'Painel de informa\u00e7\u00f5es',
  wysiwygInfoPanelDesc: 'Destacar informa\u00e7\u00f5es em um painel colorido',
  wysiwygQuote: 'Cita\u00e7\u00e3o',
  wysiwygQuoteDesc: 'Inserir uma cita\u00e7\u00e3o ou refer\u00eancia',
  wysiwygDecision: 'Decis\u00e3o',
  wysiwygDecisionDesc: 'Registrar decis\u00f5es para acompanhamento',
  wysiwygDivider: 'Divisor',
  wysiwygDividerDesc: 'Inserir uma linha divis\u00f3ria',
  // ── WYSIWYG — aviso de formato perdido ────────────────────────────────────
  lostInJira: 'Perdido no Jira',
  lostInJiraTooltip:
    'A formata\u00e7\u00e3o de sublinhado e cor n\u00e3o aparecer\u00e1 na sa\u00edda do Jira Wiki',
  // ── R\u00f3tulos de regi\u00e3o de visualiza\u00e7\u00e3o de c\u00f3digo ─────────────────────
  adfCodeLabel: 'C\u00f3digo ADF JSON',
  wikiCodeLabel: 'C\u00f3digo Wiki Markup',
  // ── Link de pular ─────────────────────────────────────────────────────────
  skipToMainContent: 'Ir para o conte\u00fado principal',
  // ── T\u00edtulos de tooltip ──────────────────────────────────────────────────
  newDocumentTitle: 'Novo documento (limpa o editor)',
  importHistoryTitle: 'Importar hist\u00f3rico de JSON',
  exportHistoryTitle: 'Exportar hist\u00f3rico como JSON',
  // ── Contador de caracteres ────────────────────────────────────────────────
  charsLabel: 'car.',
  // ── Modal de compartilhamento ─────────────────────────────────────────────
  shareDocumentTitle: 'Compartilhar documento',
  shareDocumentDesc:
    'Compartilhe este link para que outros possam visualizar seu documento Markdown convertido.',
  copyLinkToShare: 'Copiar link para compartilhar',
  // ── Atalhos de teclado \u2014 r\u00f3tulos de a\u00e7\u00f5es ──────────────────────────────────────
  scLabelBold: 'Negrito',
  scLabelItalic: 'It\u00e1lico',
  scLabelInsertLink: 'Inserir link',
  scLabelInlineCode: 'C\u00f3digo inline',
  scLabelStrikethrough: 'Tachado',
  scLabelCycleHeading: 'Alternar t\u00edtulo (h1 \u2192 h2 \u2192 h3 \u2192 nenhum)',
  scLabelToggleBulletList: 'Alternar lista com marcadores',
  scLabelToggleNumberedList: 'Alternar lista numerada',
  scLabelToggleBlockquote: 'Alternar cita\u00e7\u00e3o em bloco',
  scLabelInsertCodeBlock:
    'Inserir bloco de c\u00f3digo \u26a0 pode conflitar com DevTools no Chrome/Edge',
  scLabelInsertBlankLine: 'Inserir linha em branco abaixo',
  scLabelMoveLineUp: 'Mover linha para cima',
  scLabelMoveLineDown: 'Mover linha para baixo',
  scLabelDuplicateLine: 'Duplicar linha',
  scLabelIndent: 'Indentar (2 espa\u00e7os)',
  scLabelDedent: 'Desindentar (remover 2 espa\u00e7os)',
  scLabelAutoContinueList: 'Continuar item de lista automaticamente',
  scLabelSaveHistory: 'Salvar no hist\u00f3rico',
  scLabelSaveHistoryDisabled: 'Salvar no hist\u00f3rico (ativar nas Configura\u00e7\u00f5es)',
  scLabelSwitchAdf: 'Alternar para Jira Cloud (ADF)',
  scLabelSwitchWiki: 'Alternar para Wiki Markup',
  scLabelToggleHistory: 'Mostrar/ocultar hist\u00f3rico de documentos',
  scLabelNewDocument: 'Novo documento (salva no hist\u00f3rico primeiro)',
  scLabelUnderline: 'Sublinhado',
  scLabelUndo: 'Desfazer',
  scLabelRedo: 'Refazer',
  scLabelOrderedList: 'Lista ordenada',
  scLabelBulletList: 'Lista com marcadores',
  scLabelBlockquote: 'Cita\u00e7\u00e3o em bloco',
  // ── Menu de formato \u2014 nota de rodap\u00e9 ────────────────────────────────────────
  wysiwygSubSupNote:
    'Subscrito e sobrescrito s\u00e3o apenas do editor \u2014 serializam como tags HTML no Markdown exportado.',
  renderError: 'Erro de renderiza\u00e7\u00e3o',
  retriesRemaining: 'restantes',
  retriesRemainingOne: 'restante',
  maxRetriesLabel:
    'N\u00famero m\u00e1ximo de tentativas atingido. Por favor, recarregue a p\u00e1gina.',
  buyMeACoffee: '\u2615 Me pague um caf\u00e9',
  // ── An\u00fancios de regi\u00e3o aria-live ──────────────────────────────────────────
  editModeEnabled: 'Modo de edi\u00e7\u00e3o ativado',
  copiedToClipboard: 'Copiado para a \u00e1rea de transfer\u00eancia',
} as const
