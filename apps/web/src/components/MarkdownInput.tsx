import { useRef, useCallback, useMemo, useState, useEffect, useId, Suspense, memo } from 'react'
import { useFileImportExport } from '../hooks/useFileImportExport.js'
import { useCodeMirrorEditor } from '../hooks/useCodeMirrorEditor.js'
import { useToast } from '../context/ToastContext.js'
import { lazyNamed } from '../utils/lazy-named.js'
import { useT } from '../i18n/index.js'
import { Modal, ModalCloseButton, useModalClose } from './Modal.js'

const ShortcutsModalLazy = lazyNamed(() => import('./ShortcutsModal.js'), 'ShortcutsModal')

// ── New document confirm modal ────────────────────────────────────────────

function NewDocConfirmContent({
  onRequestConfirm,
  modalId,
}: {
  onRequestConfirm: (name: string) => void
  modalId: string
}) {
  const t = useT()
  const handleClose = useModalClose()
  const [docName, setDocName] = useState('')
  const inputId = `${modalId}-name`

  function handleConfirm() {
    onRequestConfirm(docName.trim())
    handleClose()
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <h2
        id={modalId}
        className="mb-4 text-base font-semibold text-neutral-900 dark:text-neutral-100"
      >
        {t('newDocumentModalTitle')}
      </h2>
      <div className="mb-5">
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {t('newDocumentNameLabel')}
        </label>
        <input
          id={inputId}
          type="text"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm()
          }}
          placeholder={t('newDocumentNamePlaceholder')}
          maxLength={60}
          autoFocus
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400"
        />
      </div>
      <div className="flex justify-end gap-2">
        <ModalCloseButton
          className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={t('clearEditorNo')}
        >
          {t('clearEditorNo')}
        </ModalCloseButton>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {t('newDocumentCreate')}
        </button>
      </div>
    </div>
  )
}

function NewDocConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const modalId = useId()
  // useRef so the name is available synchronously inside the setTimeout closure
  // when Modal.onClose fires after ANIM_MS — avoids a stale-closure bug.
  const pendingNameRef = useRef<string | null>(null)
  return (
    <Modal
      onClose={() => {
        if (pendingNameRef.current !== null) onConfirm(pendingNameRef.current)
        else onCancel()
      }}
      ariaLabelledBy={modalId}
    >
      <NewDocConfirmContent
        onRequestConfirm={(name) => {
          pendingNameRef.current = name
        }}
        modalId={modalId}
      />
    </Modal>
  )
}

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  isDark: boolean
  onSave?: () => void
  historyEnabled?: boolean
  /**
   * When provided, called with the new document name instead of invoking
   * `onSave` + `onChange` directly. Lets App.tsx handle saving current
   * content and setting the new content in a single coordinated step.
   */
  onNewDocument?: (name: string) => void
  /**
   * Increment this value to programmatically open the new-document modal
   * from outside the component (e.g. the Alt+N keyboard shortcut in App.tsx).
   * The component tracks the previous value and opens the modal on each change.
   */
  newDocumentTrigger?: number
}

export const MarkdownInput = memo(function MarkdownInput({
  value,
  onChange,
  isDark,
  onSave,
  historyEnabled = false,
  onNewDocument,
  newDocumentTrigger,
}: MarkdownInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [copiedMd, setCopiedMd] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetCopied = useCallback(() => setCopiedMd(false), [])
  const addToast = useToast()
  const t = useT()

  // Dismiss the "New" confirmation if the editor is already empty
  useEffect(() => {
    if (value === '' && confirmNew) setConfirmNew(false)
  }, [value, confirmNew])

  // Ref so the trigger effect can read the current value without it being a dep.
  const valueRef = useRef(value)
  valueRef.current = value

  // Open the modal when App.tsx increments the trigger (e.g. Alt+N shortcut).
  // Tracks the previous value so only a genuine increment triggers the modal.
  const prevNewDocTrigger = useRef(newDocumentTrigger ?? 0)
  useEffect(() => {
    const current = newDocumentTrigger ?? 0
    if (current !== prevNewDocTrigger.current) {
      prevNewDocTrigger.current = current
      if (valueRef.current.length > 0) setConfirmNew(true)
    }
  }, [newDocumentTrigger])

  const { undo, redo, openSearch } = useCodeMirrorEditor({
    containerRef,
    value,
    onChange,
    isDark,
    placeholderText: t('markdownPlaceholder'),
    editorLabel: t('markdownInputEditor'),
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
  } = useFileImportExport(value, onChange, addToast, {
    unsupportedType: t('importUnsupportedType'),
    tooLarge: t('importFileTooLarge'),
    readError: t('importReadError'),
    importedPrefix: t('importSuccess'),
  })

  const handleCopyMd = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* v8 ignore start -- textarea clipboard fallback: only runs in non-secure contexts */
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      /* v8 ignore stop */
    }
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    setCopiedMd(true)
    copiedTimerRef.current = setTimeout(resetCopied, 2000)
  }, [value, resetCopied])

  const wordCount = useMemo(
    () => (value.trim() === '' ? 0 : value.trim().split(/\s+/).length),
    [value]
  )

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
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmNew(true)}
                className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                title={t('newDocumentTitle')}
              >
                {t('newDocument')}
              </button>
            )}
            {/* File group: Import + Export + Shortcuts */}
            <div
              role="group"
              aria-label={t('fileActions')}
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
          aria-label={t('markdownInputEditor')}
        />
        {/* Bottom status bar */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-1 dark:border-neutral-800">
          {/* Edit actions as text buttons */}
          <div role="group" aria-label={t('editActions')} className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={undo}
              className="rounded px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('undoAction')}
              title={`${t('undoAction')} (Ctrl+Z)`}
            >
              {t('undoAction')}
            </button>
            <button
              type="button"
              onClick={redo}
              className="rounded px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('redoAction')}
              title={`${t('redoAction')} (Ctrl+Y)`}
            >
              {t('redoAction')}
            </button>
            <button
              type="button"
              onClick={openSearch}
              className="rounded px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('findReplace')}
              title={`${t('findReplace')} (Ctrl+F)`}
            >
              {t('openSearch')}
            </button>
            {historyEnabled && onSave && (
              <button
                type="button"
                onClick={onSave}
                className="rounded px-2 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label={t('saveToHistory')}
                title={t('saveToHistory')}
              >
                {t('saveAction')}
              </button>
            )}
          </div>
          <span
            aria-label={`${wordCount.toLocaleString()} words, ${value.length.toLocaleString()} characters`}
            title={`${wordCount.toLocaleString()} words, ${value.length.toLocaleString()} characters`}
            className="select-none text-xs tabular-nums text-neutral-600 dark:text-neutral-300"
          >
            {wordCount.toLocaleString()} words · {value.length.toLocaleString()} chars
          </span>
        </div>
      </div>

      <Suspense fallback={null}>
        {showShortcuts && <ShortcutsModalLazy onClose={() => setShowShortcuts(false)} />}
      </Suspense>
      {confirmNew && (
        <NewDocConfirmModal
          onConfirm={(name) => {
            setConfirmNew(false) // always dismiss modal regardless of path
            if (onNewDocument) {
              onNewDocument(name)
            } else {
              onSave?.()
              onChange(name ? `# ${name}\n\n` : '')
            }
          }}
          onCancel={() => setConfirmNew(false)}
        />
      )}

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
