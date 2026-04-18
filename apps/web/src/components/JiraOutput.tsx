import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import TurndownService from 'turndown'
import { convertToAdf } from 'md2jira-core'
import type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfMark,
  AdfListItemNode,
  AdfTextNode,
  AdfTableRowNode,
  AdfTableHeaderNode,
  AdfTableCellNode,
} from 'md2jira-core'

type OutputFormat = 'wiki' | 'adf'
type ViewMode = 'preview' | 'code'

interface JiraOutputProps {
  value: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
  markdown: string
  onMarkdownChange?: (md: string) => void
}

// ─── Turndown instance ─────────────────────────────────────────

const td = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
})

td.keep(['sub', 'sup'])

td.addRule('strikethrough', {
  filter: (node) => ['S', 'DEL', 'STRIKE'].includes(node.nodeName),
  replacement: (content: string) => `~~${content}~~`,
})

td.addRule('codeBlockPre', {
  filter: (node) => node.nodeName === 'PRE' && node.querySelector('code') !== null,
  replacement: (_content: string, node: Node) => {
    const code = (node as HTMLElement).querySelector('code')
    return `\n\`\`\`\n${code?.textContent ?? ''}\n\`\`\`\n`
  },
})

td.addRule('tableCell', {
  filter: ['th', 'td'] as (keyof HTMLElementTagNameMap)[],
  replacement: (content: string) => ` ${content.replace(/\n/g, ' ').trim()} |`,
})

td.addRule('tableRow', {
  filter: 'tr',
  replacement: (content: string, node: Node) => {
    const el = node as HTMLElement
    const isHeader = el.querySelectorAll('th').length > 0
    const row = `|${content}`
    if (isHeader) {
      const count = el.querySelectorAll('th').length
      const sep = `| ${Array(count).fill('---').join(' | ')} |`
      return `\n${row}\n${sep}`
    }
    return `\n${row}`
  },
})

td.addRule('table', {
  filter: 'table',
  replacement: (content: string) => `\n\n${content.trim()}\n\n`,
})

// ─── Color palette ─────────────────────────────────────────────

const TEXT_COLORS = [
  '#091E42',
  '#172B4D',
  '#344563',
  '#42526E',
  '#5E6C84',
  '#6B778C',
  '#97A0AF',
  '#0052CC',
  '#0065FF',
  '#2684FF',
  '#4C9AFF',
  '#B3D4FF',
  '#DEEBFF',
  '#F4F5F7',
  '#403294',
  '#5243AA',
  '#6554C0',
  '#8777D9',
  '#998DD9',
  '#C0B6F2',
  '#EAE6FF',
  '#006644',
  '#00875A',
  '#57D9A3',
  '#79F2C0',
  '#ABF5D1',
  '#E3FCEF',
  '#FFFFFF',
  '#FF5630',
  '#DE350B',
  '#BF2600',
  '#FF8B00',
  '#FF991F',
  '#FFAB00',
  '#FFF0B3',
]

// ─── Emoji data ────────────────────────────────────────────────

