import { useState, memo, lazy, Suspense, useEffect } from 'react'
import { EditorContent } from '@tiptap/react'
import { useTiptapEditor } from '../hooks/useTiptapEditor.js'
import { highlightJson } from '../utils/highlight-json.js'
import { useJiraCopy } from '../hooks/useJiraCopy.js'
import { CopyEditGroup } from './jira-output/CopyEditGroup.js'
const EditorToolbar = lazy(() =>
  import('./jira-output/EditorToolbar.js').then((m) => ({ default: m.EditorToolbar }))
)
import './jira-output/jira-preview.css'
import type { OutputFormat, ViewMode } from '../types.js'

/** Returns the correct className for a toggle-group button. */
function toggleBtnCls(active: boolean, side: 'left' | 'right'): string {
  const radius = side === 'left' ? 'rounded-l-md' : 'rounded-r-md'
  const base = `flex-1 whitespace-nowrap ${radius} px-2 py-1 transition-colors @[460px]:flex-none`
  return active
    ? `${base} bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100`
    : `${base} text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200`
}

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

  // Reset view mode to 'preview' when switching away from ADF (wiki has no distinct code view)
  useEffect(() => {
    if (format !== 'adf') setViewMode('preview')
  }, [format])

  // Only initialize TipTap when ADF format is active — saves resources in wiki mode
  const shouldCreate = import.meta.env.VITE_ENABLE_WYSIWYG !== 'false' && format === 'adf'

  const { editor, activeBlock, activeFormats, activeColor, exec, insertHtml } = useTiptapEditor({
    previewHtml,
    onMarkdownChange,
    shouldCreate,
  })

  const { copied, handleCopy } = useJiraCopy(value, format, editor)

  const canEdit =
    import.meta.env.VITE_ENABLE_WYSIWYG !== 'false' &&
    format === 'adf' &&
    viewMode === 'preview' &&
    !!onMarkdownChange
  const showToolbar = canEdit && editMode

  // Toggle TipTap editable state based on edit mode
  useEffect(() => {
    if (editor) editor.setEditable(canEdit && editMode)
  }, [editor, canEdit, editMode])

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
                className={toggleBtnCls(format === 'adf', 'left')}
              >
                Jira Cloud
              </button>
              <button
                onClick={() => onFormatChange('wiki')}
                aria-pressed={format === 'wiki'}
                className={toggleBtnCls(format === 'wiki', 'right')}
              >
                Wiki Markup
              </button>
            </div>
            {format === 'adf' && (
              <div
                role="group"
                aria-label="View mode"
                className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700"
              >
                <button
                  onClick={() => setViewMode('preview')}
                  aria-pressed={viewMode === 'preview'}
                  className={toggleBtnCls(viewMode === 'preview', 'left')}
                >
                  Preview
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  aria-pressed={viewMode === 'code'}
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
          onCopy={handleCopy}
          onToggleEdit={() => setEditMode((v) => !v)}
        />
      </div>

      {format === 'adf' && viewMode === 'code' && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500">
          Copies as rich text — paste directly into Jira Cloud comments
        </div>
      )}
      {format === 'wiki' && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500">
          Raw Wiki Markup — copy and paste into Jira Server/Data Center
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
              activeBlock={activeBlock}
              activeFormats={activeFormats}
              activeColor={activeColor}
            />
          </Suspense>
        </div>
      )}

      {/* ── Content ── */}
      {viewMode === 'code' ? (
        <pre
          role="region"
          aria-label="Jira markup code"
          className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-900 dark:text-neutral-100"
          // highlightJson escapes HTML entities before injecting <span> tags — safe.
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={format === 'adf' ? { __html: highlightJson(value) } : undefined}
        >
          {format !== 'adf' ? value : undefined}
        </pre>
      ) : format === 'adf' ? (
        <EditorContent
          editor={editor}
          role="textbox"
          aria-label="Jira content editor"
          aria-multiline={true}
          aria-readonly={!(canEdit && editMode)}
          className={`jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 outline-none transition-opacity duration-200 dark:text-neutral-100 ${isPending && !(canEdit && editMode) ? 'opacity-50' : ''} ${canEdit && editMode ? 'ring-1 ring-inset ring-blue-300 dark:ring-blue-700' : 'ring-0'}`}
        />
      ) : (
        <pre
          role="region"
          aria-label="Wiki markup preview"
          className={`jira-preview flex-1 overflow-auto whitespace-pre-wrap p-6 font-mono text-sm text-neutral-900 dark:text-neutral-100 ${isPending ? 'opacity-50' : ''}`}
        >
          {value}
        </pre>
      )}
    </div>
  )
})
