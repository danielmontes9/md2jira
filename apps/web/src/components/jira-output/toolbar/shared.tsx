import { useRef, useEffect, type ReactNode } from 'react'
import { MOD_KEY } from '../../../utils/keyboard.js'
import { IconChevronDown, IconCheckFill } from '../../icons.js'

// Re-export under the legacy names so consuming toolbar files don't need changes.
export { IconChevronDown as ChevronDown, IconCheckFill as CheckIcon }

// ── Types ──

export type DropKey = 'textStyle' | 'format' | 'lists' | 'color' | 'emoji' | 'insert'

export interface ToolbarMenuProps {
  exec: (cmd: string, arg?: string) => void
  close: () => void
}

// ── Constants ──

export const DROP_CLS =
  'absolute left-0 top-full z-50 mt-1 min-w-max rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900'

export const BTN_CLS =
  'relative flex h-7 items-center gap-0.5 rounded px-1.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 select-none'

export const DROP_ITEM_CLS =
  'flex w-full items-center px-4 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800'

export const TEXT_STYLES: { label: string; tag: string; cls: string }[] = [
  { label: 'Normal text', tag: 'p', cls: 'text-sm' },
  { label: 'Heading 1', tag: 'H1', cls: 'text-xl font-bold' },
  { label: 'Heading 2', tag: 'H2', cls: 'text-lg font-bold' },
  { label: 'Heading 3', tag: 'H3', cls: 'text-base font-bold' },
  { label: 'Heading 4', tag: 'H4', cls: 'text-sm font-bold' },
  { label: 'Heading 5', tag: 'H5', cls: 'text-xs font-bold' },
  { label: 'Heading 6', tag: 'H6', cls: 'text-xs font-semibold' },
]

type FormatItem = { label: string; shortcut: string; iconCls: string; icon: string; cmd: string }

export const FORMAT_ITEMS: FormatItem[] = [
  { label: 'Bold', shortcut: `${MOD_KEY}+B`, iconCls: 'font-bold', icon: 'B', cmd: 'bold' },
  { label: 'Italic', shortcut: `${MOD_KEY}+I`, iconCls: 'italic', icon: 'I', cmd: 'italic' },
  {
    label: 'Underline',
    shortcut: `${MOD_KEY}+U`,
    iconCls: 'underline',
    icon: 'U',
    cmd: 'underline',
  },
  {
    label: 'Strikethrough',
    shortcut: `${MOD_KEY}+Shift+S`,
    iconCls: 'line-through',
    icon: 'S',
    cmd: 'strikeThrough',
  },
  { label: 'Subscript', shortcut: `${MOD_KEY}+,`, iconCls: '', icon: 'X₁', cmd: 'subscript' },
  { label: 'Superscript', shortcut: `${MOD_KEY}+.`, iconCls: '', icon: 'X¹', cmd: 'superscript' },
  {
    label: 'Clear formatting',
    shortcut: `${MOD_KEY}+\\`,
    iconCls: '',
    icon: '✕',
    cmd: 'removeFormat',
  },
]

// ── Shared components ──

export function ToolbarDropdown({
  dropKey,
  openKey,
  onOpen,
  onClose,
  trigger,
  children,
  menuRole = 'menu',
  ariaLabel,
}: {
  dropKey: DropKey
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  onClose: () => void
  trigger: ReactNode
  children: ReactNode
  menuRole?: string
  ariaLabel?: string
}) {
  const isOpen = openKey === dropKey
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // When the dropdown opens via keyboard, focus the first interactive item.
  useEffect(() => {
    if (!isOpen || !menuRef.current) return
    const first = menuRef.current.querySelector<HTMLElement>(
      'button:not([aria-disabled="true"]), input[type="text"]'
    )
    const id = requestAnimationFrame(() => first?.focus())
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!menuRef.current) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      triggerRef.current?.focus()
      return
    }
    // Tab key: close the dropdown so focus leaves to the next toolbar button.
    // Without this, Tab would move focus inside the dropdown panel indefinitely,
    // trapping keyboard users (violates WCAG 2.1 SC 2.1.1).
    if (e.key === 'Tab') {
      onClose()
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          'button:not([aria-disabled="true"]):not([aria-hidden="true"]), input[type="text"]'
        )
      )
      if (items.length === 0) return
      const idx = items.findIndex((el) => el === document.activeElement)
      const next =
        e.key === 'ArrowDown'
          ? items[(idx + 1) % items.length]
          : items[(idx - 1 + items.length) % items.length]
      next?.focus()
    }
  }

  return (
    <div
      className="relative"
      data-toolbar
      onBlur={(e) => {
        const related = e.relatedTarget
        if (!(related instanceof Node) || !e.currentTarget.contains(related)) onClose()
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        onMouseDown={(e) => {
          e.preventDefault()
          if (isOpen) onClose()
          else onOpen(dropKey)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (isOpen) onClose()
            else onOpen(dropKey)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup={menuRole as React.AriaAttributes['aria-haspopup']}
        aria-label={ariaLabel}
        className={BTN_CLS}
      >
        {trigger}
      </button>
      {isOpen && (
        <div ref={menuRef} role={menuRole} onKeyDown={handleDropdownKeyDown}>
          {children}
        </div>
      )}
    </div>
  )
}
