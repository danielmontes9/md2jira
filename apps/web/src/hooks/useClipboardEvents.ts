import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'
import { execInsertText } from '../utils/exec-command.js'
import { escapeHtml } from '../utils/escape-html.js'
import type { ToastType } from '../components/Toast.js'

/**
 * Manages clipboard interactions for the Markdown textarea:
 * - Intercepts native copy to always write clean plain-text markdown (clears any
 *   lingering text/html from a previous "Copy for Jira" operation).
 * - Intercepts native paste to strip rich-text and insert plain text only.
 * - Provides a `handleCopyMd` callback that writes markdown wrapped in a
 *   `<pre>` HTML blob so Jira's ProseMirror editor treats it as preformatted text.
 */
export function useClipboardEvents(
  value: string,
  onChange: (v: string) => void,
  textareaRef: RefObject<HTMLTextAreaElement>,
  addToast: (msg: string, type: ToastType) => void
): { copiedMd: boolean; handleCopyMd: () => void } {
  const [copiedMd, setCopiedMd] = useState(false)
  const copiedMdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up the "copied" reset timer on unmount.
  useEffect(() => {
    return () => {
      if (copiedMdTimerRef.current !== null) clearTimeout(copiedMdTimerRef.current)
    }
  }, [])

  // Native event listeners are more reliable than React's synthetic onCopy/onPaste
  // for intercepting clipboard data.
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
      const escaped = escapeHtml(selected)
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
      // Use execCommand so native undo stack is preserved.
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
      execInsertText(plain)
      // Fallback for browsers that block execCommand.
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
    // textareaRef is the only dep needed: handlers read textarea.value directly
    // from the DOM element (always current) so stale-closure for `value` is not
    // possible. Adding `value` or `onChange` would re-register listeners on every
    // keystroke, creating a performance anti-pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textareaRef])

  // Clipboard button: write markdown with a <pre> HTML blob so Jira's
  // ProseMirror editor treats the paste as preformatted text.
  const handleCopyMd = useCallback(() => {
    const escaped = escapeHtml(value)
    const htmlBlob = new Blob(
      [`<pre style="font-family:monospace;white-space:pre-wrap;">${escaped}</pre>`],
      { type: 'text/html' }
    )
    const textBlob = new Blob([value], { type: 'text/plain' })
    const done = () => {
      setCopiedMd(true)
      if (copiedMdTimerRef.current !== null) clearTimeout(copiedMdTimerRef.current)
      copiedMdTimerRef.current = setTimeout(() => setCopiedMd(false), 1500)
    }
    navigator.clipboard
      .write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })])
      .then(done)
      .catch(() =>
        navigator.clipboard
          .writeText(value)
          .then(done)
          .catch(() => addToast('Failed to copy to clipboard', 'error'))
      )
  }, [value, addToast])

  return { copiedMd, handleCopyMd }
}
