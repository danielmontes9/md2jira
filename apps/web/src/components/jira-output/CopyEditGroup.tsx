import { memo } from 'react'
import type { OutputFormat } from '../../types.js'
import { useT } from '../../i18n/index.js'

/** Shared Copy + Edit toggle button group — rendered in the JiraOutput header. */
export const CopyEditGroup = memo(function CopyEditGroup({
  copied,
  editMode,
  canEdit,
  format,
  onCopy,
  onToggleEdit,
  className,
}: {
  copied: boolean
  editMode: boolean
  canEdit: boolean
  format: OutputFormat
  onCopy: () => void
  onToggleEdit: () => void
  className?: string
}) {
  const t = useT()
  return (
    <div
      role="group"
      aria-label={t('copyAndEditGroup')}
      className={`flex rounded-md border border-neutral-300 text-xs dark:border-neutral-600 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={onCopy}
        aria-label={
          copied ? t('copied') : format === 'adf' ? t('copyRichText') : t('copyWikiMarkup')
        }
        title={format === 'adf' ? t('copyRichText') : t('copyWikiMarkup')}
        className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
      >
        {copied ? t('copied') : t('copyForJira')}
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={onToggleEdit}
          title={editMode ? t('switchToViewMode') : t('switchToEditMode')}
          aria-pressed={editMode}
          className={`whitespace-nowrap rounded-r-md border-l px-3 py-1 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
            editMode
              ? 'border-l-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-l-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900'
              : 'border-l-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          {editMode ? t('viewToggle') : t('editToggle')}
        </button>
      )}
      {/* Visually hidden live region — announces copy confirmation to screen readers
          without relying on AT re-reading a changed aria-label on a focused button. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t('copiedToClipboard') : ''}
      </span>
    </div>
  )
})
