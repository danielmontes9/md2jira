import { useState, useCallback, useEffect, ReactNode } from 'react'
import { TEXT_COLORS, EMOJI_CATEGORIES } from './constants.js'

interface EditorToolbarProps {
  exec: (cmd: string, arg?: string) => void
  insertHtml: (html: string) => void
  saveRange: () => void
  activeBlock: string
  activeFormats: Set<string>
}

type DropKey = 'textStyle' | 'format' | 'lists' | 'color' | 'emoji' | 'insert'

const DROP_CLS =
  'absolute left-0 top-full z-50 mt-1 min-w-max rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900'

/** Generic dropdown wrapper used by every toolbar menu. */
function ToolbarDropdown({
  dropKey,
  openKey,
  onOpen,
  onClose,
  trigger,
  children,
}: {
  dropKey: DropKey
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  onClose: () => void
  trigger: ReactNode
  children: ReactNode
}) {
  const isOpen = openKey === dropKey
  return (
    <div className="relative" data-toolbar>
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          if (isOpen) onClose()
          else onOpen(dropKey)
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative flex h-7 items-center gap-0.5 rounded px-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 select-none"
      >
        {trigger}
      </button>
      {isOpen && children}
    </div>
  )
}

/**
 * WYSIWYG editor toolbar using document.execCommand() for text formatting.
 *
 * NOTE: document.execCommand() is deprecated per the HTML spec
 * (https://developer.mozilla.org/docs/Web/API/Document/execCommand).
 * It remains the only cross-browser approach for formatting a contentEditable
 * element without a full rich-text library such as TipTap (ProseMirror-based),
 * which is the recommended future migration target.
 */
