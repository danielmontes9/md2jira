import { useState, useEffect, useCallback, useRef } from 'react'

/** Exported so HistorySidebar and tests share the same key without duplication. */
export const LS_KEY = 'md2jira-doc-history'
/** Debounce in ms before a document is auto-saved to history. Exported for tests. */
export const SAVE_DEBOUNCE_MS = 3_000

export interface HistoryEntry {
  id: string
  title: string
  content: string
  savedAt: number
}

/** Extract a readable title from the document (first heading or first line).
 *  Uses indexOf instead of split('\n') to avoid allocating an intermediate array
 *  for the full document just to find the first non-empty line.
 */
function extractTitle(content: string): string {
  let start = 0
  while (start < content.length) {
    const end = content.indexOf('\n', start)
    const line = (end === -1 ? content.slice(start) : content.slice(start, end)).trim()
    if (line.length > 0) {
      const titleText = line.replace(/^#+\s+/, '')
      return titleText.length > 60 ? `${titleText.slice(0, 60)}…` : titleText || 'Untitled'
    }
    if (end === -1) break
    start = end + 1
  }
  return 'Untitled'
}

/** Runtime type guard — validates that an entry read from storage has all required fields. */
export function isValidEntry(entry: unknown): entry is HistoryEntry {
  if (!entry || typeof entry !== 'object') return false
  const e = entry as Record<string, unknown>
  return (
    typeof e['id'] === 'string' &&
    typeof e['title'] === 'string' &&
    typeof e['content'] === 'string' &&
    typeof e['savedAt'] === 'number' &&
    Number.isFinite(e['savedAt'] as number)
  )
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidEntry)
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

/** Normalise line-endings and trim so CRLF/LF differences don't create duplicates. */
function norm(s: string): string {
  return s.trim().replace(/\r\n/g, '\n')
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
  /** Immediately save a specific content string to history (bypasses debounce). */
  saveContent: (content: string) => void
  renameEntry: (id: string, newTitle: string) => void
  /** Timestamp (ms since epoch) of the last autosave, or null if not yet saved. */
  lastSavedAt: number | null
}

export function useDocumentHistory({
  markdown,
  enabled,
  maxEntries,
}: UseDocumentHistoryOptions): UseDocumentHistoryReturn {
  const [history, setHistory] = useState<HistoryEntry[]>(() => (enabled ? loadHistory() : []))
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  // Mirror the history array in a ref so stable callbacks can read the latest
  // value without capturing it in their dependency arrays (prevents cascade
  // re-renders on every auto-save). Also lets side effects — localStorage
  // writes and setLastSavedAt — live outside functional updaters, which
  // keeps the hook compliant with React Strict Mode's double-invocation of
  // updaters in development.
  const historyRef = useRef(history)
  historyRef.current = history // synchronous assignment — safe in render body

  // Refs for values that stable callbacks need to read at call-time without
  // capturing them in dependency arrays. Assigned synchronously in the render
  // body so they are always up to date before any effect or callback runs.
  const markdownRef = useRef(markdown)
  markdownRef.current = markdown
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const maxEntriesRef = useRef(maxEntries)
  maxEntriesRef.current = maxEntries
  const lastSavedAtRef = useRef(lastSavedAt)
  lastSavedAtRef.current = lastSavedAt

  // Skip the reload effect on the very first render: useState already called
  // loadHistory() in its initializer, so a second read + setState on mount
  // would produce a spurious re-render and an extra localStorage access.
  // Note: React 18 Strict Mode (dev-only) mounts → unmounts → remounts effects,
  // so only the first fire is skipped; the remount fire still reads localStorage
  // once. This is harmless and only happens in development.
  const isFirstMountRef = useRef(true)

  // Internal helper: single source of truth for the dedup + maxEntries logic
  // and persistence. Called by saveNow, saveContent, and the auto-save timer.
  // Empty deps — permanently stable reference.
  const commitEntry = useCallback((content: string) => {
    if (!content.trim()) return
    // Pre-compute once — reused for both the top-entry dedup check and the
    // full filter below, avoiding up to maxEntries redundant norm() calls.
    const normContent = norm(content)
    const prev = historyRef.current
    // Pre-compute the top entry's normalised content for the early-return dedup
    // check. The filter below skips prev[0] entirely (i === 0 bypass), so
    // norm(prev[0].content) is only ever called once per commitEntry invocation.
    const normTop = prev.length > 0 ? norm(prev[0]!.content) : null
    if (normTop === normContent) return
    const now = Date.now()
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      title: extractTitle(content),
      content,
      savedAt: now,
    }
    // Filter removes any deeper duplicate so the new entry is always unique.
    // prev[0] is always kept (normTop !== normContent is guaranteed by the early
    // return above); only entries at index > 0 need the full norm() check.
    const deduplicated = prev.filter((e, i) => i === 0 || norm(e.content) !== normContent)
    const updated = [entry, ...deduplicated].slice(0, maxEntriesRef.current ?? 10)
    // Side effects outside a functional updater: keeps the hook compliant with
    // React Strict Mode's double-invocation of updaters in development.
    setHistory(updated)
    saveHistory(updated)
    setLastSavedAt(now)
  }, [])

  // Reload from storage when feature is enabled
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false
      return
    }
    if (enabled) {
      setHistory(loadHistory())
    } else {
      setHistory([])
      setLastSavedAt(null) // clear stale timestamp so AutoSaveLabel doesn't show obsolete text
    }
  }, [enabled])

  // Sync history across browser tabs: when another tab writes to localStorage,
  // reload the list so all tabs stay in sync.
  useEffect(() => {
    if (!enabled) return
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) setHistory(loadHistory())
    }
    const ac = new AbortController()
    window.addEventListener('storage', handler, { signal: ac.signal })
    return () => ac.abort()
  }, [enabled])

  // Auto-save with debounce — only when enabled and content is non-empty
  useEffect(() => {
    if (!enabled || !markdown.trim()) return

    const t = setTimeout(() => {
      const md = markdownRef.current
      // Re-check at fire time: user may have cleared the editor or disabled
      // history during the 3 s debounce window.
      if (!enabledRef.current || !md.trim()) return
      commitEntry(md)
    }, SAVE_DEBOUNCE_MS)

    return () => clearTimeout(t)
    // commitEntry has [] deps and is permanently stable — included here only
    // to satisfy the exhaustive-deps lint rule; it will never trigger a re-run.
  }, [markdown, enabled, maxEntries, commitEntry])

  // Empty deps: reads from the ref, so this reference is permanently stable
  // and won't force re-creation of handleLoadEntry in App.tsx on every save.
  const loadEntry = useCallback((id: string): string | null => {
    return historyRef.current.find((e) => e.id === id)?.content ?? null
  }, [])

  const deleteEntry = useCallback((id: string) => {
    const prev = historyRef.current
    const updated = prev.filter((e) => e.id !== id)
    // Single pass: if length is unchanged, the id didn't exist — skip.
    if (updated.length === prev.length) return
    setHistory(updated)
    saveHistory(updated)
  }, [])

  const deleteEntries = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const prev = historyRef.current
    const updated = prev.filter((e) => !idSet.has(e.id))
    // Single pass: if length is unchanged, none of the ids existed — skip.
    if (updated.length === prev.length) return
    setHistory(updated)
    saveHistory(updated)
  }, [])

  const clearHistory = useCallback(() => {
    // Skip re-render when history is already empty and label is already hidden.
    // Reads from refs so this callback stays permanently stable ([] deps).
    if (historyRef.current.length === 0 && lastSavedAtRef.current === null) return
    setHistory([])
    setLastSavedAt(null) // reset the AutoSaveLabel so it doesn't show stale text
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      // ignore
    }
  }, [])

  // commitEntry is stable ([] deps) → saveNow is also permanently stable.
  // MarkdownInput's onSave prop and handleNewDocument in App.tsx never cause
  // memo() or useCallback invalidations on keystrokes.
  const saveNow = useCallback(() => {
    if (!enabledRef.current) return
    commitEntry(markdownRef.current)
  }, [commitEntry])

  // commitEntry is stable ([] deps) → saveContent is also permanently stable.
  // Stable reference prevents handleNewDocument in App.tsx from being
  // recreated when settings change.
  const saveContent = useCallback(
    (content: string) => {
      if (!enabledRef.current) return
      commitEntry(content)
    },
    [commitEntry]
  )

  // Same pattern as deleteEntry: compute outside updater so Strict Mode's
  // double-invocation of updaters doesn't write to localStorage twice.
  const renameEntry = useCallback((id: string, newTitle: string) => {
    const prev = historyRef.current
    let changed = false
    const updated = prev.map((e) => {
      if (e.id !== id) return e
      const title = newTitle.trim() || e.title
      if (title === e.title) return e // same title — no mutation needed
      changed = true
      return { ...e, title }
    })
    // Single pass: if nothing changed (id not found or title identical) — skip.
    if (!changed) return
    setHistory(updated)
    saveHistory(updated)
  }, [])

  return {
    history,
    loadEntry,
    deleteEntry,
    deleteEntries,
    clearHistory,
    saveNow,
    saveContent,
    renameEntry,
    lastSavedAt,
  }
}
