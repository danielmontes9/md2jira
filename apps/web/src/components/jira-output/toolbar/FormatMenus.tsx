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
import { useT } from '../../../i18n/index.js'
import type { StringKey } from '../../../i18n/index.js'

// ── Text Style Menu ──

interface TextStyleMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  activeBlock: string
}

const TAG_LABEL_KEY: Record<string, StringKey> = {
  p: 'wysiwygNormalText',
  h1: 'wysiwygHeading1',
  h2: 'wysiwygHeading2',
  h3: 'wysiwygHeading3',
  h4: 'wysiwygHeading4',
  h5: 'wysiwygHeading5',
  h6: 'wysiwygHeading6',
}

export function TextStyleMenu({ exec, close, openKey, onOpen, activeBlock }: TextStyleMenuProps) {
  const t = useT()
  const currentLabel = t(TAG_LABEL_KEY[activeBlock] ?? 'wysiwygNormalText')
  return (
    <ToolbarDropdown
      dropKey="textStyle"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      ariaLabel={t('wysiwygTextStyles')}
      trigger={
        <>
          <span className="max-w-24 truncate font-medium" aria-hidden>
            {currentLabel}
          </span>
          <ChevronDown />
        </>
      }
    >
      <div className={`${DROP_CLS} min-w-47.5`}>
        {TEXT_STYLES.map(({ tag, cls }) => {
          const isActive = activeBlock === tag.toLowerCase()
          const styleLabel = t(TAG_LABEL_KEY[tag.toLowerCase()] ?? 'wysiwygNormalText')
          return (
            <button
              type="button"
              key={tag}
              role="menuitemcheckbox"
              aria-checked={isActive}
              onMouseDown={(e) => {
                e.preventDefault()
                exec('formatBlock', tag)
                close()
              }}
              className={`flex w-full items-center justify-between px-4 py-1.5 text-left transition-colors duration-75 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${cls} ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : ''}`}
            >
              <span>{styleLabel}</span>
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

const CMD_LABEL_KEY: Record<string, StringKey> = {
  subscript: 'wysiwygSubscript',
  superscript: 'wysiwygSuperscript',
  removeFormat: 'wysiwygClearFormatting',
}

export function FormatMenu({ exec, close, openKey, onOpen, activeFormats }: FormatMenuProps) {
  const t = useT()
  // Only the less-common formats live in this "more" dropdown.
  // Bold / Italic / Underline / Strikethrough are now individual toolbar buttons.
  const EXTRA_ITEMS = FORMAT_ITEMS.filter((f) =>
    ['subscript', 'superscript', 'removeFormat'].includes(f.cmd)
  )
  return (
    <ToolbarDropdown
      dropKey="format"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      ariaLabel={t('wysiwygMoreFormatting')}
      trigger={
        <span className="text-sm font-medium tracking-widest" aria-hidden>
          ···
        </span>
      }
    >
      <div className={`${DROP_CLS} min-w-53.75`}>
        {EXTRA_ITEMS.map(({ shortcut, iconCls, icon, cmd }) => {
          const isActive = activeFormats.has(cmd)
          const label = t(CMD_LABEL_KEY[cmd]!)
          return (
            <button
              type="button"
              key={cmd}
              role="menuitemcheckbox"
              aria-checked={isActive}
              onMouseDown={(e) => {
                e.preventDefault()
                exec(cmd)
                close()
              }}
              className={`${DROP_ITEM_CLS} justify-between ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : ''}`}
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
        <p className="mt-1.5 border-t border-neutral-100 px-4 pt-2 pb-1.5 text-[10px] leading-tight text-neutral-400 dark:border-neutral-800">
          {t('wysiwygSubSupNote')}
        </p>
      </div>
    </ToolbarDropdown>
  )
}
