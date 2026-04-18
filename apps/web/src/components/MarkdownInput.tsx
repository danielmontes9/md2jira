import { useRef, useCallback, useMemo, useState, lazy, Suspense, memo } from 'react'
const ShortcutsModal = lazy(() =>
  import('./ShortcutsModal.js').then((m) => ({ default: m.ShortcutsModal }))
)
import { useMarkdownShortcuts } from '../hooks/useMarkdownShortcuts.js'
import { useClipboardEvents } from '../hooks/useClipboardEvents.js'
import { useFileImportExport } from '../hooks/useFileImportExport.js'
import { useToast } from '../context/ToastContext.js'

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
}

const TOOLBAR_BTN_CLS =
  'rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'

export const MarkdownInput = memo(function MarkdownInput({ value, onChange }: MarkdownInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const addToast = useToast()

  const { copiedMd, handleCopyMd } = useClipboardEvents(value, onChange, textareaRef, addToast)
  const { fileInputRef, handleImport, handleFileChange, handleExport } = useFileImportExport(
    value,
    onChange,
    addToast
  )

  const syncScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleKeyDown = useMarkdownShortcuts()

  const lineCount = value.split('\n').length
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => <div key={i + 1}>{i + 1}</div>),
    [lineCount]
  )

  return (
    <>
      <div className="@container flex min-h-0 flex-1 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-1 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800 @[425px]:flex-row @[425px]:items-center @[425px]:justify-between">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Markdown
          </span>
          <div className="flex items-center justify-center gap-1 @[375px]:justify-end">
            <button
              onClick={handleImport}
              className={TOOLBAR_BTN_CLS}
              aria-label="Import Markdown file"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className={TOOLBAR_BTN_CLS}
              aria-label="Export Markdown file"
            >
              Export
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className={TOOLBAR_BTN_CLS}
              aria-label="Show keyboard shortcuts"
            >
              Shortcuts
            </button>
            <button
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
            className="select-none overflow-hidden border-r border-neutral-200 bg-neutral-50 px-3 py-4 text-right font-mono text-sm leading-6 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400"
          >
            {lineNumbers}
          </div>
          {/* Textarea */}
          <textarea
            id="markdown-input"
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
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
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
