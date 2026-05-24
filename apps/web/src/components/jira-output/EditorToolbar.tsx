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
        const target = e.target as Element
        const inToolbar = toolbarRef.current?.contains(target) ?? false
        const inPortal = !!target.closest?.('[data-toolbar-portal]')
        if (!inToolbar && !inPortal) close()
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
      className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-white px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <TextStyleMenu {...menuProps} activeBlock={activeBlock} />

      <div className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Bold, Italic, Underline, Strikethrough — individual visible buttons like Jira */}
      {(
        [
          { cmd: 'bold', label: 'Bold', shortcut: `${MOD_KEY}+B`, icon: 'B', cls: 'font-bold' },
          { cmd: 'italic', label: 'Italic', shortcut: `${MOD_KEY}+I`, icon: 'I', cls: 'italic' },
          {
            cmd: 'underline',
            label: 'Underline',
            shortcut: `${MOD_KEY}+U`,
            icon: 'U',
            cls: 'underline',
          },
          {
            cmd: 'strikeThrough',
            label: 'Strikethrough',
            shortcut: `${MOD_KEY}+Shift+S`,
            icon: 'S',
            cls: 'line-through',
          },
        ] as const
      ).map(({ cmd, label, shortcut, icon, cls }) => (
        <button
          key={cmd}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            exec(cmd)
          }}
          title={`${label} (${shortcut})`}
          aria-label={`${label} (${shortcut})`}
          aria-pressed={activeFormats.has(cmd)}
          className={`${BTN_CLS} ${activeFormats.has(cmd) ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : ''}`}
        >
          <span className={`text-sm ${cls}`}>{icon}</span>
        </button>
      ))}

      {/* Inline code */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          exec('toggleCode')
        }}
        title={`Inline code (${MOD_KEY}+Shift+K)`}
        aria-label={`Inline code (${MOD_KEY}+Shift+K)`}
        aria-pressed={activeFormats.has('code')}
        className={`${BTN_CLS} ${activeFormats.has('code') ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : ''}`}
      >
        <span className="font-mono text-xs">{'{}'}</span>
      </button>

      <FormatMenu {...menuProps} activeFormats={activeFormats} />
      <ListsMenu {...menuProps} activeFormats={activeFormats} />
      <ColorMenu {...menuProps} activeColor={activeColor} />

      <div className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Code snippet */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          exec('toggleCodeBlock')
        }}
        title="Code snippet"
        aria-label="Code snippet"
        aria-pressed={activeBlock === 'pre'}
        className={`${BTN_CLS} ${activeBlock === 'pre' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' : ''}`}
      >
        <IconCodeBrackets />
      </button>

      <EmojiMenu {...menuProps} />
      <InsertMenu {...menuProps} insertHtml={insertHtml} />

      <div className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

      {/* Undo */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          exec('undo')
        }}
        title={`Undo (${MOD_KEY}+Z)`}
        aria-label={`Undo (${MOD_KEY}+Z)`}
        className={BTN_CLS}
      >
        <IconUndo />
      </button>

      {/* Redo */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          exec('redo')
        }}
        title={`Redo (${MOD_KEY}+Y)`}
        aria-label={`Redo (${MOD_KEY}+Y)`}
        className={BTN_CLS}
      >
        <IconRedo />
      </button>
    </div>
  )
})
