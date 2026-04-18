import { useState, useCallback, useEffect, type RefObject } from 'react'
import { execInsertText } from '../utils/exec-command.js'
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
  }, [textareaRef])

  // Clipboard button: write markdown with a <pre> HTML blob so Jira's
  // ProseMirror editor treats the paste as preformatted text.
  const handleCopyMd = useCallback(() => {
    const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const htmlBlob = new Blob(
      [`<pre style="font-family:monospace;white-space:pre-wrap;">${escaped}</pre>`],
      { type: 'text/html' }
    )
    const textBlob = new Blob([value], { type: 'text/plain' })
    const done = () => {
      setCopiedMd(true)
      setTimeout(() => setCopiedMd(false), 1500)
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
