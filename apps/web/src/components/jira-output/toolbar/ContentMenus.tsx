import { useState, useDeferredValue, useEffect, useMemo } from 'react'
// TEXT_COLORS is static data co-located in the lazy
// EditorToolbar chunk. It is NOT in the initial bundle because EditorToolbar
// is lazy-loaded via React.lazy — this constant only loads on first render.
import { TEXT_COLORS } from '../constants.js'
import { INFO_PANEL_HTML, DECISION_PANEL_HTML } from './templates.js'
import { MOD_KEY } from '../../../utils/keyboard.js'
import {
  type DropKey,
  type ToolbarMenuProps,
  DROP_CLS,
  DROP_ITEM_CLS,
  ToolbarDropdown,
  ChevronDown,
} from './shared.js'
import { IconListBullet, IconListOrdered, IconListChecks, IconTable } from '../../icons.js'
import { useT } from '../../../i18n/index.js'

// ── Lists Menu ──

interface ListsMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  activeFormats: Set<string>
}

export function ListsMenu({ exec, close, openKey, onOpen, activeFormats }: ListsMenuProps) {
  const t = useT()
  return (
    <ToolbarDropdown
      dropKey="lists"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      ariaLabel="Lists"
      trigger={
        <>
          <IconListBullet aria-hidden />
          <ChevronDown />
        </>
      }
    >
      <div className={`${DROP_CLS} min-w-53.75`}>
        <button
          type="button"
          role="menuitemcheckbox"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('insertUnorderedList')
            close()
          }}
          aria-checked={activeFormats.has('insertUnorderedList')}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('insertUnorderedList') ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : ''}`}
        >
          <span className="flex items-center gap-2">
            <IconListBullet className="h-3.5 w-3.5 shrink-0" />
            {t('wysiwygBulletList')}
          </span>
          <span className="text-xs text-neutral-400">{`${MOD_KEY}+Shift+8`}</span>
        </button>
        <button
          type="button"
          role="menuitemcheckbox"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('insertOrderedList')
            close()
          }}
          aria-checked={activeFormats.has('insertOrderedList')}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('insertOrderedList') ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : ''}`}
        >
          <span className="flex items-center gap-2">
            <IconListOrdered className="h-3.5 w-3.5 shrink-0" />
            {t('wysiwygNumberedList')}
          </span>
          <span className="text-xs text-neutral-400">{`${MOD_KEY}+Shift+7`}</span>
        </button>
        <button
          type="button"
          role="menuitemcheckbox"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('toggleTaskList')
            close()
          }}
          aria-checked={activeFormats.has('toggleTaskList')}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('toggleTaskList') ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : ''}`}
        >
          <span className="flex items-center gap-2">
            <IconListChecks className="h-3.5 w-3.5 shrink-0" />
            {t('wysiwygTaskList')}
          </span>
          <span className="text-xs text-neutral-400">{`${MOD_KEY}+Shift+6`}</span>
        </button>
      </div>
    </ToolbarDropdown>
  )
}

// ── Color Menu ──

interface ColorMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  activeColor: string | undefined
}

export function ColorMenu({ exec, close, openKey, onOpen, activeColor }: ColorMenuProps) {
  const t = useT()
  return (
    <ToolbarDropdown
      dropKey="color"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      menuRole="listbox"
      ariaLabel="Text color"
      trigger={
        <span
          className="relative select-none font-bold leading-none"
          aria-hidden
          style={activeColor ? { color: activeColor } : undefined}
        >
          A
          <span
            className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded"
            style={{ background: activeColor ?? '#2563eb' }}
          />
        </span>
      }
    >
      <div className={`${DROP_CLS} p-3 min-w-55.5`}>
        <div className="grid grid-cols-7 gap-1">
          {TEXT_COLORS.map((color) => (
            <button
              type="button"
              key={color}
              role="option"
              onMouseDown={(e) => {
                e.preventDefault()
                exec('foreColor', color)
                close()
              }}
              aria-selected={color === activeColor}
              className={`h-6 w-6 rounded border transition-transform hover:scale-110 ${
                color === activeColor
                  ? 'border-blue-500 ring-2 ring-blue-400 ring-offset-1 dark:border-blue-400'
                  : 'border-neutral-300 dark:border-neutral-600'
              }`}
              style={{ background: color }}
              title={color}
              aria-label={color}
            />
          ))}
        </div>
        <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <button
            type="button"
            role="option"
            onMouseDown={(e) => {
              e.preventDefault()
              exec('foreColor')
              close()
            }}
            aria-selected={!activeColor}
            className="w-full rounded py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {t('wysiwygRemoveColor')}
          </button>
          <p className="mt-1.5 text-[10px] leading-tight text-neutral-400">
            {t('wysiwygColorNote')}
          </p>
        </div>
      </div>
    </ToolbarDropdown>
  )
}

// ── Emoji Menu ──

interface EmojiMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
}

export function EmojiMenu({ exec, close, openKey, onOpen }: EmojiMenuProps) {
  const [emojiSearch, setEmojiSearch] = useState('')
  const deferredSearch = useDeferredValue(emojiSearch)
  const t = useT()

  // Lazy-load emoji data only when the picker first opens
  type EmojiCategoriesData = Record<string, readonly string[]>
  const [emojiData, setEmojiData] = useState<EmojiCategoriesData | null>(null)
  const isOpen = openKey === 'emoji'
  useEffect(() => {
    if (!isOpen || emojiData !== null) return
    import('../emoji-data.js')
      .then((m) => setEmojiData(m.EMOJI_CATEGORIES as EmojiCategoriesData))
      .catch(() => setEmojiData({}))
  }, [isOpen, emojiData])

  const allEmojis = useMemo(
    () => (emojiData ? [...new Set(Object.values(emojiData).flat())] : []),
    [emojiData]
  )
  // Search by category name (case-insensitive). Falls back to exact emoji
  // character match so pasting an emoji into the field still finds it.
  const filteredEmojis = useMemo(() => {
    if (!deferredSearch || !emojiData) return []
    const q = deferredSearch.toLowerCase()
    const fromCategories: string[] = []
    for (const [cat, emojis] of Object.entries(emojiData)) {
      if (cat.toLowerCase().includes(q)) fromCategories.push(...emojis)
    }
    if (fromCategories.length > 0) return [...new Set(fromCategories)]
    // Exact emoji character fallback (user pasted an emoji into the field)
    return allEmojis.filter((em) => em === deferredSearch)
  }, [deferredSearch, emojiData, allEmojis])

  return (
    <ToolbarDropdown
      dropKey="emoji"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      menuRole="dialog"
      ariaLabel="Emoji"
      trigger={
        <span className="text-base leading-none" aria-hidden>
          ☺
        </span>
      }
    >
      <div className={`${DROP_CLS} p-2 min-w-70 max-h-75 overflow-y-auto`}>
        <input
          type="text"
          aria-label={t('wysiwygSearchEmojis')}
          placeholder={t('wysiwygEmojiPlaceholder')}
          value={emojiSearch}
          onChange={(e) => setEmojiSearch(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="mb-2 w-full rounded border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-800"
        />
        {deferredSearch ? (
          <div className="flex flex-wrap gap-0.5">
            {filteredEmojis.length === 0 ? (
              <p className="w-full py-2 text-center text-xs text-neutral-400">
                {t('wysiwygNoEmojis')}
              </p>
            ) : (
              filteredEmojis.map((em) => (
                <button
                  type="button"
                  key={em}
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
              ))
            )}
          </div>
        ) : emojiData === null ? (
          <p className="py-2 text-center text-xs text-neutral-400">{t('wysiwygLoading')}</p>
        ) : (
          Object.entries(emojiData).map(([cat, emojis]) => (
            <div key={cat} className="mb-2">
              <div className="mb-1 text-xs font-semibold text-neutral-400">{cat}</div>
              <div className="flex flex-wrap gap-0.5">
                {emojis.map((em) => (
                  <button
                    type="button"
                    key={em}
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
  )
}

// ── Insert Menu ──

interface InsertMenuProps extends ToolbarMenuProps {
  insertHtml: (html: string) => void
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
}

export function InsertMenu({ exec, insertHtml, close, openKey, onOpen }: InsertMenuProps) {
  return (
    <ToolbarDropdown
      dropKey="insert"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      ariaLabel="Insert elements"
      trigger={
        <>
          <span className="text-sm font-bold leading-none" aria-hidden>
            +
          </span>
          <ChevronDown />
        </>
      }
    >
      <div className={`${DROP_CLS} min-w-66.25`}>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('toggleTaskList')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Action item</div>
            <div className="text-xs text-neutral-400">Create and assign action items</div>
          </div>
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            insertHtml('<p>@</p>')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Mention</div>
            <div className="text-xs text-neutral-400">
              Insert @mention — cursor lands after the @ symbol
            </div>
          </div>
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('insertTable')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Table</div>
            <div className="text-xs text-neutral-400">Insert a table</div>
          </div>
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            insertHtml(INFO_PANEL_HTML)
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Info panel</div>
            <div className="text-xs text-neutral-400">Highlight information in a color panel</div>
          </div>
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('toggleBlockquote')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Quote</div>
            <div className="text-xs text-neutral-400">Insert a quote or reference</div>
          </div>
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            insertHtml(DECISION_PANEL_HTML)
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Decision</div>
            <div className="text-xs text-neutral-400">Capture decisions to track them</div>
          </div>
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('insertHorizontalRule')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Divider</div>
            <div className="text-xs text-neutral-400">Insert a dividing line</div>
          </div>
        </button>
      </div>
    </ToolbarDropdown>
  )
}

// ── Table Menu ──

interface TableMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  isInTable: boolean
}

export function TableMenu({ exec, close, openKey, onOpen, isInTable }: TableMenuProps) {
  const t = useT()
  if (!isInTable) return null
  return (
    <ToolbarDropdown
      dropKey="table"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      ariaLabel={t('wysiwygTableOptions')}
      trigger={
        <>
          <IconTable aria-hidden />
          <ChevronDown />
        </>
      }
    >
      <div className={`${DROP_CLS} min-w-44`}>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('addRowAfter')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          {t('wysiwygTableAddRowBelow')}
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('addRowBefore')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          {t('wysiwygTableAddRowAbove')}
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('addColumnAfter')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          {t('wysiwygTableAddColRight')}
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('addColumnBefore')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          {t('wysiwygTableAddColLeft')}
        </button>
        <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('deleteRow')
            close()
          }}
          className={`${DROP_ITEM_CLS} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
        >
          {t('wysiwygTableDeleteRow')}
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('deleteColumn')
            close()
          }}
          className={`${DROP_ITEM_CLS} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
        >
          {t('wysiwygTableDeleteCol')}
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('deleteTable')
            close()
          }}
          className={`${DROP_ITEM_CLS} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
        >
          {t('wysiwygTableDelete')}
        </button>
      </div>
    </ToolbarDropdown>
  )
}
