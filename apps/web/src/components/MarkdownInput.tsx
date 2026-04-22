import { useRef, useCallback, useMemo, useState, Suspense, memo } from 'react'
import { useMarkdownShortcuts } from '../hooks/useMarkdownShortcuts.js'
import { useClipboardEvents } from '../hooks/useClipboardEvents.js'
import { useFileImportExport } from '../hooks/useFileImportExport.js'
import { useToast } from '../context/ToastContext.js'
import { lazyNamed } from '../utils/lazy-named.js'
import { IconLinkOff } from './icons.js'

const ShortcutsModalLazy = lazyNamed(() => import('./ShortcutsModal.js'), 'ShortcutsModal')

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  /** When false, the document exceeds the URL deep-link limit and ?md= is not maintained. */
  isDeepLinkActive?: boolean
}

const TOOLBAR_BTN_CLS =
  'rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500'

export const MarkdownInput = memo(function MarkdownInput({
  value,
  onChange,
  isDeepLinkActive = true,
}: MarkdownInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const addToast = useToast()

  const { copiedMd, handleCopyMd } = useClipboardEvents(value, textareaRef, addToast, onChange)
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

  const syncScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleKeyDown = useMarkdownShortcuts(onChange)

  const lineCount = value.split('\n').length
  // A single pre-formatted text node is far cheaper than O(n) individual DOM
  // elements for large documents. String of "1\n2\n3\n..." renders identically
  // with `whitespace-pre` applied to the container.
  const lineNumbersText = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'),
    [lineCount]
  )

  return (
    <>
      <div
        className={`@container flex min-h-0 flex-1 flex-col rounded-lg border bg-white transition-colors dark:bg-neutral-900 ${
          isDragging
            ? 'border-blue-400 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/20'
            : 'border-neutral-200 dark:border-neutral-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-1 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800 @[425px]:flex-row @[425px]:items-center @[425px]:justify-between">
          <label
            htmlFor="markdown-input"
            className="cursor-text text-sm font-medium text-neutral-500 dark:text-neutral-400"
          >
            Markdown
          </label>
          {!isDeepLinkActive && value && (
            <span
              title="Document too large for URL sharing"
              aria-label="URL sharing unavailable — document exceeds size limit"
              className="text-amber-500 dark:text-amber-400"
            >
              <IconLinkOff className="h-3.5 w-3.5" />
            </span>
          )}
          <div className="flex items-center justify-center gap-1 @[375px]:justify-end">
            <button
              type="button"
              onClick={handleImport}
              className={TOOLBAR_BTN_CLS}
              aria-label="Import Markdown file"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className={TOOLBAR_BTN_CLS}
              aria-label="Export Markdown file"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className={TOOLBAR_BTN_CLS}
              aria-label="Show keyboard shortcuts"
              aria-haspopup="dialog"
            >
              Shortcuts
            </button>
            <button
              type="button"
              onClick={handleCopyMd}
              className={TOOLBAR_BTN_CLS}
              aria-label="Copy Markdown to clipboard"
            >
              {copiedMd ? 'Copied!' : 'Copy MD'}
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Line numbers gutter */}
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="select-none overflow-hidden whitespace-pre border-r border-neutral-200 bg-neutral-50 px-3 py-4 text-right font-mono text-sm leading-6 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
          >
            {lineNumbersText}
          </div>
          {/* Textarea */}
          <textarea
            id="markdown-input"
            aria-label="Markdown input"
            name="markdown-input"
            ref={textareaRef}
            className="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder="Paste your Markdown here..."
            spellCheck={false}
          />
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
