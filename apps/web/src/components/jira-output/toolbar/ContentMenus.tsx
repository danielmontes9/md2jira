import { useState, useDeferredValue, useEffect } from 'react'
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
import { IconListBullet } from '../../icons.js'

// ── Lists Menu ──

interface ListsMenuProps extends ToolbarMenuProps {
  openKey: DropKey | null
  onOpen: (key: DropKey) => void
  activeFormats: Set<string>
}

export function ListsMenu({ exec, close, openKey, onOpen, activeFormats }: ListsMenuProps) {
  return (
    <ToolbarDropdown
      dropKey="lists"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      trigger={
        <>
          <IconListBullet />
          <ChevronDown />
        </>
      }
    >
      <div className={DROP_CLS} style={{ minWidth: 215 }}>
        <button
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('insertUnorderedList')
            close()
          }}
          aria-pressed={activeFormats.has('insertUnorderedList')}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('insertUnorderedList') ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
        >
          <span>Bullet list</span>
          <span className="text-xs text-neutral-400">{`${MOD_KEY}+Shift+8`}</span>
        </button>
        <button
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('insertOrderedList')
            close()
          }}
          aria-pressed={activeFormats.has('insertOrderedList')}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('insertOrderedList') ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
        >
          <span>Numbered list</span>
          <span className="text-xs text-neutral-400">{`${MOD_KEY}+Shift+7`}</span>
        </button>
        <button
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            exec('toggleTaskList')
            close()
          }}
          aria-pressed={activeFormats.has('toggleTaskList')}
          className={`${DROP_ITEM_CLS} justify-between ${activeFormats.has('toggleTaskList') ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
        >
          <span>Task list</span>
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
  return (
    <ToolbarDropdown
      dropKey="color"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      menuRole="listbox"
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
            role="option"
            onMouseDown={(e) => {
              e.preventDefault()
              exec('foreColor')
              close()
            }}
            aria-selected={!activeColor}
            className="w-full rounded py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Remove color
          </button>
          <p className="mt-1.5 text-[10px] leading-tight text-neutral-400">
            Color is editor-only and won&apos;t appear in exported Markdown or Jira markup.
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

  const allEmojis = emojiData ? [...new Set(Object.values(emojiData).flat())] : []
  const filteredEmojis =
    emojiSearch && emojiData ? allEmojis.filter((em) => em.includes(deferredSearch)) : []

  return (
    <ToolbarDropdown
      dropKey="emoji"
      openKey={openKey}
      onOpen={onOpen}
      onClose={close}
      menuRole="dialog"
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
          aria-label="Search emojis"
          placeholder="Search..."
          value={emojiSearch}
          onChange={(e) => setEmojiSearch(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="mb-2 w-full rounded border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-800"
        />
        {emojiSearch ? (
          <div className="flex flex-wrap gap-0.5">
            {filteredEmojis.length === 0 ? (
              <p className="w-full py-2 text-center text-xs text-neutral-400">No emojis found</p>
            ) : (
              filteredEmojis.map((em, i) => (
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
              ))
            )}
          </div>
        ) : emojiData === null ? (
          <p className="py-2 text-center text-xs text-neutral-400">Loading...</p>
        ) : (
          Object.entries(emojiData).map(([cat, emojis]) => (
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
      trigger={
        <span className="font-bold rounded-full" title="Insert elements">
          +
        </span>
      }
    >
      <div className={DROP_CLS} style={{ minWidth: 265 }}>
        <button
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
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            insertHtml('<p>@mention</p>')
            close()
          }}
          className={DROP_ITEM_CLS}
        >
          <div className="text-left">
            <div>Mention</div>
            <div className="text-xs text-neutral-400">
              Insert plain-text @mention (not a structured Jira mention)
            </div>
          </div>
        </button>
        <button
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
