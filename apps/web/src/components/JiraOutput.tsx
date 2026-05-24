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
  /** True while the ADF worker is computing the first HTML for this session. */
  isLoadingPreview?: boolean
  onMarkdownChange?: (md: string) => void
}

export const JiraOutput = memo(function JiraOutput({
  value,
  format,
  onFormatChange,
  previewHtml,
  isPending,
  isLoadingPreview,
  onMarkdownChange,
}: JiraOutputProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [editMode, setEditMode] = useState(false)
  const [wikiDraft, setWikiDraft] = useState(value)
  const addToast = useToast()

  const onColorWarning = useCallback(() => {
    addToast('Color formatting is not supported in Jira output and will be removed.', 'warning')
  }, [addToast])

  const onUnderlineWarning = useCallback(() => {
    addToast('Underline formatting is not supported in Jira output and will be removed.', 'warning')
  }, [addToast])

  // Reset view mode to 'preview' and exit edit mode when switching away from ADF
  useEffect(() => {
    if (format !== 'adf') setViewMode('preview')
    setEditMode(false)
  }, [format])

  // Sync wikiDraft with the converted value when not in wiki edit mode
  useEffect(() => {
    if (!(format === 'wiki' && editMode)) setWikiDraft(value)
  }, [value, format, editMode])

  // Only initialize TipTap when ADF format is active — saves resources in wiki mode
  const shouldCreate = import.meta.env.VITE_ENABLE_WYSIWYG !== 'false' && format === 'adf'

  const {
    editor,
    activeBlock,
    activeFormats,
    activeColor,
    isInTable,
    hasLossyMarks,
    exec,
    insertHtml,
  } = useTiptapEditor({
    previewHtml,
    onMarkdownChange,
    shouldCreate,
    onColorWarning,
    onUnderlineWarning,
  })

  // Use wikiDraft as the clipboard source when in wiki edit mode
  const copyValue = format === 'wiki' && editMode ? wikiDraft : value
  const { copied, handleCopy } = useJiraCopy(copyValue, format, editor)

  // ADF-specific edit check (TipTap); wiki uses a plain textarea instead
  const adfCanEdit =
    import.meta.env.VITE_ENABLE_WYSIWYG !== 'false' &&
    format === 'adf' &&
    viewMode === 'preview' &&
    !!onMarkdownChange
  const canEdit = adfCanEdit || format === 'wiki'
  const showToolbar = adfCanEdit && editMode

  // Toggle TipTap editable state based on edit mode
  useEffect(() => {
    if (editor) editor.setEditable(canEdit && editMode)
  }, [editor, canEdit, editMode])

  // Show a one-time warning when entering Wiki edit mode so the user knows
  // their edits won't sync back to the Markdown source.
  const handleToggleEdit = useCallback(() => {
    if (format === 'wiki' && !editMode) {
      addToast(
        'Wiki markup edits are independent — changes won\u2019t sync back to the Markdown source.',
        'warning'
      )
    }
    setEditMode((v) => !v)
  }, [format, editMode, addToast])

  return (
    <div className="@container flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-900">
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
        onToggleEdit={handleToggleEdit}
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
                isInTable={isInTable}
                hasLossyMarks={hasLossyMarks}
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
      <div data-print-content className="flex min-h-0 flex-1 flex-col overflow-auto">
        <JiraOutputContent
          format={format}
          viewMode={viewMode}
          value={value}
          editor={editor}
          canEdit={canEdit}
          editMode={editMode}
          isPending={isPending}
          isLoadingPreview={isLoadingPreview ?? false}
          wikiDraft={wikiDraft}
          onWikiDraftChange={setWikiDraft}
        />
      </div>
    </div>
  )
})