const EMOJI_CATEGORIES: Record<string, string[]> = {
  Frequent: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '😉',
    '😊',
    '🥰',
    '😍',
    '😎',
    '🤩',
    '😘',
    '😋',
    '😜',
    '🤔',
    '🤗',
  ],
  People: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '😉',
    '😊',
    '🥰',
    '😍',
    '😘',
    '😋',
    '😛',
    '😜',
    '🤔',
    '🤗',
    '🤭',
    '🤫',
    '😐',
    '😑',
    '🙄',
    '😏',
    '😒',
    '😞',
    '😔',
    '😢',
    '😭',
    '😤',
    '😠',
    '🤬',
    '🥺',
    '😳',
    '🤯',
    '😱',
    '🤮',
    '😷',
    '🥴',
    '😵',
    '💀',
    '👻',
    '👽',
    '🤖',
  ],
  Hands: [
    '👋',
    '🤚',
    '✋',
    '🖖',
    '👌',
    '✌️',
    '🤞',
    '👆',
    '👇',
    '👈',
    '👉',
    '👍',
    '👎',
    '✊',
    '👊',
    '👏',
    '🙌',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
  ],
  Objects: [
    '💡',
    '🔍',
    '📝',
    '📋',
    '📌',
    '📍',
    '🔑',
    '🔒',
    '💼',
    '📁',
    '📅',
    '⏰',
    '📧',
    '💬',
    '📞',
    '🖥️',
    '💻',
    '📱',
    '⌨️',
    '📷',
    '🎵',
    '🎶',
  ],
  Symbols: [
    '✅',
    '❌',
    '⚠️',
    'ℹ️',
    '❓',
    '❗',
    '💯',
    '🔴',
    '🟠',
    '🟡',
    '🟢',
    '🔵',
    '🟣',
    '⭐',
    '🔥',
    '💥',
    '💫',
    '✨',
    '❤️',
    '💙',
    '💚',
    '💛',
    '🧡',
  ],
}

function adfInlineToHtml(node: AdfInlineNode): string {
  if (node.type === 'hardBreak') return '<br>'
  let html = node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case 'strong':
          html = `<strong>${html}</strong>`
          break
        case 'em':
          html = `<em>${html}</em>`
          break
        case 'strike':
          html = `<s>${html}</s>`
          break
        case 'code':
          html = `<code>${html}</code>`
          break
        case 'link':
          html = `<a href="${(mark as AdfMark & { attrs: { href: string } }).attrs.href}">${html}</a>`
          break
      }
    }
  }
  return html
}

function adfBlockToHtml(node: AdfBlockNode): string {
  switch (node.type) {
    case 'heading':
      return `<h${node.attrs.level}>${node.content.map(adfInlineToHtml).join('')}</h${node.attrs.level}>`
    case 'paragraph':
      return `<p>${node.content.map(adfInlineToHtml).join('')}</p>`
    case 'bulletList':
      return `<ul>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ul>`
    case 'orderedList':
      return `<ol>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ol>`
    case 'codeBlock':
      return `<pre><code>${node.content.map((t: AdfTextNode) => t.text).join('')}</code></pre>`
    case 'blockquote':
      return `<blockquote>${node.content.map(adfBlockToHtml).join('')}</blockquote>`
    case 'rule':
      return '<hr>'
    case 'table': {
      const rows = node.content.map((row: AdfTableRowNode) => {
        const cells = row.content.map((cell: AdfTableHeaderNode | AdfTableCellNode) => {
          const tag = cell.type === 'tableHeader' ? 'th' : 'td'
          const inner = cell.content.map(adfBlockToHtml).join('')
          return `<${tag}>${inner}</${tag}>`
        })
        return `<tr>${cells.join('')}</tr>`
      })
      return `<table>${rows.join('')}</table>`
    }
    default:
      return ''
  }
}

function adfToHtml(doc: AdfDocument): string {
  return doc.content.map(adfBlockToHtml).join('')
}

