import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { ShortcutsModal } from './ShortcutsModal.js'
import { ToastContainer, ToastType } from './Toast.js'

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownInput({ value, onChange }: MarkdownInputProps) {
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
    input.onchange = () => {
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
    input.click()
  }, [onChange, addToast])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd, value: val } = textarea

    // execCommand('insertText') preserves the browser's native undo/redo stack.
    // Casting drops the @deprecated tag without using `any`.
    const execInsert = (text: string) => {
      const exec = (
        document as unknown as { execCommand(cmd: string, showUI: boolean, value: string): boolean }
      ).execCommand
      exec.call(document, 'insertText', false, text)
    }

    const getLine = (pos: number) => {
      const lineStart = val.lastIndexOf('\n', pos - 1) + 1
      const lineEndRaw = val.indexOf('\n', pos)
      const lineEnd = lineEndRaw === -1 ? val.length : lineEndRaw
      return { lineStart, lineEnd, text: val.substring(lineStart, lineEnd) }
    }

    const replaceLine = (lineStart: number, lineEnd: number, newText: string) => {
      textarea.selectionStart = lineStart
      textarea.selectionEnd = lineEnd
      execInsert(newText)
    }

    const wrapSelection = (wrapper: string) => {
      e.preventDefault()
      const selected = val.substring(selectionStart, selectionEnd)
      execInsert(`${wrapper}${selected}${wrapper}`)
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey

    // Tab → 2 spaces
    if (e.key === 'Tab' && !ctrlOrMeta && !e.altKey) {
      e.preventDefault()
      execInsert('  ')
      return
    }

    // Ctrl+B → bold
    if (e.key === 'b' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      wrapSelection('**')
      return
    }

    // Ctrl+I → italic
    if (e.key === 'i' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      wrapSelection('_')
      return
    }

    // Ctrl+Shift+K → inline code
    if (e.key === 'k' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      wrapSelection('`')
      return
    }

    // Ctrl+Shift+X → strikethrough
    if (e.key === 'x' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      wrapSelection('~~')
      return
    }

    // Ctrl+Shift+H → cycle heading h1 → h2 → h3 → none
    if (e.key === 'h' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      const match = text.match(/^(#{1,6}) /)
      let newLine: string
      if (!match || !match[0] || !match[1]) {
        newLine = `# ${text}`
      } else if (match[1].length >= 3) {
        newLine = text.replace(/^#{1,6} /, '')
      } else {
        newLine = `${'#'.repeat(match[1].length + 1)} ${text.substring(match[0].length)}`
      }
      replaceLine(lineStart, lineEnd, newLine)
      return
    }

    // Ctrl+Shift+L → toggle bullet list
    if (e.key === 'l' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      replaceLine(lineStart, lineEnd, text.startsWith('- ') ? text.substring(2) : `- ${text}`)
      return
    }

    // Ctrl+Shift+O → toggle numbered list
    if (e.key === 'o' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      replaceLine(
        lineStart,
        lineEnd,
        /^\d+\. /.test(text) ? text.replace(/^\d+\. /, '') : `1. ${text}`
      )
      return
    }

    // Ctrl+Shift+Q → toggle blockquote
    if (e.key === 'q' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      replaceLine(lineStart, lineEnd, text.startsWith('> ') ? text.substring(2) : `> ${text}`)
      return
    }

    // Ctrl+Shift+C → insert fenced code block
    if (e.key === 'c' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      execInsert('```\n\n```')
      requestAnimationFrame(() => {
        const cur = textarea.selectionStart
        textarea.selectionStart = textarea.selectionEnd = cur - 3
      })
      return
    }

    // Ctrl+Enter → insert blank line below current line
    if (e.key === 'Enter' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineEnd } = getLine(selectionStart)
      textarea.selectionStart = textarea.selectionEnd = lineEnd
      execInsert('\n')
      return
    }

    // Alt+↑ → move line up
    if (e.key === 'ArrowUp' && e.altKey && !ctrlOrMeta) {
      e.preventDefault()
      const { lineStart, lineEnd, text: currentLine } = getLine(selectionStart)
      if (lineStart === 0) return
      const { lineStart: prevStart, text: prevLine } = getLine(lineStart - 1)
      const cursorOffset = selectionStart - lineStart
      textarea.selectionStart = prevStart
      textarea.selectionEnd = lineEnd
      execInsert(`${currentLine}\n${prevLine}`)
      requestAnimationFrame(() => {
        const newPos = prevStart + cursorOffset
        textarea.selectionStart = textarea.selectionEnd = newPos
      })
      return
    }

    // Alt+↓ → move line down
    if (e.key === 'ArrowDown' && e.altKey && !ctrlOrMeta) {
      e.preventDefault()
      const { lineStart, lineEnd, text: currentLine } = getLine(selectionStart)
      if (lineEnd === val.length) return
      const nextStart = lineEnd + 1
      const nextEndRaw = val.indexOf('\n', nextStart)
      const nextEnd = nextEndRaw === -1 ? val.length : nextEndRaw
      const nextLine = val.substring(nextStart, nextEnd)
      const cursorOffset = selectionStart - lineStart
      textarea.selectionStart = lineStart
      textarea.selectionEnd = nextEnd
      execInsert(`${nextLine}\n${currentLine}`)
      requestAnimationFrame(() => {
        const newPos = lineStart + nextLine.length + 1 + cursorOffset
        textarea.selectionStart = textarea.selectionEnd = newPos
      })
      return
    }

    // Ctrl+D → duplicate line
    if (e.key === 'd' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineEnd, text } = getLine(selectionStart)
      textarea.selectionStart = textarea.selectionEnd = lineEnd
      execInsert(`\n${text}`)
      return
    }

    // Enter → auto-continue list item
    if (
      e.key === 'Enter' &&
      !ctrlOrMeta &&
      !e.shiftKey &&
      !e.altKey &&
      selectionStart === selectionEnd
    ) {
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      if (selectionStart !== lineEnd) return

      const bulletMatch = text.match(/^(\s*)([-*]) (.+)$/)
      const numberedMatch = text.match(/^(\s*)(\d+)\. (.+)$/)
      const emptyBullet = text.match(/^(\s*)([-*]) $/)
      const emptyNumbered = text.match(/^(\s*)(\d+)\. $/)

      if (emptyBullet || emptyNumbered) {
        e.preventDefault()
        replaceLine(lineStart, lineEnd, '')
        return
      }
      if (bulletMatch) {
        e.preventDefault()
        execInsert(`\n${bulletMatch[1]}${bulletMatch[2]} `)
        return
      }
      if (numberedMatch) {
        e.preventDefault()
        const nextNum = parseInt(numberedMatch[2] ?? '1') + 1
        execInsert(`\n${numberedMatch[1] ?? ''}${nextNum}. `)
        return
      }
    }
  }, [])

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
    a.click()
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
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
