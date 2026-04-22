import { memo } from 'react'
import type { OutputFormat, ViewMode } from '../../types.js'
import { CopyEditGroup } from './CopyEditGroup.js'

/** Returns the correct className for a toggle-group button. */
function toggleBtnCls(active: boolean, side: 'left' | 'right'): string {
  const radius = side === 'left' ? 'rounded-l-md' : 'rounded-r-md'
  const base = `flex-1 whitespace-nowrap ${radius} px-2 py-1 transition-colors @[460px]:flex-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500`
  return active
    ? `${base} bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100`
    : `${base} text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200`
}

interface JiraOutputHeaderProps {
  format: OutputFormat
  viewMode: ViewMode
  isPending?: boolean | undefined
  onFormatChange: (format: OutputFormat) => void
  onViewModeChange: (mode: ViewMode) => void
  canEdit: boolean
  editMode: boolean
  copied: boolean
  onCopy: () => void
  onToggleEdit: () => void
}

/**
 * Header bar for the JiraOutput panel.
 *
 * Contains format and view-mode toggles on the left and the copy/edit
 * button group on the right. Extracted from JiraOutput to keep the parent
 * component focused on state management and content rendering.
 */
export const JiraOutputHeader = memo(function JiraOutputHeader({
  format,
  viewMode,
  isPending,
  onFormatChange,
  onViewModeChange,
  canEdit,
  editMode,
  copied,
  onCopy,
  onToggleEdit,
}: JiraOutputHeaderProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-neutral-200 px-3 py-2 @[460px]:flex @[460px]:flex-row @[460px]:justify-between @[460px]:px-4 dark:border-neutral-800">
      <div className="flex flex-col gap-2 @[460px]:flex-row @[460px]:items-center @[460px]:gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Output
          {isPending && (
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-neutral-600 dark:border-t-neutral-300"
              aria-label="Converting..."
            />
          )}
        </span>
        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Output format"
            className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
          >
            <button
              type="button"
              onClick={() => onFormatChange('adf')}
              role="radio"
              aria-checked={format === 'adf'}
              tabIndex={format === 'adf' ? 0 : -1}
              className={toggleBtnCls(format === 'adf', 'left')}
            >
              Jira Cloud
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('wiki')}
              role="radio"
              aria-checked={format === 'wiki'}
              tabIndex={format === 'wiki' ? 0 : -1}
              className={toggleBtnCls(format === 'wiki', 'right')}
            >
              Wiki Markup
            </button>
          </div>
          {format === 'adf' && (
            <div
              role="radiogroup"
              aria-label="View mode"
              className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
            >
              <button
                type="button"
                onClick={() => onViewModeChange('preview')}
                role="radio"
                aria-checked={viewMode === 'preview'}
                tabIndex={viewMode === 'preview' ? 0 : -1}
                className={toggleBtnCls(viewMode === 'preview', 'left')}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('code')}
                role="radio"
                aria-checked={viewMode === 'code'}
                tabIndex={viewMode === 'code' ? 0 : -1}
                className={toggleBtnCls(viewMode === 'code', 'right')}
              >
                Code
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Single CopyEditGroup — grid col 2 on mobile, flex end on desktop */}
      <CopyEditGroup
        copied={copied}
        editMode={editMode}
        canEdit={canEdit}
        format={format}
        onCopy={onCopy}
        onToggleEdit={onToggleEdit}
      />
    </div>
  )
})
