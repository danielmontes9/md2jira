import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'
// NOTE: value is kept as a param (not read inside the effect) so that
// handleCopyMd always captures the latest markdown via closure.
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
  textareaRef: RefObject<HTMLTextAreaElement>,
  addToast: (msg: string, type: ToastType) => void,
  onChange: (value: string) => void
): { copiedMd: boolean; handleCopyMd: () => void } {
  const [copiedMd, setCopiedMd] = useState(false)
  const copiedMdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks whether the hook is still mounted so async clipboard callbacks
  // don't call setState after the component unmounts.
  const mountedRef = useRef(true)

  // Keep a stable ref to onChange so the native paste handler always sees the
  // latest version without re-registering the event listener on every render.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Clean up the "copied" reset timer on unmount.
  useEffect(() => {
    return () => {
      mountedRef.current = false
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
    // Calls onChange directly (the React-idiomatic way for controlled inputs) and
    // then restores the cursor position via requestAnimationFrame after re-render.
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      const plain = e.clipboardData.getData('text/plain')
      e.preventDefault()
      const { selectionStart, selectionEnd, value: current } = textarea
      const newValue = current.slice(0, selectionStart) + plain + current.slice(selectionEnd)
      onChangeRef.current(newValue)
      // Restore insertion point after React re-renders the controlled textarea.
      const newPos = selectionStart + plain.length
      requestAnimationFrame(() => {
        textarea.setSelectionRange(newPos, newPos)
      })
    }

    const ac = new AbortController()
    const { signal } = ac
    textarea.addEventListener('copy', handleCopy, { signal })
    textarea.addEventListener('paste', handlePaste, { signal })
    return () => ac.abort()
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
      if (!mountedRef.current) return
      setCopiedMd(true)
      if (copiedMdTimerRef.current !== null) clearTimeout(copiedMdTimerRef.current)
      copiedMdTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setCopiedMd(false)
      }, 1500)
    }
    navigator.clipboard
      .write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })])
      .then(done)
      .catch(() =>
        navigator.clipboard
          .writeText(value)
          .then(done)
          .catch(() => {
            if (mountedRef.current) addToast('Failed to copy to clipboard', 'error')
          })
      )
  }, [value, addToast])

  return { copiedMd, handleCopyMd }
}
