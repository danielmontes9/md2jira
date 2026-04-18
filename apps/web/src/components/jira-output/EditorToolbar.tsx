import { useState, useCallback, useEffect, useRef } from 'react'
import { MOD_KEY } from '../../utils/keyboard.js'
import { type DropKey, BTN_CLS } from './toolbar/shared.js'
import { TextStyleMenu, FormatMenu } from './toolbar/FormatMenus.js'
import { ListsMenu, ColorMenu, EmojiMenu, InsertMenu } from './toolbar/ContentMenus.js'
import { IconCodeBrackets, IconUndo, IconRedo } from '../icons.js'

interface EditorToolbarProps {
  exec: (cmd: string, arg?: string) => void
  insertHtml: (html: string) => void
  activeBlock: string
  activeFormats: Set<string>
}

/**
 * WYSIWYG editor toolbar. Commands are delegated to the parent's exec/insertHtml
 * callbacks which route to TipTap chain commands.
 */
export function EditorToolbar({
  exec,
  insertHtml,
  activeBlock,
  activeFormats,
}: EditorToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [openKey, setOpenKey] = useState<DropKey | null>(null)

  const open = useCallback((key: DropKey) => {
    setOpenKey(key)
  }, [])
  const close = useCallback(() => setOpenKey(null), [])

  // Close dropdowns when clicking outside the toolbar
  useEffect(() => {
    const ac = new AbortController()
    document.addEventListener(
      'mousedown',
      (e: MouseEvent) => {
        if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) close()
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [close])

  const menuProps = { exec, insertHtml, close, openKey, onOpen: open }

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      className="flex flex-wrap items-center gap-px border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <TextStyleMenu {...menuProps} activeBlock={activeBlock} />
      <FormatMenu {...menuProps} activeFormats={activeFormats} />
      <ListsMenu {...menuProps} />
      <ColorMenu {...menuProps} />

      <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Code snippet */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          insertHtml('<pre><code>// code here</code></pre><p><br></p>')
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
