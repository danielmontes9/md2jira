import { useState } from 'react'
// TEXT_COLORS and EMOJI_CATEGORIES are static data co-located in the lazy
// EditorToolbar chunk. They are NOT in the initial bundle because EditorToolbar
// is lazy-loaded via React.lazy — these constants only load on first render.
import { TEXT_COLORS, EMOJI_CATEGORIES } from '../constants.js'
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
}

export function ListsMenu({ exec, insertHtml, close, openKey, onOpen }: ListsMenuProps) {
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
          className={`${DROP_ITEM_CLS} justify-between`}
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
          className={`${DROP_ITEM_CLS} justify-between`}
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
          className={`${DROP_ITEM_CLS} justify-between`}
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
}

export function ColorMenu({ exec, close, openKey, onOpen }: ColorMenuProps) {
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
              className="h-6 w-6 rounded border border-neutral-300 transition-transform hover:scale-110 dark:border-neutral-600"
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
            className="w-full rounded py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Remove color
          </button>
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
            {[...new Set(Object.values(EMOJI_CATEGORIES).flat())]
              .filter((em) => em.includes(emojiSearch))
              .map((em, i) => (
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
              ))}
          </div>
        ) : (
          Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
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
            <div className="text-xs text-neutral-400">Mention someone to notify them</div>
          </div>
        </button>
        <button
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault()
            insertHtml(
              '<table style="border-collapse:collapse;width:100%">' +
                '<tr><th style="border:1px solid #dfe1e6;padding:6px 8px;background:#f4f5f7">Column 1</th><th style="border:1px solid #dfe1e6;padding:6px 8px;background:#f4f5f7">Column 2</th></tr>' +
                '<tr><td style="border:1px solid #dfe1e6;padding:6px 8px">&nbsp;</td><td style="border:1px solid #dfe1e6;padding:6px 8px">&nbsp;</td></tr>' +
                '</table><p><br></p>'
            )
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
            insertHtml(
              '<div style="background:#deebff;border-left:4px solid #0052cc;border-radius:4px;padding:8px 12px;margin:4px 0"><p>ℹ️ Info panel</p></div><p><br></p>'
            )
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
            insertHtml(
              '<blockquote style="border-left:3px solid #dfe1e6;margin:4px 0;padding:4px 12px;color:#5e6c84"><p>Quote here</p></blockquote><p><br></p>'
            )
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
            insertHtml(
              '<div style="background:#fffae6;border-left:4px solid #ff991f;border-radius:4px;padding:8px 12px;margin:4px 0"><p>&lt;&gt; Decision: </p></div><p><br></p>'
            )
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
