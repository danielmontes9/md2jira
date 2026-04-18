import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type TurndownService from 'turndown'
import { convertToAdf } from 'md2jira-core'
import { adfToHtml } from './jira-output/adf-renderer.js'
import { EditorToolbar } from './jira-output/EditorToolbar.js'

type OutputFormat = 'wiki' | 'adf'
type ViewMode = 'preview' | 'code'

interface JiraOutputProps {
  value: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
  markdown: string
  onMarkdownChange?: (md: string) => void
}

export function JiraOutput({
  value,
  format,
  onFormatChange,
  markdown,
  onMarkdownChange,
}: JiraOutputProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [editMode, setEditMode] = useState(false)

  // ─── Selection state for active toolbar indicators ──────────
  const [activeBlock, setActiveBlock] = useState<string>('p')
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isEditorUpdateRef = useRef(false)

  // Lazy-loaded TurndownService instance — loaded only when edit mode first activates
  // (Point 10: avoids bundling Turndown in the initial JS chunk)
  const tdRef = useRef<TurndownService | null>(null)

  const previewHtml = useMemo(() => {
    try {
      const adfDoc = convertToAdf(markdown)
      return adfToHtml(adfDoc)
    } catch {
      return '<p style="color:#ef4444;">Error rendering preview</p>'
    }
  }, [markdown])

  // Initialize editor on mount — intentionally runs once
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = previewHtml
    }
  }, []) // run only on mount

  // Sync editor when markdown changes from the left panel (not while user edits here)
  useEffect(() => {
    if (!editorRef.current) return
    if (isEditorUpdateRef.current) {
      isEditorUpdateRef.current = false
      return
    }
    if (document.activeElement === editorRef.current) return
    editorRef.current.innerHTML = previewHtml
  }, [previewHtml])

  // Load TurndownService lazily on first edit mode activation (Point 10)
  useEffect(() => {
    if (!editMode || tdRef.current) return
    let cancelled = false
    import('./jira-output/turndown-config.js').then(({ createTurndownService }) => {
      if (!cancelled) tdRef.current = createTurndownService()
    })
    return () => {
      cancelled = true
    }
  }, [editMode])

  const updateSelectionState = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || !editorRef.current.contains(sel.anchorNode)) return
    const block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase()
    setActiveBlock(block)
    const fmts = new Set<string>()
    for (const cmd of [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'subscript',
      'superscript',
    ]) {
      if (document.queryCommandState(cmd)) fmts.add(cmd)
    }
    setActiveFormats(fmts)
  }, [])

  const saveRange = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    updateSelectionState()
  }, [updateSelectionState])

  const restoreRange = useCallback(() => {
    if (!savedRangeRef.current || !editorRef.current) return
    if (document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current.cloneRange())
    }
  }, [])

  const scheduleMarkdownUpdate = useCallback(() => {
    if (!onMarkdownChange || !editorRef.current) return
    clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      if (!editorRef.current || !tdRef.current) return
      isEditorUpdateRef.current = true
      try {
        onMarkdownChange(tdRef.current.turndown(editorRef.current.innerHTML))
      } catch {
        isEditorUpdateRef.current = false
      }
    }, 300)
  }, [onMarkdownChange])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      restoreRange()
      document.execCommand(cmd, false, arg ?? '')
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  const insertHtml = useCallback(
    (html: string) => {
      restoreRange()
      document.execCommand('insertHTML', false, html)
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  const handleCopy = useCallback(async () => {
    if (format === 'adf') {
      const currentHtml = editorRef.current?.innerHTML ?? previewHtml
      const blob = new Blob([currentHtml], { type: 'text/html' })
      const textBlob = new Blob([value], { type: 'text/plain' })
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob }),
      ])
    } else {
      await navigator.clipboard.writeText(value)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value, format, previewHtml])

  // Toolbar only visible when edit mode is active
  const canEdit = format === 'adf' && viewMode === 'preview' && !!onMarkdownChange
  const showToolbar = canEdit && editMode

  return (
    <div className="@container flex min-h-0 flex-1 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* ── Header bar ── */}
      <div className="flex flex-col gap-2 border-b border-neutral-200 px-3 py-2 @[460px]:flex-row @[460px]:items-center @[460px]:justify-between @[460px]:px-4 dark:border-neutral-800">
        <div className="flex flex-col gap-2 @[460px]:flex-row @[460px]:items-center @[460px]:gap-2">
          <div className="flex items-center justify-between gap-2 @[460px]:justify-start">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Output
            </span>
            <div
              role="group"
              aria-label="Copy and edit"
              className="flex rounded-md border border-neutral-300 text-xs @[460px]:hidden dark:border-neutral-600"
            >
              <button
                onClick={handleCopy}
                className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {copied ? 'Copied!' : format === 'adf' ? 'Copy for Jira' : 'Copy'}
              </button>
              {canEdit && (
                <button
                  onClick={() => setEditMode((v) => !v)}
                  title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
                  aria-pressed={editMode}
                  className={`whitespace-nowrap rounded-r-md border-l px-3 py-1 font-medium transition-colors ${
                    editMode
                      ? 'border-l-blue-300 bg-blue-50 text-blue-700 dark:border-l-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-l-neutral-300 text-neutral-600 dark:border-l-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {editMode ? 'View' : 'Edit'}
                </button>
              )}
            </div>
          </div>
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
        <div
          role="group"
          aria-label="Copy and edit"
          className="hidden items-center rounded-md border border-neutral-300 text-xs dark:border-neutral-600 @[460px]:flex"
        >
          <button
            onClick={handleCopy}
            className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {copied ? 'Copied!' : format === 'adf' ? 'Copy for Jira' : 'Copy'}
          </button>
          {canEdit && (
            <button
              onClick={() => setEditMode((v) => !v)}
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
          <EditorToolbar
            exec={exec}
            insertHtml={insertHtml}
            saveRange={saveRange}
            activeBlock={activeBlock}
            activeFormats={activeFormats}
          />
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
          onInput={scheduleMarkdownUpdate}
          onMouseUp={saveRange}
          onKeyUp={saveRange}
          className={`jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 outline-none transition-shadow duration-200 dark:text-neutral-100 ${canEdit && editMode ? 'ring-1 ring-inset ring-blue-300 dark:ring-blue-700' : 'ring-0'}`}
        />
      )}
    </div>
  )
}
