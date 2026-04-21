import { MOD_KEY } from '../utils/keyboard.js'
import { Modal } from './Modal.js'
import { IconClose } from './icons.js'

interface ShortcutsModalProps {
  onClose: () => void
}

const mod = MOD_KEY

const GROUPS = [
  {
    title: 'Formatting',
    shortcuts: [
      { key: `${mod}+B`, label: 'Bold' },
      { key: `${mod}+I`, label: 'Italic' },
      { key: `${mod}+K`, label: 'Insert link' },
      { key: `${mod}+Shift+K`, label: 'Inline code' },
      { key: `${mod}+Shift+X`, label: 'Strikethrough' },
    ],
  },
  {
    title: 'Structure',
    shortcuts: [
      { key: `${mod}+Shift+H`, label: 'Cycle heading (h1 → h2 → h3 → none)' },
      { key: `${mod}+Shift+L`, label: 'Toggle bullet list' },
      { key: `${mod}+Shift+O`, label: 'Toggle numbered list' },
      { key: `${mod}+Shift+Q`, label: 'Toggle blockquote' },
      {
        key: `${mod}+Shift+C`,
        label: 'Insert code block ⚠ may conflict with DevTools on Chrome/Edge',
      },
      { key: `${mod}+Enter`, label: 'Insert blank line below' },
    ],
  },
  {
    title: 'Lines',
    shortcuts: [
      { key: 'Alt+↑', label: 'Move line up' },
      { key: 'Alt+↓', label: 'Move line down' },
      { key: `${mod}+D`, label: 'Duplicate line' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { key: 'Tab', label: 'Indent (2 spaces)' },
      { key: '↵ Enter', label: 'Auto-continue list item' },
    ],
  },
]

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <Modal onClose={onClose} ariaLabelledBy="shortcuts-modal-title">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="shortcuts-modal-title"
            className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Close shortcuts panel"
          >
            <IconClose className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {group.title}
              </h3>
              <table className="w-full">
                <tbody>
                  {group.shortcuts.map(({ key, label }) => (
                    <tr
                      key={key}
                      className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                    >
                      <td className="py-1.5 pr-4 text-sm text-neutral-700 dark:text-neutral-300">
                        {label}
                      </td>
                      <td className="py-1.5 text-right">
                        <kbd className="inline-block rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {key}
                        </kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
