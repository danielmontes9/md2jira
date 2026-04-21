import { MOD_KEY } from '../../../utils/keyboard.js'
import {
  type DropKey,
  type ToolbarMenuProps,
  DROP_CLS,
  DROP_ITEM_CLS,
  TEXT_STYLES,
  FORMAT_ITEMS,
  ToolbarDropdown,
  ChevronDown,
  CheckIcon,
} from './shared.js'

// ── Text Style Menu ──

interface TextStyleMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  activeBlock: string
}

export function TextStyleMenu({ exec, close, openKey, onOpen, activeBlock }: TextStyleMenuProps) {
  return (
    <ToolbarDropdown
      dropKey="textStyle"
      openKey={openKey}
      onOpen={onOpen}
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
      <div className={`${DROP_CLS} min-w-47.5`}>
        {TEXT_STYLES.map(({ label, tag, cls }) => {
          const isActive = activeBlock === tag.toLowerCase()
          return (
            <button
              key={tag}
              role="menuitem"
              aria-pressed={isActive}
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
  )
}

// ── Format Menu ──

interface FormatMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  activeFormats: Set<string>
}

export function FormatMenu({ exec, close, openKey, onOpen, activeFormats }: FormatMenuProps) {
  return (
    <ToolbarDropdown
      dropKey="format"
      openKey={openKey}
      onOpen={onOpen}
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
      <div className={`${DROP_CLS} min-w-53.75`}>
        {FORMAT_ITEMS.map(({ label, shortcut, iconCls, icon, cmd }) => {
          const isActive = activeFormats.has(cmd)
          return (
            <button
              key={label}
              role="menuitem"
              aria-pressed={isActive}
              onMouseDown={(e) => {
                e.preventDefault()
                exec(cmd)
                close()
              }}
              className={`${DROP_ITEM_CLS} justify-between ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
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
          role="menuitem"
          aria-pressed={activeFormats.has('code')}
          onMouseDown={(e) => {
            e.preventDefault()
            exec('toggleCode')
            close()
          }}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('code') ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
        >
          <span className="flex items-center gap-2">
            <span className="w-5 text-center font-mono text-xs">{'{}'}</span>
            Code
          </span>
          <span className="flex items-center gap-2">
            {activeFormats.has('code') && <CheckIcon />}
            <span className="text-xs text-neutral-400">{`${MOD_KEY}+Shift+M`}</span>
          </span>
        </button>
        <p className="mt-1.5 border-t border-neutral-100 px-4 pt-2 pb-1.5 text-[10px] leading-tight text-neutral-400 dark:border-neutral-800">
          Underline, subscript and superscript are editor-only — they serialize to HTML tags in
          exported Markdown.
        </p>
      </div>
    </ToolbarDropdown>
  )
}