export function EditorToolbar({
  exec,
  insertHtml,
  saveRange,
  activeBlock,
  activeFormats,
}: EditorToolbarProps) {
  const [openKey, setOpenKey] = useState<DropKey | null>(null)
  const [emojiSearch, setEmojiSearch] = useState('')

  const open = useCallback(
    (key: DropKey) => {
      saveRange()
      setOpenKey(key)
    },
    [saveRange]
  )
  const close = useCallback(() => setOpenKey(null), [])

  // Close dropdowns when clicking outside the toolbar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-toolbar]')) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  const btnCls =
    'relative flex h-7 items-center gap-0.5 rounded px-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 select-none'
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

  const CheckIcon = () => (
    <svg className="h-3.5 w-3.5 shrink-0 text-blue-600" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
    </svg>
  )

  return (
    <div
      data-toolbar
      role="toolbar"
      aria-label="Text formatting"
      className="flex flex-wrap items-center gap-px border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
    >
      {/* Text Styles */}
      <ToolbarDropdown
        dropKey="textStyle"
        openKey={openKey}
        onOpen={open}
        onClose={close}
        trigger={
          <>
            <span className="font-mono font-bold" title="Text styles">
              Tt
            </span>
            <ChevronDown />
          </>
        }
      >
        <div className={DROP_CLS} style={{ minWidth: 190 }}>
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
                  close()
                }}
                className={`flex w-full items-center justify-between px-4 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 ${cls} ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
              >
                <span>{label}</span>
                {isActive && <CheckIcon />}
              </button>
            )
          })}
        </div>
      </ToolbarDropdown>

      {/* Format text */}
      <ToolbarDropdown
        dropKey="format"
        openKey={openKey}
        onOpen={open}
        onClose={close}
        trigger={
          <>
            <span className="font-bold" title="Format text">
              B
            </span>
            <ChevronDown />
          </>
        }
      >
        <div className={DROP_CLS} style={{ minWidth: 215 }}>
          {(
            [
              { label: 'Bold', shortcut: 'Ctrl+B', iconCls: 'font-bold', icon: 'B', cmd: 'bold' },
              { label: 'Italic', shortcut: 'Ctrl+I', iconCls: 'italic', icon: 'I', cmd: 'italic' },
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
              { label: 'Subscript', shortcut: 'Ctrl+,', iconCls: '', icon: 'X₁', cmd: 'subscript' },
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
            ] as { label: string; shortcut: string; iconCls: string; icon: string; cmd: string }[]
          ).map(({ label, shortcut, iconCls, icon, cmd }) => {
            const isActive = activeFormats.has(cmd)
            return (
              <button
                key={label}
                onMouseDown={(e) => {
                  e.preventDefault()
                  exec(cmd)
                  close()
                }}
                className={`${dropItemCls} justify-between ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-5 text-center ${iconCls}`}>{icon}</span>
                  {label}
                </span>
                <span className="flex items-center gap-2">
                  {isActive && <CheckIcon />}
                  <span className="text-xs text-neutral-400">{shortcut}</span>
                </span>
              </button>
            )
          })}
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              insertHtml('<code>code</code>')
              close()
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
      </ToolbarDropdown>

      {/* Lists */}
      <ToolbarDropdown
        dropKey="lists"
        openKey={openKey}
        onOpen={open}
        onClose={close}
        trigger={
          <>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-label="Lists"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <ChevronDown />
          </>
        }
      >
        <div className={DROP_CLS} style={{ minWidth: 215 }}>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              exec('insertUnorderedList')
              close()
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
              close()
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
              close()
            }}
            className={`${dropItemCls} justify-between`}
          >
            <span>Task list</span>
            <span className="text-xs text-neutral-400">Ctrl+Shift+6</span>
          </button>
        </div>
      </ToolbarDropdown>

      {/* Text color */}
      <ToolbarDropdown
        dropKey="color"
        openKey={openKey}
        onOpen={open}
        onClose={close}
        trigger={
          <span className="relative select-none font-bold leading-none" title="Text color">
            A
            <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded bg-blue-600" />
          </span>
        }
      >
        <div className={`${DROP_CLS} p-3`} style={{ minWidth: 222 }}>
          <div className="grid grid-cols-7 gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                onMouseDown={(e) => {
                  e.preventDefault()
                  exec('foreColor', color)
                  close()
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
                close()
              }}
              className="w-full rounded py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Remove color
            </button>
          </div>
        </div>
      </ToolbarDropdown>

      {/* Media — placeholder (not implemented) */}
      <button
        title="Add image, video or file (not available in preview)"
        className={`${btnCls} cursor-not-allowed opacity-40`}
        onMouseDown={(e) => e.preventDefault()}
        aria-disabled="true"
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
          const sel = window.getSelection()
          const selectedText = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).toString() : ''
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
      <ToolbarDropdown
        dropKey="emoji"
        openKey={openKey}
        onOpen={open}
        onClose={close}
        trigger={
          <span className="text-base leading-none" title="Emoji">
            ☺
          </span>
        }
      >
        <div
          className={`${DROP_CLS} p-2`}
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
                      close()
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
                        close()
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
      </ToolbarDropdown>

      {/* Insert elements */}
      <ToolbarDropdown
        dropKey="insert"
        openKey={openKey}
        onOpen={open}
        onClose={close}
        trigger={
          <span className="font-bold rounded-full" title="Insert elements">
            +
          </span>
        }
      >
        <div className={DROP_CLS} style={{ minWidth: 265 }}>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              insertHtml(
                '<ul style="list-style:none;padding-left:0"><li><input type="checkbox">&nbsp;Action item</li></ul>'
              )
              close()
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
              close()
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
              close()
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
              close()
            }}
            className={dropItemCls}
          >
            <div className="text-left">
              <div>Info panel</div>
              <div className="text-xs text-neutral-400">Highlight information in a color panel</div>
            </div>
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              insertHtml(
                '<blockquote style="border-left:3px solid #dfe1e6;margin:4px 0;padding:4px 12px;color:#5e6c84"><p>Quote here</p></blockquote><p><br></p>'
              )
              close()
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
              close()
            }}
            className={dropItemCls}
          >
            <div className="text-left">
              <div>Decision</div>
              <div className="text-xs text-neutral-400">Capture decisions to track them</div>
            </div>
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              exec('insertHorizontalRule')
              close()
            }}
            className={dropItemCls}
          >
            <div className="text-left">
              <div>Divider</div>
              <div className="text-xs text-neutral-400">Insert a dividing line</div>
            </div>
          </button>
        </div>
      </ToolbarDropdown>

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
  )
}

interface EditorToolbarProps {
  exec: (cmd: string, arg?: string) => void
  insertHtml: (html: string) => void
  saveRange: () => void
  activeBlock: string
  activeFormats: Set<string>
}

/**
 * WYSIWYG editor toolbar using document.execCommand() for text formatting.
 *
 * NOTE: document.execCommand() is deprecated per the HTML spec
 * (https://developer.mozilla.org/docs/Web/API/Document/execCommand).
 * It remains the only cross-browser approach for formatting a contentEditable
 * element without a full rich-text library such as TipTap (ProseMirror-based),
 * which is the recommended future migration target.
 */
export function EditorToolbar({
  exec,
  insertHtml,
  saveRange,
  activeBlock,
  activeFormats,
}: EditorToolbarProps) {
  const [textStyleOpen, setTextStyleOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('')

  const closeAll = useCallback(() => {
    setTextStyleOpen(false)
    setFormatOpen(false)
    setListsOpen(false)
    setColorOpen(false)
    setEmojiOpen(false)
    setInsertOpen(false)
  }, [])

  // Close dropdowns when clicking outside the toolbar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-toolbar]')) closeAll()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [closeAll])

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
          aria-expanded={textStyleOpen}
          aria-haspopup="true"
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
          aria-expanded={formatOpen}
          aria-haspopup="true"
          className={btnCls}
        >
          <span className="font-bold">B</span>
          <ChevronDown />
        </button>
        {formatOpen && (
          <div className={dropCls} style={{ minWidth: 215 }}>
            {(
              [
                { label: 'Bold', shortcut: 'Ctrl+B', iconCls: 'font-bold', icon: 'B', cmd: 'bold' },
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
              ] as { label: string; shortcut: string; iconCls: string; icon: string; cmd: string }[]
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
          aria-expanded={listsOpen}
          aria-haspopup="true"
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
          aria-expanded={colorOpen}
          aria-haspopup="true"
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

      {/* Media — placeholder (not implemented) */}
      <button
        title="Add image, video or file (not available in preview)"
        className={`${btnCls} cursor-not-allowed opacity-40`}
        onMouseDown={(e) => e.preventDefault()}
        aria-disabled="true"
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
          const sel = window.getSelection()
          const selectedText = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).toString() : ''
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
          aria-expanded={emojiOpen}
          aria-haspopup="true"
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
          aria-expanded={insertOpen}
          aria-haspopup="true"
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
                <div className="text-xs text-neutral-400">Capture decisions to track them</div>
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
  )
}
