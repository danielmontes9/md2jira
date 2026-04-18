import { useState, useCallback, useEffect } from 'react'
import { MOD_KEY } from '../../utils/keyboard.js'
import { type DropKey, BTN_CLS } from './toolbar/shared.js'
import { TextStyleMenu, FormatMenu } from './toolbar/FormatMenus.js'
import { ListsMenu, ColorMenu, EmojiMenu, InsertMenu } from './toolbar/ContentMenus.js'

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
  const [openKey, setOpenKey] = useState<DropKey | null>(null)

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

  const menuProps = { exec, insertHtml, close, openKey, onOpen: open }

  return (
    <div
      data-toolbar
      role="toolbar"
      aria-label="Text formatting"
      className="flex flex-wrap items-center gap-px border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <TextStyleMenu {...menuProps} activeBlock={activeBlock} />
      <FormatMenu {...menuProps} activeFormats={activeFormats} />
      <ListsMenu {...menuProps} />
      <ColorMenu {...menuProps} />

      {/* Media — placeholder (not implemented) */}
      <button
        title="Add image, video or file (not available in preview)"
        className={`${BTN_CLS} cursor-not-allowed opacity-40`}
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
        className={BTN_CLS}
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

      <EmojiMenu {...menuProps} />
      <InsertMenu {...menuProps} />

      <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Undo */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          exec('undo')
        }}
        title={`Undo (${MOD_KEY}+Z)`}
        className={BTN_CLS}
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
        title={`Redo (${MOD_KEY}+Y)`}
        className={BTN_CLS}
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
