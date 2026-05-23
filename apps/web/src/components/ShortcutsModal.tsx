import { MOD_KEY } from '../utils/keyboard.js'
import { Modal } from './Modal.js'
import { IconClose } from './icons.js'
import { useSettings } from '../context/SettingsContext.js'
import { useT } from '../i18n/index.js'
import type { StringKey } from '../i18n/index.js'

interface ShortcutsModalProps {
  onClose: () => void
}

const mod = MOD_KEY

function buildGroups(t: (key: StringKey) => string, historyEnabled: boolean) {
  return [
    {
      title: t('scGroupFormatting'),
      shortcuts: [
        { key: `${mod}+B`, label: 'Bold' },
        { key: `${mod}+I`, label: 'Italic' },
        { key: `${mod}+K`, label: 'Insert link' },
        { key: `${mod}+Shift+K`, label: 'Inline code' },
        { key: `${mod}+Shift+X`, label: 'Strikethrough' },
      ],
    },
    {
      title: t('scGroupStructure'),
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
      title: t('scGroupLines'),
      shortcuts: [
        { key: 'Alt+↑', label: 'Move line up' },
        { key: 'Alt+↓', label: 'Move line down' },
        { key: `${mod}+D`, label: 'Duplicate line' },
      ],
    },
    {
      title: t('scGroupEditor'),
      shortcuts: [
        { key: 'Tab', label: 'Indent (2 spaces)' },
        { key: 'Shift+Tab', label: 'Dedent (remove 2 spaces)' },
        { key: '↵ Enter', label: 'Auto-continue list item' },
        {
          key: `${mod}+S`,
          label: historyEnabled ? 'Save to history' : 'Save to history (enable in Settings)',
        },
      ],
    },
    {
      title: t('scGroupOutputFormat'),
      shortcuts: [
        { key: 'Alt+Shift+A', label: 'Switch to Jira Cloud (ADF)' },
        { key: 'Alt+Shift+W', label: 'Switch to Wiki Markup' },
        { key: 'Alt+H', label: 'Toggle document history' },
        { key: 'Alt+N', label: 'New document (saves to history first)' },
      ],
    },
    {
      title: t('scGroupWysiwyg'),
      shortcuts: [
        { key: `${mod}+B`, label: 'Bold' },
        { key: `${mod}+I`, label: 'Italic' },
        { key: `${mod}+U`, label: 'Underline' },
        { key: `${mod}+Shift+S`, label: 'Strikethrough' },
        { key: `${mod}+E`, label: 'Inline code' },
        { key: `${mod}+Z`, label: 'Undo' },
        { key: `${mod}+Shift+Z`, label: 'Redo' },
        { key: `${mod}+Shift+7`, label: 'Ordered list' },
        { key: `${mod}+Shift+8`, label: 'Bullet list' },
        { key: `${mod}+Shift+9`, label: 'Blockquote' },
      ],
    },
  ]
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const { historyEnabled } = useSettings()
  const t = useT()
  const groups = buildGroups(t, historyEnabled)

  return (
    <Modal onClose={onClose} ariaLabelledBy="shortcuts-modal-title">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="shortcuts-modal-title"
            className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            {t('keyboardShortcutsTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            aria-label={t('closeShortcutsModal')}
          >
            <IconClose className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-5">
          {groups.map((group) => (
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
