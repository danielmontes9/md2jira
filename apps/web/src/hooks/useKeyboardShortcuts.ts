import { useEffect } from 'react'
import type { OutputFormat } from '../types.js'

interface UseKeyboardShortcutsOptions {
  historyEnabled: boolean
  saveNow: () => void
  setFormat: (fmt: OutputFormat) => void
  setShowHistory: (updater: (prev: boolean) => boolean) => void
  /** Called when Alt+N is pressed — opens the new-document modal in the editor. */
  onTriggerNewDocument: () => void
}

/**
 * Registers global keyboard shortcuts for the app:
 * - Ctrl/Cmd+S      → save current document to history
 * - Alt+H           → toggle the history sidebar
 * - Alt+N           → new document (opens the new-document modal)
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
  onTriggerNewDocument,
}: UseKeyboardShortcutsOptions): void {
  // Ctrl/Cmd+S → save to history (no-op when history is disabled)
  useEffect(() => {
    if (!historyEnabled) return
    const ac = new AbortController()
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault()
          saveNow()
        }
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [historyEnabled, saveNow])

  // Alt+H / Alt+N / Alt+Shift+A|W|C navigation and format shortcuts.
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
          // Alt+N — opens the new-document modal so the user can name the
          // new document before creation, consistent with the toolbar button.
          // saveNow() is called inside handleNewDocument after the user confirms.
          onTriggerNewDocument()
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
  }, [setFormat, setShowHistory, onTriggerNewDocument])
}
