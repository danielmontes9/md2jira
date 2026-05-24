import { useState, useEffect, useCallback } from 'react'

/** Exported so HistorySidebar and tests share the same key without duplication. */
export const LS_KEY = 'md2jira-doc-history'
/** Debounce in ms before a document is auto-saved to history. */
const SAVE_DEBOUNCE_MS = 3_000

export interface HistoryEntry {
  id: string
  title: string
  content: string
  savedAt: number
}

/** Extract a readable title from the document (first heading or first line). */
function extractTitle(content: string): string {
  const firstLine = content.split('\n').find((l) => l.trim().length > 0) ?? ''
  const titleText = firstLine.replace(/^#+\s+/, '').trim()
  return titleText.length > 60 ? `${titleText.slice(0, 60)}…` : titleText || 'Untitled'
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries))
  } catch {
    // localStorage unavailable or quota exceeded — skip silently
  }
}

interface UseDocumentHistoryOptions {
  markdown: string
  enabled: boolean
  /** Override the default cap of 10 entries. */
  maxEntries?: number
}

interface UseDocumentHistoryReturn {
  history: HistoryEntry[]
  loadEntry: (id: string) => string | null
  deleteEntry: (id: string) => void
  deleteEntries: (ids: string[]) => void
  clearHistory: () => void
  saveNow: () => void
  renameEntry: (id: string, newTitle: string) => void
}

export function useDocumentHistory({
  markdown,
  enabled,
  maxEntries,
}: UseDocumentHistoryOptions): UseDocumentHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>(() => (enabled ? loadHistory() : []))

  // Reload from storage when feature is enabled
  useEffect(() => {
    if (enabled) {
      setHistory(loadHistory())
    } else {
      setHistory([])
    }
  }, [enabled])

  // Sync history across browser tabs: when another tab writes to localStorage,
  // reload the list so all tabs stay in sync.
  useEffect(() => {
    if (!enabled) return
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) setHistory(loadHistory())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [enabled])

  // Auto-save with debounce — only when enabled and content is non-empty
  useEffect(() => {
    if (!enabled || !markdown.trim()) return

    const t = setTimeout(() => {
      setHistory((prev) => {
        const entry: HistoryEntry = {
          id: Date.now().toString(),
          title: extractTitle(markdown),
          content: markdown,
          savedAt: Date.now(),
        }
        // Drop any existing entry with identical content (normalise line-endings
        // so CRLF vs LF differences across platforms don't create duplicates).
        const norm = (s: string) => s.trim().replace(/\r\n/g, '\n')
        const deduplicated = prev.filter((e) => norm(e.content) !== norm(markdown))
        const updated = [entry, ...deduplicated].slice(0, maxEntries ?? 10)
        saveHistory(updated)
        return updated
      })
    }, SAVE_DEBOUNCE_MS)

    return () => clearTimeout(t)
  }, [markdown, enabled, maxEntries])

  const loadEntry = useCallback(
    (id: string): string | null => {
      return history.find((e) => e.id === id)?.content ?? null
    },
    [history]
  )

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id)
      saveHistory(updated)
      return updated
    })
  }, [])

  const deleteEntries = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setHistory((prev) => {
      const updated = prev.filter((e) => !idSet.has(e.id))
      saveHistory(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      // ignore
    }
  }, [])

  const saveNow = useCallback(() => {
    if (!enabled || !markdown.trim()) return
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        title: extractTitle(markdown),
        content: markdown,
        savedAt: Date.now(),
      }
      const deduplicated = prev.filter((e) => e.content !== markdown)
      const updated = [entry, ...deduplicated].slice(0, maxEntries ?? 10)
      saveHistory(updated)
      return updated
    })
  }, [markdown, enabled, maxEntries])

  const renameEntry = useCallback((id: string, newTitle: string) => {
    setHistory((prev) => {
      const updated = prev.map((e) =>
        e.id === id ? { ...e, title: newTitle.trim() || e.title } : e
      )
      saveHistory(updated)
      return updated
    })
  }, [])

  return { history, loadEntry, deleteEntry, deleteEntries, clearHistory, saveNow, renameEntry }
}
