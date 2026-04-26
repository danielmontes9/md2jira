import { useRef, useCallback, useMemo, useState, useEffect, Suspense, memo } from 'react'
import { useMarkdownShortcuts } from '../hooks/useMarkdownShortcuts.js'
import { useClipboardEvents } from '../hooks/useClipboardEvents.js'
import { useFileImportExport } from '../hooks/useFileImportExport.js'
import { useToast } from '../context/ToastContext.js'
import { lazyNamed } from '../utils/lazy-named.js'

const ShortcutsModalLazy = lazyNamed(() => import('./ShortcutsModal.js'), 'ShortcutsModal')

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
}

export const MarkdownInput = memo(function MarkdownInput({ value, onChange }: MarkdownInputProps) {
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
  const wordCount = useMemo(
    () => (value.trim() === '' ? 0 : value.trim().split(/\s+/).length),
    [value]
  )
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
        <div className="flex flex-col gap-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800 @[420px]:flex-row @[420px]:items-center @[420px]:justify-between @[420px]:gap-2 @[420px]:px-4">
          <label
            htmlFor="markdown-input"
            className="shrink-0 cursor-text text-sm font-medium text-neutral-500 dark:text-neutral-400"
          >
            Markdown
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
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
                aria-label="Import Markdown file"
              >
                Import
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="whitespace-nowrap border-l border-l-neutral-300 px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label="Export Markdown file"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="whitespace-nowrap rounded-r-md border-l border-l-neutral-300 px-3 py-1 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-l-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label="Show keyboard shortcuts"
                aria-haspopup="dialog"
              >
                Shortcuts
              </button>
            </div>
            {/* Copy MD */}
            <button
              type="button"
              onClick={handleCopyMd}
              className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
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
        {/* Bottom status bar */}
        <div className="flex items-center justify-end border-t border-neutral-200 px-3 py-1 dark:border-neutral-800">
          <span
            aria-label={`${wordCount.toLocaleString()} words, ${value.length.toLocaleString()} characters`}
            title={`${wordCount.toLocaleString()} words, ${value.length.toLocaleString()} characters`}
            className="text-xs tabular-nums text-neutral-400 select-none dark:text-neutral-500"
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
