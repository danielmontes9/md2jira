import { useState, useCallback, useEffect, useRef, memo } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
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
  activeColor: string | undefined
}

/**
 * WYSIWYG editor toolbar. Commands are delegated to the parent's exec/insertHtml
 * callbacks which route to TipTap chain commands.
 */
export const EditorToolbar = memo(function EditorToolbar({
  exec,
  insertHtml,
  activeBlock,
  activeFormats,
  activeColor,
}: EditorToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [openKey, setOpenKey] = useState<DropKey | null>(null)

  const open = useCallback((key: DropKey) => {
    setOpenKey(key)
  }, [])
  const close = useCallback(() => setOpenKey(null), [])

  // Arrow-key navigation between toolbar buttons (ARIA toolbar pattern).
  // Left/Right arrows move focus to the previous/next button; wraps around.
  const handleToolbarKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const toolbar = toolbarRef.current
    if (!toolbar) return
    const focusable = Array.from(toolbar.querySelectorAll<HTMLElement>('button:not([disabled])'))
    const idx = focusable.indexOf(document.activeElement as HTMLElement)
    if (idx === -1) return
    e.preventDefault()
    const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1
    focusable[(next + focusable.length) % focusable.length]?.focus()
  }, [])

  // Close dropdowns when clicking outside the toolbar, or when Escape is pressed.
  // The Escape handler satisfies WCAG 2.1 SC 1.3.1 — composite widgets must
  // allow keyboard users to dismiss opened sub-menus.
  useEffect(() => {
    const ac = new AbortController()
    document.addEventListener(
      'mousedown',
      (e: MouseEvent) => {
        if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) close()
      },
      { signal: ac.signal }
    )
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') close()
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [close])

  const menuProps = { exec, close, openKey, onOpen: open }

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text formatting"
      onKeyDown={handleToolbarKeyDown}
      className="flex flex-wrap items-center gap-px border-b border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <TextStyleMenu {...menuProps} activeBlock={activeBlock} />
      <FormatMenu {...menuProps} activeFormats={activeFormats} />
      <ListsMenu {...menuProps} activeFormats={activeFormats} />
      <ColorMenu {...menuProps} activeColor={activeColor} />

      <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Code snippet */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          exec('toggleCodeBlock')
        }}
        title="Code snippet"
        aria-pressed={activeBlock === 'pre'}
        className={`${BTN_CLS} ${activeBlock === 'pre' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
      >
        <IconCodeBrackets />
      </button>

      <EmojiMenu {...menuProps} />
      <InsertMenu {...menuProps} insertHtml={insertHtml} />

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
})