export function JiraOutput({
  value,
  format,
  onFormatChange,
  markdown,
  onMarkdownChange,
}: JiraOutputProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [editMode, setEditMode] = useState(false)

  // Dropdown open states
  const [textStyleOpen, setTextStyleOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('')

  // ─── Selection state for active toolbar indicators ──────────
  const [activeBlock, setActiveBlock] = useState<string>('p')
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isEditorUpdateRef = useRef(false)

  const previewHtml = useMemo(() => {
    try {
      const adfDoc = convertToAdf(markdown)
      return adfToHtml(adfDoc)
    } catch {
      return '<p style="color:#ef4444;">Error rendering preview</p>'
    }
  }, [markdown])

  // Initialize editor on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = previewHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync editor when markdown changes from the left panel (not while user edits here)
  useEffect(() => {
    if (!editorRef.current) return
    if (isEditorUpdateRef.current) {
      isEditorUpdateRef.current = false
      return
    }
    if (document.activeElement === editorRef.current) return
    editorRef.current.innerHTML = previewHtml
  }, [previewHtml])

  // Close all dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-toolbar]')) {
        setTextStyleOpen(false)
        setFormatOpen(false)
        setListsOpen(false)
        setColorOpen(false)
        setEmojiOpen(false)
        setInsertOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeAll = useCallback(() => {
    setTextStyleOpen(false)
    setFormatOpen(false)
    setListsOpen(false)
    setColorOpen(false)
    setEmojiOpen(false)
    setInsertOpen(false)
  }, [])

  const updateSelectionState = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || !editorRef.current.contains(sel.anchorNode)) return
    const block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase()
    setActiveBlock(block)
    const fmts = new Set<string>()
    for (const cmd of [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'subscript',
      'superscript',
    ]) {
      if (document.queryCommandState(cmd)) fmts.add(cmd)
    }
    setActiveFormats(fmts)
  }, [])

  const saveRange = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    updateSelectionState()
  }, [updateSelectionState])

  const restoreRange = useCallback(() => {
    if (!savedRangeRef.current || !editorRef.current) return
    if (document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current.cloneRange())
    }
  }, [])

  const scheduleMarkdownUpdate = useCallback(() => {
    if (!onMarkdownChange || !editorRef.current) return
    clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      if (!editorRef.current) return
      isEditorUpdateRef.current = true
      try {
        onMarkdownChange(td.turndown(editorRef.current.innerHTML))
      } catch {
        isEditorUpdateRef.current = false
      }
    }, 300)
  }, [onMarkdownChange])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      restoreRange()
      document.execCommand(cmd, false, arg ?? '')
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  const insertHtml = useCallback(
    (html: string) => {
      restoreRange()
      document.execCommand('insertHTML', false, html)
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  const handleCopy = useCallback(async () => {
    if (format === 'adf') {
      const currentHtml = editorRef.current?.innerHTML ?? previewHtml
      const blob = new Blob([currentHtml], { type: 'text/html' })
      const textBlob = new Blob([value], { type: 'text/plain' })
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob }),
      ])
    } else {
      await navigator.clipboard.writeText(value)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value, format, previewHtml])

  // Toolbar only visible when edit mode is active
  const canEdit = format === 'adf' && viewMode === 'preview' && !!onMarkdownChange
  const showToolbar = canEdit && editMode

  // ─── Shared style tokens ──────────────────────────────────────
  const btnCls =
    'relative flex h-7 items-center gap-0.5 rounded px-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 select-none'
  const dropCls =
    'absolute left-0 top-full z-50 mt-1 min-w-max rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900'
  const dropItemCls =
    'flex w-full items-center px-4 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'

  const ChevronDown = () => (
    <svg
      className="h-2.5 w-2.5 shrink-0"
      viewBox="0 0 10 6"
      fill="currentColor"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <path d="M0 0l5 6 5-6z" />
    </svg>
  )

  return (
    <div className="@container flex min-h-0 flex-1 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* ── Header bar ── */}
      <div className="flex flex-col gap-2 border-b border-neutral-200 px-3 py-2 @[460px]:flex-row @[460px]:items-center @[460px]:justify-between @[460px]:px-4 dark:border-neutral-800">
        <div className="flex flex-col gap-2 @[460px]:flex-row @[460px]:items-center @[460px]:gap-2">
          <div className="flex items-center justify-between gap-2 @[460px]:justify-start">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Output
            </span>
            <div
              role="group"
              aria-label="Copy and edit"
              className="flex rounded-md border border-neutral-300 text-xs @[460px]:hidden dark:border-neutral-600"
            >
              <button
                onClick={handleCopy}
                className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {copied ? 'Copied!' : format === 'adf' ? 'Copy for Jira' : 'Copy'}
              </button>
              {canEdit && (
                <button
                  onClick={() => setEditMode((v) => !v)}
                  title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
                  aria-pressed={editMode}
                  className={`whitespace-nowrap rounded-r-md border-l px-3 py-1 font-medium transition-colors ${
                    editMode
                      ? 'border-l-blue-300 bg-blue-50 text-blue-700 dark:border-l-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-l-neutral-300 text-neutral-600 dark:border-l-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {editMode ? 'View' : 'Edit'}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Output format"
              className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
            >
              <button
                onClick={() => onFormatChange('adf')}
                aria-pressed={format === 'adf'}
                className={`flex-1 whitespace-nowrap rounded-l-md px-2 py-1 transition-colors @[460px]:flex-none ${format === 'adf' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Jira Cloud
              </button>
              <button
                onClick={() => onFormatChange('wiki')}
                aria-pressed={format === 'wiki'}
                className={`flex-1 whitespace-nowrap rounded-r-md px-2 py-1 transition-colors @[460px]:flex-none ${format === 'wiki' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Wiki Markup
              </button>
            </div>
            <div
              role="group"
              aria-label="View mode"
              className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
            >
              <button
                onClick={() => setViewMode('preview')}
                aria-pressed={viewMode === 'preview'}
                className={`flex-1 whitespace-nowrap rounded-l-md px-2 py-1 transition-colors @[460px]:flex-none ${viewMode === 'preview' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                aria-pressed={viewMode === 'code'}
                className={`flex-1 whitespace-nowrap rounded-r-md px-2 py-1 transition-colors @[460px]:flex-none ${viewMode === 'code' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Code
              </button>
            </div>
          </div>
        </div>
        <div
          role="group"
          aria-label="Copy and edit"
          className="hidden items-center rounded-md border border-neutral-300 text-xs dark:border-neutral-600 @[460px]:flex"
        >
          <button
            onClick={handleCopy}
            className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {copied ? 'Copied!' : format === 'adf' ? 'Copy for Jira' : 'Copy'}
          </button>
          {canEdit && (
            <button
              onClick={() => setEditMode((v) => !v)}
              title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
              aria-pressed={editMode}
              className={`whitespace-nowrap rounded-r-md border-l px-3 py-1 font-medium transition-colors ${
                editMode
                  ? 'border-l-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-l-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900'
                  : 'border-l-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {editMode ? 'View' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {format === 'adf' && viewMode === 'code' && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500">
          Copies as rich text — paste directly into Jira Cloud comments
        </div>
      )}

      {/* ── Editor toolbar ── */}
      {canEdit && (
        <div
          aria-hidden={!showToolbar}
          {...(showToolbar ? {} : { inert: '' })}
          className={`transition-all duration-200 ${showToolbar ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          style={{
            height: showToolbar ? undefined : 0,
            overflow: showToolbar ? 'visible' : 'hidden',
          }}
        >
          <div
            data-toolbar
            role="toolbar"
            aria-label="Text formatting"
            className="flex flex-wrap items-center gap-px border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
          >
            {/* Text Styles */}
            <div className="relative" data-toolbar>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveRange()
                  setTextStyleOpen((v) => !v)
                  setFormatOpen(false)
                  setListsOpen(false)
                  setColorOpen(false)
                  setEmojiOpen(false)
                  setInsertOpen(false)
                }}
                title="Text styles"
                className={btnCls}
              >
                <span className="font-mono font-bold">Tt</span>
                <ChevronDown />
              </button>
              {textStyleOpen && (
                <div className={dropCls} style={{ minWidth: 190 }}>
                  {(
                    [
                      { label: 'Normal text', tag: 'p', cls: 'text-sm' },
                      { label: 'Heading 1', tag: 'H1', cls: 'text-xl font-bold' },
                      { label: 'Heading 2', tag: 'H2', cls: 'text-lg font-bold' },
                      { label: 'Heading 3', tag: 'H3', cls: 'text-base font-bold' },
                      { label: 'Heading 4', tag: 'H4', cls: 'text-sm font-bold' },
                      { label: 'Heading 5', tag: 'H5', cls: 'text-xs font-bold' },
                      { label: 'Heading 6', tag: 'H6', cls: 'text-xs font-semibold' },
                    ] as { label: string; tag: string; cls: string }[]
                  ).map(({ label, tag, cls }) => {
                    const isActive = activeBlock === tag.toLowerCase()
                    return (
                      <button
                        key={tag}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          exec('formatBlock', tag)
                          setTextStyleOpen(false)
                        }}
                        className={`flex w-full items-center justify-between px-4 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 ${cls} ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                      >
                        <span>{label}</span>
                        {isActive && (
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-blue-600"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Format text */}
            <div className="relative" data-toolbar>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveRange()
                  setFormatOpen((v) => !v)
                  setTextStyleOpen(false)
                  setListsOpen(false)
                  setColorOpen(false)
                  setEmojiOpen(false)
                  setInsertOpen(false)
                }}
                title="Format text"
                className={btnCls}
              >
                <span className="font-bold">B</span>
                <ChevronDown />
              </button>
              {formatOpen && (
                <div className={dropCls} style={{ minWidth: 215 }}>
                  {(
                    [
                      {
                        label: 'Bold',
                        shortcut: 'Ctrl+B',
                        iconCls: 'font-bold',
                        icon: 'B',
                        cmd: 'bold',
                      },
                      {
                        label: 'Italic',
                        shortcut: 'Ctrl+I',
                        iconCls: 'italic',
                        icon: 'I',
                        cmd: 'italic',
                      },
                      {
                        label: 'Underline',
                        shortcut: 'Ctrl+U',
                        iconCls: 'underline',
                        icon: 'U',
                        cmd: 'underline',
                      },
                      {
                        label: 'Strikethrough',
                        shortcut: 'Ctrl+Shift+S',
                        iconCls: 'line-through',
                        icon: 'S',
                        cmd: 'strikeThrough',
                      },
                      {
                        label: 'Subscript',
                        shortcut: 'Ctrl+,',
                        iconCls: '',
                        icon: 'X₁',
                        cmd: 'subscript',
                      },
                      {
                        label: 'Superscript',
                        shortcut: 'Ctrl+.',
                        iconCls: '',
                        icon: 'X¹',
                        cmd: 'superscript',
                      },
                      {
                        label: 'Clear formatting',
                        shortcut: 'Ctrl+\\',
                        iconCls: '',
                        icon: '✕',
                        cmd: 'removeFormat',
                      },
                    ] as {
                      label: string
                      shortcut: string
                      iconCls: string
                      icon: string
                      cmd: string
                    }[]
                  ).map(({ label, shortcut, iconCls, icon, cmd }) => {
                    const isActive = activeFormats.has(cmd)
                    return (
                      <button
                        key={label}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          exec(cmd)
                          setFormatOpen(false)
                        }}
                        className={`${dropItemCls} justify-between ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-5 text-center ${iconCls}`}>{icon}</span>
                          {label}
                        </span>
                        <span className="flex items-center gap-2">
                          {isActive && (
                            <svg
                              className="h-3.5 w-3.5 text-blue-600"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                            </svg>
                          )}
                          <span className="text-xs text-neutral-400">{shortcut}</span>
                        </span>
                      </button>
                    )
                  })}
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml('<code>code</code>')
                      setFormatOpen(false)
                    }}
                    className={`${dropItemCls} justify-between`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono text-xs">{'{}'}</span>
                      Code
                    </span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+M</span>
                  </button>
                </div>
              )}
            </div>

            {/* Lists */}
            <div className="relative" data-toolbar>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveRange()
                  setListsOpen((v) => !v)
                  setTextStyleOpen(false)
                  setFormatOpen(false)
                  setColorOpen(false)
                  setEmojiOpen(false)
                  setInsertOpen(false)
                }}
                title="Lists"
                className={btnCls}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                <ChevronDown />
              </button>
              {listsOpen && (
                <div className={dropCls} style={{ minWidth: 215 }}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      exec('insertUnorderedList')
                      setListsOpen(false)
                    }}
                    className={`${dropItemCls} justify-between`}
                  >
                    <span>Bullet list</span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+8</span>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      exec('insertOrderedList')
                      setListsOpen(false)
                    }}
                    className={`${dropItemCls} justify-between`}
                  >
                    <span>Numbered list</span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+7</span>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml(
                        '<ul style="list-style:none;padding-left:0"><li><input type="checkbox">&nbsp;Task</li></ul>'
                      )
                      setListsOpen(false)
                    }}
                    className={`${dropItemCls} justify-between`}
                  >
                    <span>Task list</span>
                    <span className="text-xs text-neutral-400">Ctrl+Shift+6</span>
                  </button>
                </div>
              )}
            </div>

            {/* Text color */}
            <div className="relative" data-toolbar>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveRange()
                  setColorOpen((v) => !v)
                  setTextStyleOpen(false)
                  setFormatOpen(false)
                  setListsOpen(false)
                  setEmojiOpen(false)
                  setInsertOpen(false)
                }}
                title="Text color"
                className={btnCls}
              >
                <span className="relative select-none font-bold leading-none">
                  A
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded bg-blue-600" />
                </span>
              </button>
              {colorOpen && (
                <div className={`${dropCls} p-3`} style={{ minWidth: 222 }}>
                  <div className="grid grid-cols-7 gap-1">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          exec('foreColor', color)
                          setColorOpen(false)
                        }}
                        className="h-6 w-6 rounded border border-neutral-300 transition-transform hover:scale-110 dark:border-neutral-600"
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        exec('removeFormat')
                        setColorOpen(false)
                      }}
                      className="w-full rounded py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Remove color
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Media — placeholder */}
            <button
              title="Add image, video or file (not available in preview)"
              className={`${btnCls} cursor-not-allowed opacity-40`}
              onMouseDown={(e) => e.preventDefault()}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

            {/* Code snippet */}
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                saveRange()
                const selectedText = savedRangeRef.current?.toString() ?? ''
                const escaped = selectedText
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                const content = escaped.length > 0 ? escaped : '// code here'
                insertHtml(`<pre><code>${content}</code></pre><p><br></p>`)
              }}
              title="Code snippet"
              className={btnCls}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>

            {/* Emoji */}
            <div className="relative" data-toolbar>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveRange()
                  setEmojiOpen((v) => !v)
                  setTextStyleOpen(false)
                  setFormatOpen(false)
                  setListsOpen(false)
                  setColorOpen(false)
                  setInsertOpen(false)
                }}
                title="Emoji"
                className={btnCls}
              >
                <span className="text-base leading-none">☺</span>
              </button>
              {emojiOpen && (
                <div
                  className={`${dropCls} p-2`}
                  style={{ minWidth: 280, maxHeight: 300, overflowY: 'auto' }}
                >
                  <input
                    type="text"
                    placeholder="Search..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="mb-2 w-full rounded border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  {emojiSearch ? (
                    <div className="flex flex-wrap gap-0.5">
                      {Object.values(EMOJI_CATEGORIES)
                        .flat()
                        .filter((em) => em.includes(emojiSearch))
                        .map((em, i) => (
                          <button
                            key={i}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              exec('insertText', em)
                              setEmojiOpen(false)
                              setEmojiSearch('')
                            }}
                            className="rounded p-1 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            {em}
                          </button>
                        ))}
                    </div>
                  ) : (
                    Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                      <div key={cat} className="mb-2">
                        <div className="mb-1 text-xs font-semibold text-neutral-400">{cat}</div>
                        <div className="flex flex-wrap gap-0.5">
                          {emojis.map((em, i) => (
                            <button
                              key={i}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                exec('insertText', em)
                                setEmojiOpen(false)
                              }}
                              className="rounded p-1 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Insert elements */}
            <div className="relative" data-toolbar>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  saveRange()
                  setInsertOpen((v) => !v)
                  setTextStyleOpen(false)
                  setFormatOpen(false)
                  setListsOpen(false)
                  setColorOpen(false)
                  setEmojiOpen(false)
                }}
                title="Insert elements"
                className={`${btnCls} rounded-full font-bold`}
              >
                +
              </button>
              {insertOpen && (
                <div className={dropCls} style={{ minWidth: 265 }}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml(
                        '<ul style="list-style:none;padding-left:0"><li><input type="checkbox">&nbsp;Action item</li></ul>'
                      )
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Action item</div>
                      <div className="text-xs text-neutral-400">Create and assign action items</div>
                    </div>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml('<p>@mention</p>')
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Mention</div>
                      <div className="text-xs text-neutral-400">Mention someone to notify them</div>
                    </div>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml(
                        '<table style="border-collapse:collapse;width:100%">' +
                          '<tr><th style="border:1px solid #dfe1e6;padding:6px 8px;background:#f4f5f7">Column 1</th><th style="border:1px solid #dfe1e6;padding:6px 8px;background:#f4f5f7">Column 2</th></tr>' +
                          '<tr><td style="border:1px solid #dfe1e6;padding:6px 8px">&nbsp;</td><td style="border:1px solid #dfe1e6;padding:6px 8px">&nbsp;</td></tr>' +
                          '</table><p><br></p>'
                      )
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Table</div>
                      <div className="text-xs text-neutral-400">Insert a table</div>
                    </div>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml(
                        '<div style="background:#deebff;border-left:4px solid #0052cc;border-radius:4px;padding:8px 12px;margin:4px 0"><p>ℹ️ Info panel</p></div><p><br></p>'
                      )
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Info panel</div>
                      <div className="text-xs text-neutral-400">
                        Highlight information in a color panel
                      </div>
                    </div>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml(
                        '<blockquote style="border-left:3px solid #dfe1e6;margin:4px 0;padding:4px 12px;color:#5e6c84"><p>Quote here</p></blockquote><p><br></p>'
                      )
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Quote</div>
                      <div className="text-xs text-neutral-400">Insert a quote or reference</div>
                    </div>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertHtml(
                        '<div style="background:#fffae6;border-left:4px solid #ff991f;border-radius:4px;padding:8px 12px;margin:4px 0"><p>&lt;&gt; Decision: </p></div><p><br></p>'
                      )
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Decision</div>
                      <div className="text-xs text-neutral-400">
                        Capture decisions to track them
                      </div>
                    </div>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      exec('insertHorizontalRule')
                      closeAll()
                    }}
                    className={dropItemCls}
                  >
                    <div className="text-left">
                      <div>Divider</div>
                      <div className="text-xs text-neutral-400">Insert a dividing line</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

            {/* Undo */}
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                exec('undo')
              }}
              title="Undo (Ctrl+Z)"
              className={btnCls}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-9.7L1 10" />
              </svg>
            </button>

            {/* Redo */}
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                exec('redo')
              }}
              title="Redo (Ctrl+Y)"
              className={btnCls}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-.49-9.7L23 10" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {viewMode === 'code' ? (
        <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-900 dark:text-neutral-100">
          {value}
        </pre>
      ) : (
        <div
          ref={editorRef}
          contentEditable={canEdit && editMode}
          suppressContentEditableWarning
          onInput={scheduleMarkdownUpdate}
          onMouseUp={saveRange}
          onKeyUp={saveRange}
          className={`jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 outline-none transition-shadow duration-200 dark:text-neutral-100 ${canEdit && editMode ? 'ring-1 ring-inset ring-blue-300 dark:ring-blue-700' : 'ring-0'}`}
        />
      )}
    </div>
  )
}
