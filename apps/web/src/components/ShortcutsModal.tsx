import { MOD_KEY } from '../utils/keyboard.js'
import { Modal, ModalCloseButton } from './Modal.js'
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
        { key: `${mod}+B`, label: t('scLabelBold') },
        { key: `${mod}+I`, label: t('scLabelItalic') },
        { key: `${mod}+K`, label: t('scLabelInsertLink') },
        { key: `${mod}+Shift+K`, label: t('scLabelInlineCode') },
        { key: `${mod}+Shift+X`, label: t('scLabelStrikethrough') },
      ],
    },
    {
      title: t('scGroupStructure'),
      shortcuts: [
        { key: `${mod}+Shift+H`, label: t('scLabelCycleHeading') },
        { key: `${mod}+Shift+L`, label: t('scLabelToggleBulletList') },
        { key: `${mod}+Shift+O`, label: t('scLabelToggleNumberedList') },
        { key: `${mod}+Shift+Q`, label: t('scLabelToggleBlockquote') },
        {
          key: `${mod}+Shift+C`,
          label: t('scLabelInsertCodeBlock'),
        },
        { key: `${mod}+Enter`, label: t('scLabelInsertBlankLine') },
      ],
    },
    {
      title: t('scGroupLines'),
      shortcuts: [
        { key: 'Alt+↑', label: t('scLabelMoveLineUp') },
        { key: 'Alt+↓', label: t('scLabelMoveLineDown') },
        { key: `${mod}+D`, label: t('scLabelDuplicateLine') },
      ],
    },
    {
      title: t('scGroupEditor'),
      shortcuts: [
        { key: 'Tab', label: t('scLabelIndent') },
        { key: 'Shift+Tab', label: t('scLabelDedent') },
        { key: '↵ Enter', label: t('scLabelAutoContinueList') },
        {
          key: `${mod}+S`,
          label: historyEnabled ? t('scLabelSaveHistory') : t('scLabelSaveHistoryDisabled'),
        },
      ],
    },
    {
      title: t('scGroupOutputFormat'),
      shortcuts: [
        { key: 'Alt+Shift+A', label: t('scLabelSwitchAdf') },
        { key: 'Alt+Shift+W', label: t('scLabelSwitchWiki') },
        { key: 'Alt+H', label: t('scLabelToggleHistory') },
        { key: 'Alt+N', label: t('scLabelNewDocument') },
      ],
    },
    {
      title: t('scGroupWysiwyg'),
      shortcuts: [
        { key: `${mod}+B`, label: t('scLabelBold') },
        { key: `${mod}+I`, label: t('scLabelItalic') },
        { key: `${mod}+U`, label: t('scLabelUnderline') },
        { key: `${mod}+Shift+S`, label: t('scLabelStrikethrough') },
        { key: `${mod}+E`, label: t('scLabelInlineCode') },
        { key: `${mod}+Z`, label: t('scLabelUndo') },
        { key: `${mod}+Shift+Z`, label: t('scLabelRedo') },
        { key: `${mod}+Shift+7`, label: t('scLabelOrderedList') },
        { key: `${mod}+Shift+8`, label: t('scLabelBulletList') },
        { key: `${mod}+Shift+9`, label: t('scLabelBlockquote') },
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
          <ModalCloseButton
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            aria-label={t('closeShortcutsModal')}
          >
            <IconClose className="h-4.5 w-4.5" />
          </ModalCloseButton>
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
