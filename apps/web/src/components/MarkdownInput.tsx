import { useRef, useCallback, useMemo, useState, useEffect, Suspense, memo } from 'react'
import { useFileImportExport } from '../hooks/useFileImportExport.js'
import { useCodeMirrorEditor } from '../hooks/useCodeMirrorEditor.js'
import { useToast } from '../context/ToastContext.js'
import { lazyNamed } from '../utils/lazy-named.js'
import { useT } from '../i18n/index.js'

const ShortcutsModalLazy = lazyNamed(() => import('./ShortcutsModal.js'), 'ShortcutsModal')

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  isDark: boolean
  onSave?: () => void
  historyEnabled?: boolean
}

export const MarkdownInput = memo(function MarkdownInput({
  value,
  onChange,
  isDark,
  onSave,
  historyEnabled = false,
}: MarkdownInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confirmNewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addToast = useToast()
  const t = useT()

  // Dismiss the "New" confirmation if the editor is already empty
  useEffect(() => {
    if (value === '' && confirmNew) setConfirmNew(false)
  }, [value, confirmNew])

  // Auto-dismiss the "New" confirmation after 5 s if the user doesn't act
  useEffect(() => {
    if (!confirmNew) {
      if (confirmNewTimerRef.current !== null) {
        clearTimeout(confirmNewTimerRef.current)
        confirmNewTimerRef.current = null
      }
      return
    }
    confirmNewTimerRef.current = setTimeout(() => setConfirmNew(false), 5_000)
    return () => {
      if (confirmNewTimerRef.current !== null) clearTimeout(confirmNewTimerRef.current)
    }
  }, [confirmNew])

  const { undo, redo, openSearch } = useCodeMirrorEditor({
    containerRef,
    value,
    onChange,
    isDark,
    placeholderText: 'Paste your Markdown here...',
    ...(historyEnabled && onSave ? { onSave } : {}),
  })

  const {
    fileInputRef,
    handleImport,
    handleFileChange,
    handleExport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
  } = useFileImportExport(value, onChange, addToast)

  const handleCopyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    setCopiedMd(true)
    copiedTimerRef.current = setTimeout(() => setCopiedMd(false), 2000)
  }, [value])

  const wordCount = useMemo(
    () => (value.trim() === '' ? 0 : value.trim().split(/\s+/).length),
    [value]
  )

  const iconBtnCls =
    'rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500'

  return (
    <>
      <div
        className={`@container flex min-h-0 flex-1 flex-col bg-white transition-colors dark:bg-neutral-900 ${
          isDragging
            ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
            : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800 @[420px]:flex-row @[420px]:items-center @[420px]:justify-between @[420px]:gap-2 @[420px]:px-4">
          <label className="shrink-0 cursor-default text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {t('markdownPanelLabel')}
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* New document */}
            {value.length > 0 &&
              (confirmNew ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('clearEditorPrompt')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSave?.()
                      onChange('')
                      setConfirmNew(false)
                    }}
                    className="rounded px-2 py-0.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                  >
                    {t('clearEditorYes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmNew(false)}
                    className="rounded px-2 py-0.5 text-xs text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                  >
                    {t('clearEditorNo')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmNew(true)}
                  className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                  title="New document (clears editor)"
                >
                  {t('newDocument')}
                </button>
              ))}
            {/* File group: Import + Export + Shortcuts */}
            <div
              role="group"
              aria-label="File actions"
              className="flex rounded-md border border-neutral-300 text-xs dark:border-neutral-600"
            >
              <button
                type="button"
                onClick={handleImport}
                className="whitespace-nowrap rounded-l-md px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label={t('importFile')}
              >
                {t('importAction')}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="whitespace-nowrap border-l border-l-neutral-300 px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label={t('exportFile')}
              >
                {t('exportAction')}
              </button>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="whitespace-nowrap rounded-r-md border-l border-l-neutral-300 px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label={t('openShortcuts')}
                aria-haspopup="dialog"
              >
                {t('shortcutsAction')}
              </button>
            </div>
            {/* Copy MD */}
            <button
              type="button"
              onClick={handleCopyMd}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('copyMarkdown')}
            >
              {copiedMd ? t('copied') : t('copyMd')}
            </button>
          </div>
        </div>

        {/* CodeMirror editor mount point */}
        <div
          ref={containerRef}
          className="min-h-0 flex-1 overflow-hidden"
          aria-label="Markdown input editor"
        />
        {/* Bottom status bar */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-1 dark:border-neutral-800">
          {/* Edit actions as text buttons */}
          <div role="group" aria-label="Edit actions" className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={undo}
              className="rounded px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label="Undo (Ctrl+Z)"
              title="Undo (Ctrl+Z)"
            >
              {t('undoAction')}
            </button>
            <button
              type="button"
              onClick={redo}
              className="rounded px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label="Redo (Ctrl+Y)"
              title="Redo (Ctrl+Y)"
            >
              {t('redoAction')}
            </button>
            <button
              type="button"
              onClick={openSearch}
              className="rounded px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label="Find / Replace (Ctrl+F)"
              title="Find / Replace (Ctrl+F)"
            >
              {t('openSearch')}
            </button>
            {historyEnabled && onSave && (
              <button
                type="button"
                onClick={onSave}
                className="rounded px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label="Save document to history"
                title="Save document to history"
              >
                {t('saveAction')}
              </button>
            )}
          </div>
          <span
            aria-label={`${wordCount.toLocaleString()} words, ${value.length.toLocaleString()} characters`}
            title={`${wordCount.toLocaleString()} words, ${value.length.toLocaleString()} characters`}
            className="select-none text-xs tabular-nums text-neutral-400 dark:text-neutral-500"
          >
            {wordCount.toLocaleString()} words · {value.length.toLocaleString()} chars
          </span>
        </div>
      </div>

      <Suspense fallback={null}>
        {showShortcuts && <ShortcutsModalLazy onClose={() => setShowShortcuts(false)} />}
      </Suspense>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt,.text,text/markdown,text/plain"
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        onChange={handleFileChange}
      />
    </>
  )
})
