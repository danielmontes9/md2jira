import { useState, useCallback, type RefObject } from 'react'
import type { OutputFormat } from '../types.js'

export interface JiraCopyState {
  copied: boolean
  copyError: boolean
  handleCopy: () => Promise<void>
}

/**
 * Manages the "Copy for Jira" clipboard logic.
 *
 * - ADF format: writes both text/html (rendered HTML) and text/plain to the clipboard
 *   so rich Jira editors receive formatted content.
 * - Wiki Markup format: plain text write only.
 * - Falls back to writeText() if write() is unsupported (e.g. Firefox, sandboxed iframes).
 */
export function useJiraCopy(
  value: string,
  format: OutputFormat,
  editorRef: RefObject<HTMLDivElement>
): JiraCopyState {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      if (format === 'adf') {
        const currentHtml = editorRef.current?.innerHTML ?? ''
        const blob = new Blob([currentHtml], { type: 'text/html' })
        const textBlob = new Blob([value], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob }),
        ])
      } else {
        await navigator.clipboard.writeText(value)
      }
    } catch {
      // Fallback for browsers that block the Clipboard API (e.g. Firefox, sandboxed iframes)
      try {
        await navigator.clipboard.writeText(value)
      } catch {
        setCopyError(true)
        setTimeout(() => setCopyError(false), 2000)
        return
      }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value, format, editorRef])

  return { copied, copyError, handleCopy }
}
