import { useEffect, useRef } from 'react'
import type { OutputFormat } from '../types.js'

interface UseKeyboardShortcutsOptions {
  historyEnabled: boolean
  saveNow: () => void
  setFormat: (fmt: OutputFormat) => void
  setShowHistory: (updater: (prev: boolean) => boolean) => void
  setMarkdown: (value: string) => void
}

/**
 * Registers global keyboard shortcuts for the app:
 * - Ctrl/Cmd+S      → save current document to history
 * - Alt+H           → toggle the history sidebar
 * - Alt+N           → new document (saves current content first)
 * - Alt+Shift+A     → switch to Jira Cloud (ADF) output format
 * - Alt+Shift+W     → switch to Wiki Markup output format
 * - Alt+Shift+C     → switch to Confluence Storage Format
 *
 * Using Alt+Shift for format keys avoids conflicts with dead-key / compose
 * sequences on macOS Latino keyboards (Alt+A produces å, etc.).
 */
export function useKeyboardShortcuts({
  historyEnabled,
  saveNow,
  setFormat,
  setShowHistory,
  setMarkdown,
}: UseKeyboardShortcutsOptions): void {
  // Stable ref so the Alt+N handler always calls the latest saveNow without
  // needing to re-register the document listener on every markdown change.
  const saveNowRef = useRef(saveNow)
  useEffect(() => {
    saveNowRef.current = saveNow
  }, [saveNow])

  // Ctrl/Cmd+S → save to history (no-op when history is disabled)
  useEffect(() => {
    if (!historyEnabled) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveNowRef.current()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [historyEnabled])

  // Alt+H / Alt+N / Alt+Shift+A|W|C navigation and format shortcuts.
  // Registered once on mount; stable setter references make [] safe here.
  useEffect(() => {
    const ac = new AbortController()
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.altKey && !e.shiftKey && e.key === 'h') {
          e.preventDefault()
          setShowHistory((v) => !v)
          return
        }
        if (e.altKey && !e.shiftKey && e.key === 'n') {
          e.preventDefault()
          saveNowRef.current()
          setMarkdown('')
          return
        }
        if (!e.altKey || !e.shiftKey) return
        if (e.key === 'A') {
          e.preventDefault()
          setFormat('adf')
        } else if (e.key === 'W') {
          e.preventDefault()
          setFormat('wiki')
        } else if (e.key === 'C') {
          e.preventDefault()
          setFormat('confluence')
        }
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [setFormat, setShowHistory, setMarkdown])
}
