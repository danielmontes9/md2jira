import { useState, useCallback, useEffect } from 'react'
import { MOD_KEY } from '../../utils/keyboard.js'
import { type DropKey, BTN_CLS } from './toolbar/shared.js'
import { TextStyleMenu, FormatMenu } from './toolbar/FormatMenus.js'
import { ListsMenu, ColorMenu, EmojiMenu, InsertMenu } from './toolbar/ContentMenus.js'
import { IconImage, IconCodeBrackets, IconUndo, IconRedo } from '../icons.js'

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
        <IconImage />
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
        <IconCodeBrackets />
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
        <IconUndo />
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
        <IconRedo />
      </button>
    </div>
  )
}
