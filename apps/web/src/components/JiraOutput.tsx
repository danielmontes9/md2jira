import { useState, memo, lazy, Suspense } from 'react'
import { useWysiwygEditor } from '../hooks/useWysiwygEditor.js'
import { useJiraCopy } from '../hooks/useJiraCopy.js'
import { CopyEditGroup } from './jira-output/CopyEditGroup.js'
const EditorToolbar = lazy(() =>
  import('./jira-output/EditorToolbar.js').then((m) => ({ default: m.EditorToolbar }))
)
import './jira-output/jira-preview.css'
import type { OutputFormat, ViewMode } from '../types.js'

interface JiraOutputProps {
  value: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
  previewHtml: string
  isPending?: boolean
  onMarkdownChange?: (md: string) => void
}

export const JiraOutput = memo(function JiraOutput({
  value,
  format,
  onFormatChange,
  previewHtml,
  isPending,
  onMarkdownChange,
}: JiraOutputProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [editMode, setEditMode] = useState(false)

  const { editorRef, activeBlock, activeFormats, exec, insertHtml, saveRange } = useWysiwygEditor({
    previewHtml,
    onMarkdownChange,
  })

  const { copied, handleCopy } = useJiraCopy(value, format, editorRef)

  const canEdit =
    import.meta.env.VITE_ENABLE_WYSIWYG !== 'false' &&
    format === 'adf' &&
    viewMode === 'preview' &&
    !!onMarkdownChange
  const showToolbar = canEdit && editMode

  return (
    <div className="@container flex min-h-0 flex-1 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* ── Header bar ──
           Mobile:  CSS grid 2-cols → [Output + toggles] | [CopyEditGroup]
           Desktop: flex-row justify-between (same visual result, one DOM instance)
      */}
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
              role="group"
              aria-label="Output format"
              className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
            >
              <button
                onClick={() => onFormatChange('adf')}
                aria-pressed={format === 'adf'}
                className={`flex-1 whitespace-nowrap rounded-l-md px-2 py-1 transition-colors @[460px]:flex-none ${format === 'adf' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Jira Cloud
              </button>
              <button
                onClick={() => onFormatChange('wiki')}
                aria-pressed={format === 'wiki'}
                className={`flex-1 whitespace-nowrap rounded-r-md px-2 py-1 transition-colors @[460px]:flex-none ${format === 'wiki' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Wiki Markup
              </button>
            </div>
            <div
              role="group"
              aria-label="View mode"
              className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
            >
              <button
                onClick={() => setViewMode('preview')}
                aria-pressed={viewMode === 'preview'}
                className={`flex-1 whitespace-nowrap rounded-l-md px-2 py-1 transition-colors @[460px]:flex-none ${viewMode === 'preview' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                aria-pressed={viewMode === 'code'}
                className={`flex-1 whitespace-nowrap rounded-r-md px-2 py-1 transition-colors @[460px]:flex-none ${viewMode === 'code' ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
              >
                Code
              </button>
            </div>
          </div>
        </div>
        {/* Single CopyEditGroup — grid col 2 on mobile, flex end on desktop */}
        <CopyEditGroup
          copied={copied}
          editMode={editMode}
          canEdit={canEdit}
          onCopy={handleCopy}
          onToggleEdit={() => setEditMode((v) => !v)}
        />
      </div>

      {format === 'adf' && viewMode === 'code' && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500">
          Copies as rich text — paste directly into Jira Cloud comments
        </div>
      )}

      {/* ── Editor toolbar ── */}
      {canEdit && (
        <div
          aria-hidden={!showToolbar}
          {...(showToolbar ? {} : { inert: '' })}
          className={`transition-all duration-200 ${showToolbar ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          style={{
            height: showToolbar ? undefined : 0,
            overflow: showToolbar ? 'visible' : 'hidden',
          }}
        >
          <Suspense fallback={null}>
            <EditorToolbar
              exec={exec}
              insertHtml={insertHtml}
              saveRange={saveRange}
              activeBlock={activeBlock}
              activeFormats={activeFormats}
            />
          </Suspense>
        </div>
      )}

      {/* ── Content ── */}
      {viewMode === 'code' ? (
        <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-900 dark:text-neutral-100">
          {value}
        </pre>
      ) : (
        <div
          ref={editorRef}
          role="textbox"
          aria-label="Jira content editor"
          aria-multiline={true}
          aria-readonly={!(canEdit && editMode)}
          contentEditable={canEdit && editMode}
          suppressContentEditableWarning
          onInput={() => {
            /* handled by useWysiwygEditor via scheduleMarkdownUpdate */
          }}
          onMouseUp={saveRange}
          onKeyUp={saveRange}
          className={`jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 outline-none transition-opacity duration-200 dark:text-neutral-100 ${isPending && !(canEdit && editMode) ? 'opacity-50' : ''} ${canEdit && editMode ? 'ring-1 ring-inset ring-blue-300 dark:ring-blue-700' : 'ring-0'}`}
        />
      )}
    </div>
  )
})
