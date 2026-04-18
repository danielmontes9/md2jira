import type { OutputFormat } from '../../types.js'

/** Shared Copy + Edit toggle button group — rendered in the JiraOutput header. */
export function CopyEditGroup({
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
  return (
    <div
      role="group"
      aria-label="Copy and edit"
      className={`flex rounded-md border border-neutral-300 text-xs dark:border-neutral-600 ${className ?? ''}`}
    >
      <button
        onClick={onCopy}
        aria-live="polite"
        title={
          format === 'adf' ? 'Copy as rich text for Jira Cloud' : 'Copy Wiki Markup to clipboard'
        }
        className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {copied ? 'Copied!' : 'Copy for Jira'}
      </button>
      {canEdit && (
        <button
          onClick={onToggleEdit}
          title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
          aria-pressed={editMode}
          className={`whitespace-nowrap rounded-r-md border-l px-3 py-1 font-medium transition-colors ${
            editMode
              ? 'border-l-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-l-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900'
              : 'border-l-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          {editMode ? 'View' : 'Edit'}
        </button>
      )}
    </div>
  )
}
