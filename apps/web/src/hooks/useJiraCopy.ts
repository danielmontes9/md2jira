import { useState, useCallback, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import type { OutputFormat } from '../types.js'
import { useToast } from '../context/ToastContext.js'

export interface JiraCopyState {
  copied: boolean
  handleCopy: () => Promise<void>
}

/**
 * Manages the "Copy for Jira" clipboard logic.
 *
 * - ADF format: writes both text/html (rendered HTML) and text/plain to the clipboard
 *   so rich Jira editors receive formatted content.
 * - Wiki Markup format: plain text write only.
 * - Falls back to writeText() if write() is unsupported (e.g. Firefox, sandboxed iframes).
 * - Shows a toast notification if all clipboard methods fail.
 */
export function useJiraCopy(
  value: string,
  format: OutputFormat,
  editor: Editor | null
): JiraCopyState {
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const addToast = useToast()

  // Keep a ref so handleCopy always reads the latest value without being in its deps.
  const valueRef = useRef(value)
  valueRef.current = value

  // Clean up the "copied" reset timer on unmount.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      if (format === 'adf') {
        const currentHtml = editor?.getHTML() ?? ''
        const blob = new Blob([currentHtml], { type: 'text/html' })
        const textBlob = new Blob([valueRef.current], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob }),
        ])
      } else {
        await navigator.clipboard.writeText(valueRef.current)
      }
    } catch {
      // Fallback for browsers that block the Clipboard API (e.g. Firefox, sandboxed iframes)
      try {
        await navigator.clipboard.writeText(valueRef.current)
      } catch {
        addToast('Failed to copy to clipboard', 'error')
        return
      }
    }
    setCopied(true)
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }, [format, editor, addToast])

  return { copied, handleCopy }
}
