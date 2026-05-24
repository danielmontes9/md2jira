import { memo, useRef, useEffect, useState, useCallback, useId } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ChangeEvent } from 'react'
import { IconHistory, IconClose, IconSearch } from './icons.js'
import type { HistoryEntry } from '../hooks/useDocumentHistory.js'
import { LS_KEY, isValidEntry } from '../hooks/useDocumentHistory.js'
import { useSettings } from '../context/SettingsContext.js'
import { useT } from '../i18n/index.js'
import type { StringKey } from '../i18n/en.js'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface HistorySidebarProps {
  history: HistoryEntry[]
  currentMarkdown?: string
  onLoadEntry: (id: string) => void
  onDeleteEntry: (id: string) => void
  onDeleteEntries?: (ids: string[]) => void
  onClearHistory: () => void
  onClose: () => void
  /** Called when the user renames an entry in-sidebar. */
  onRenameEntry?: (id: string, newTitle: string) => void
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

type DateGroupKey = Extract<StringKey, 'dateToday' | 'dateYesterday' | 'dateThisWeek' | 'dateOlder'>

/** Returns one of the i18n date-group keys */
function dateGroup(ts: number): DateGroupKey {
  const now = new Date()
  const d = new Date(ts)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const diff = todayStart - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayMs = 86_400_000
  if (diff <= 0) return 'dateToday'
  if (diff <= dayMs) return 'dateYesterday'
  if (diff <= 6 * dayMs) return 'dateThisWeek'
  return 'dateOlder'
}

const GROUP_ORDER: DateGroupKey[] = ['dateToday', 'dateYesterday', 'dateThisWeek', 'dateOlder']

export const HistorySidebar = memo(function HistorySidebar({
  history,
  currentMarkdown,
  onLoadEntry,
  onDeleteEntry,
  onDeleteEntries,
  onClearHistory,
  onClose,
  onRenameEntry,
}: HistorySidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [query, setQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const searchId = useId()
  const t = useT()
  const { maxHistoryEntries } = useSettings()

  const activeId = currentMarkdown?.trim()
    ? history.find((e) => e.content === currentMarkdown)?.id
    : undefined

  // Filter by query — searches both title and content so users can find
  // documents by any word they remember, not just the first-line title.
  const q = query.trim().toLowerCase()
  const filtered = q
    ? history.filter(
        (e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      )
    : history

  // Group filtered entries
  const grouped = GROUP_ORDER.reduce<Record<string, HistoryEntry[]>>((acc, g) => {
    const items = filtered.filter((e) => dateGroup(e.savedAt) === g)
    if (items.length > 0) acc[g] = items
    return acc
  }, {})

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
    const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    focusable?.[0]?.focus()
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        // If renaming, cancel rename first rather than closing the sidebar
        if (renamingId) {
          e.preventDefault()
          setRenamingId(null)
          return
        }
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose, renamingId]
  )

  const startRename = useCallback((entry: HistoryEntry) => {
    setRenamingId(entry.id)
    setRenameValue(entry.title)
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)))
    }
  }, [selectedIds.size, filtered])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    if (onDeleteEntries) {
      onDeleteEntries(ids)
    } else {
      ids.forEach((id) => onDeleteEntry(id))
    }
    exitSelectMode()
  }, [selectedIds, onDeleteEntries, onDeleteEntry, exitSelectMode])

  const commitRename = useCallback(
    (id: string) => {
      const trimmed = renameValue.trim()
      if (trimmed && trimmed !== history.find((e) => e.id === id)?.title) {
        onRenameEntry?.(id, trimmed)
      }
      setRenamingId(null)
    },
    [renameValue, history, onRenameEntry]
  )

  // ── Export / Import ──────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const json = JSON.stringify(history, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `md2jira-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [history])

  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImportFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const raw: unknown = JSON.parse(reader.result as string)
          if (!Array.isArray(raw)) return
          const parsed = raw.filter(isValidEntry)
          // Merge: keep existing entries not already in the imported set
          const existingIds = new Set(history.map((h) => h.id))
          const newEntries = parsed.filter((p) => !existingIds.has(p.id))
          const merged = [...newEntries, ...history].slice(0, maxHistoryEntries)
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(merged))
          } catch {
            // ignore quota errors
          }
          // Trigger cross-tab sync by dispatching a storage event
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: LS_KEY,
              newValue: JSON.stringify(merged),
            })
          )
        } catch {
          // invalid JSON — ignore
        }
      }
      reader.readAsText(file)
      // Reset input so the same file can be re-imported
      e.target.value = ''
    },
    [history, maxHistoryEntries]
  )

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />
      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('recentDocuments')}
        className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onKeyDown={handleKeyDown}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('recentDocuments')}
            {history.length > 0 && (
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs font-normal text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {history.length}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            aria-label={t('closeHistory')}
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleImportFile}
        />

        {/* ── Search bar ── */}
        {history.length > 0 && (
          <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
              <IconSearch className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
              <label htmlFor={searchId} className="sr-only">
                Search history
              </label>
              <input
                id={searchId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-xs text-neutral-800 placeholder-neutral-400 outline-none dark:text-neutral-200 dark:placeholder-neutral-500"
                aria-label={t('searchHistory')}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                  aria-label={t('clearSearch')}
                >
                  <IconClose className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Entry list ── */}
        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <IconHistory className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {t('noDocumentsYet')}
                <br />
                {t('historyEnableHint')}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-xs text-neutral-400 dark:text-neutral-500">
              {t('historyNoMatch')} &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {t(group)}
                  </p>
                  <ul className="flex flex-col gap-1.5" role="list">
                    {grouped[group]!.map((entry) => {
                      const isActive = entry.id === activeId
                      const isRenaming = entry.id === renamingId
                      const isSelected = selectedIds.has(entry.id)
                      return (
                        <li
                          key={entry.id}
                          className={`group flex flex-col rounded-lg border px-3 py-2.5 transition-colors ${
                            isSelected
                              ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/40'
                              : isActive
                                ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
                                : 'border-neutral-100 bg-neutral-50 hover:border-blue-200 hover:bg-blue-50/50 dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:border-blue-900 dark:hover:bg-blue-950/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            {selectMode ? (
                              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(entry.id)}
                                  className="h-3.5 w-3.5 shrink-0 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
                                  aria-label={`Select "${entry.title}"`}
                                />
                                <span className="min-w-0 truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                  {entry.title}
                                </span>
                              </label>
                            ) : isRenaming ? (
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => commitRename(entry.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitRename(entry.id)
                                  if (e.key === 'Escape') setRenamingId(null)
                                  e.stopPropagation()
                                }}
                                autoFocus
                                className="min-w-0 flex-1 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-600 dark:bg-neutral-900 dark:text-neutral-200"
                                aria-label={t('renameEntryLabel')}
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => onLoadEntry(entry.id)}
                                className={`min-w-0 flex-1 truncate text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                                  isActive
                                    ? 'text-blue-700 dark:text-blue-400'
                                    : 'text-neutral-800 hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400'
                                }`}
                                title={entry.title}
                              >
                                {isActive && (
                                  <span
                                    role="img"
                                    data-testid="active-indicator"
                                    className="mr-1 text-blue-500"
                                    aria-label={t('currentlyLoaded')}
                                  >
                                    {'\u25CF'}
                                  </span>
                                )}
                                {entry.title}
                              </button>
                            )}
                            {!isRenaming && !selectMode && (
                              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => startRename(entry)}
                                  className="rounded p-0.5 text-neutral-300 hover:text-blue-500 dark:text-neutral-600 dark:hover:text-blue-400 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                                  aria-label={`Rename "${entry.title}"`}
                                >
                                  {/* Pencil icon */}
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteEntry(entry.id)}
                                  className="rounded p-0.5 text-neutral-300 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                                  aria-label={`Delete "${entry.title}" from history`}
                                >
                                  <IconClose className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                            {formatDate(entry.savedAt)} {'\u00B7'}{' '}
                            {entry.content.length.toLocaleString()} chars
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="shrink-0 border-t border-neutral-200 px-3 py-2.5 dark:border-neutral-800">
          {selectMode ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="rounded px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              >
                {t('historyDeleteSelected')}
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              >
                {selectedIds.size === filtered.length && filtered.length > 0
                  ? t('historyDeselectAll')
                  : t('historySelectAll')}
              </button>
              <button
                type="button"
                onClick={exitSelectMode}
                className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              >
                {t('historyCancelSelect')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Import — always available */}
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                title="Import history from JSON"
                className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label={t('importHistory')}
              >
                {t('historyImport')}
              </button>
              {history.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleExport}
                    title="Export history as JSON"
                    className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                    aria-label={t('exportHistory')}
                  >
                    {t('historyExport')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectMode(true)}
                    aria-label={t('historySelectModeAriaLabel')}
                    className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                  >
                    {t('historySelectMode')}
                  </button>
                  <div className="ml-auto">
                    {confirmClear ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('clearAllPrompt')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClearHistory()
                            setConfirmClear(false)
                          }}
                          className="rounded px-2 py-0.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                        >
                          {t('clearEditorYes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="rounded px-2 py-0.5 text-xs text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                        >
                          {t('clearEditorNo')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-red-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                      >
                        {t('clearAll')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
})
