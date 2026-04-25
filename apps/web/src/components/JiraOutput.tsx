import { useState, memo, Suspense, useCallback, useEffect } from 'react'
import { useTiptapEditor } from '../hooks/useTiptapEditor.js'
import { useJiraCopy } from '../hooks/useJiraCopy.js'
import { useToast } from '../context/ToastContext.js'
import { JiraOutputHeader } from './jira-output/JiraOutputHeader.js'
import { JiraOutputContent } from './jira-output/JiraOutputContent.js'
import { lazyNamed } from '../utils/lazy-named.js'

const EditorToolbar = lazyNamed(() => import('./jira-output/EditorToolbar.js'), 'EditorToolbar')
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
  const addToast = useToast()

  const onColorWarning = useCallback(() => {
    addToast('Color formatting is not supported in Jira output and will be removed.', 'warning')
  }, [addToast])

  const onUnderlineWarning = useCallback(() => {
    addToast('Underline formatting is not supported in Jira output and will be removed.', 'warning')
  }, [addToast])

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
    onColorWarning,
    onUnderlineWarning,
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
      {/* ── Header bar ── */}
      <JiraOutputHeader
        format={format}
        viewMode={viewMode}
        isPending={isPending}
        onFormatChange={onFormatChange}
        onViewModeChange={setViewMode}
        canEdit={canEdit}
        editMode={editMode}
        copied={copied}
        onCopy={handleCopy}
        onToggleEdit={() => setEditMode((v) => !v)}
      />

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
          className={`grid transition-[grid-template-rows] duration-200 ${showToolbar ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          aria-hidden={!showToolbar}
          {...(showToolbar ? {} : { inert: '' })}
        >
          <div
            className={`overflow-hidden transition-opacity duration-200 ${showToolbar ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
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
        </div>
      )}

      {/* ── Accessibility: live region for mode changes ── */}
      <div role="status" aria-live="polite" className="sr-only">
        {editMode
          ? 'Edit mode enabled'
          : `${format === 'adf' ? 'Jira Cloud' : 'Wiki Markup'} ${viewMode}`}
      </div>

      {/* ── Content ── */}
      <JiraOutputContent
        format={format}
        viewMode={viewMode}
        value={value}
        editor={editor}
        canEdit={canEdit}
        editMode={editMode}
        isPending={isPending}
      />
    </div>
  )
})
