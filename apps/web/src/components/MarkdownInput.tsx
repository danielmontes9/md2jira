import { useRef, useCallback, useMemo, useState, useEffect, lazy, Suspense, memo } from 'react'
const ShortcutsModal = lazy(() =>
  import('./ShortcutsModal.js').then((m) => ({ default: m.ShortcutsModal }))
)
import { ToastContainer, ToastType } from './Toast.js'
import { useMarkdownShortcuts } from '../hooks/useMarkdownShortcuts.js'

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
}

export const MarkdownInput = memo(function MarkdownInput({ value, onChange }: MarkdownInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([])
  const toastId = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Native copy event listener — more reliable than React's onCopy for clipboard interception.
  // Ensures the textarea always writes ONLY plain markdown text, clearing any text/html
  // that a previous "Copy Jira" operation may have left in the system clipboard.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const handleCopy = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const { selectionStart, selectionEnd } = textarea
      const selected =
        selectionStart !== selectionEnd
          ? textarea.value.substring(selectionStart, selectionEnd)
          : textarea.value
      const escaped = selected.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      e.clipboardData.clearData()
      e.clipboardData.setData('text/plain', selected)
      e.clipboardData.setData(
        'text/html',
        `<pre style="font-family:monospace;white-space:pre-wrap;">${escaped}</pre>`
      )
      e.preventDefault()
    }
    // Strip rich text (e.g. from VS Code) on paste — keep only plain text.
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const plain = e.clipboardData.getData('text/plain')
      e.preventDefault()
      const { selectionStart, selectionEnd } = textarea
      const before = textarea.value.substring(0, selectionStart)
      const after = textarea.value.substring(selectionEnd)
      const newValue = before + plain + after
      // Use execCommand so native undo stack is preserved
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
      ;(
        document as unknown as { execCommand(cmd: string, showUI: boolean, value: string): boolean }
      ).execCommand('insertText', false, plain)
      // Fallback for browsers that block execCommand
      if (textarea.value !== newValue) {
        textarea.value = newValue
        textarea.setSelectionRange(selectionStart + plain.length, selectionStart + plain.length)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    textarea.addEventListener('copy', handleCopy)
    textarea.addEventListener('paste', handlePaste)
    return () => {
      textarea.removeEventListener('copy', handleCopy)
      textarea.removeEventListener('paste', handlePaste)
    }
  }, [])

  const syncScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt,.text,text/markdown,text/plain'
    input.style.display = 'none'
    input.onchange = () => {
      input.remove()
      const file = input.files?.[0]
      if (!file) return
      const allowed = ['.md', '.txt', '.text']
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!allowed.includes(ext)) {
        addToast(
          `Unsupported file type "${ext}". Please import a .md, .txt, or .text file.`,
          'error'
        )
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === 'string') onChange(text)
      }
      reader.readAsText(file)
    }
    document.body.appendChild(input)
    input.click()
  }, [onChange, addToast])

  const handleKeyDown = useMarkdownShortcuts()

  const [copied, setCopied] = useState(false)

  const handleCopyMd = useCallback(() => {
    // Include text/html wrapping the markdown in <pre> so that Jira's ProseMirror
    // editor treats the paste as preformatted text instead of auto-converting
    // markdown syntax to rich text. This matches the behaviour of copying from VS Code.
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const htmlBlob = new Blob(
      [`<pre style="font-family:monospace;white-space:pre-wrap;">${escaped}</pre>`],
      { type: 'text/html' }
    )
    const textBlob = new Blob([value], { type: 'text/plain' })
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    navigator.clipboard
      .write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })])
      .then(done)
      .catch(() => navigator.clipboard.writeText(value).then(done))
  }, [value])

  const handleExport = useCallback(() => {
    const blob = new Blob([value], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [value])

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
              className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Import Markdown file"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Export Markdown file"
            >
              Export
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Show keyboard shortcuts"
            >
              Shortcuts
            </button>
            <button
              onClick={handleCopyMd}
              className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Copy Markdown to clipboard"
            >
              {copied ? 'Copied!' : 'Copy MD'}
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
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
})
