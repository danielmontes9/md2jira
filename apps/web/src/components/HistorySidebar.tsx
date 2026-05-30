import { memo, useRef, useEffect, useState, useCallback, useId, useMemo } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ChangeEvent } from 'react'
import { IconHistory, IconClose, IconSearch } from './icons.js'
import type { HistoryEntry } from '../hooks/useDocumentHistory.js'
import { LS_KEY, isValidEntry } from '../hooks/useDocumentHistory.js'
import { Modal } from './Modal.js'
import { useSettings } from '../context/SettingsContext.js'
import { useT, useTI } from '../i18n/index.js'
import type { StringKey } from '../i18n/en.js'

type DiffLine = { type: 'eq' | 'add' | 'del'; text: string }

/** LCS table is capped to prevent O(m×n) freeze on large documents. */
const MAX_DIFF_LINES = 500

function computeLineDiff(a: string, b: string): { lines: DiffLine[]; truncated: boolean } {
  const aAll = a.split('\n')
  const bAll = b.split('\n')
  const truncated = aAll.length > MAX_DIFF_LINES || bAll.length > MAX_DIFF_LINES
  const aLines = aAll.slice(0, MAX_DIFF_LINES)
  const bLines = bAll.slice(0, MAX_DIFF_LINES)
  // Simple Myers-LCS using dynamic programming
  const m = aLines.length
  const n = bLines.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[])
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        aLines[i - 1] === bLines[j - 1]
          ? dp[i - 1]![j - 1]! + 1
          : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!)
    }
  }
  const result: DiffLine[] = []
  let i = m,
    j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.unshift({ type: 'eq', text: aLines[i - 1]! })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.unshift({ type: 'add', text: bLines[j - 1]! })
      j--
    } else {
      result.unshift({ type: 'del', text: aLines[i - 1]! })
      i--
    }
  }
  return { lines: result, truncated }
}

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
  /** Called after a successful history import with the count of newly added entries. */
  onImportSuccess?: (newCount: number) => void
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

// ── HistorySearchBar ─────────────────────────────────────────────────────────

interface HistorySearchBarProps {
  searchId: string
  query: string
  onQueryChange: (q: string) => void
}

/** Search input for the history sidebar — searches both title and document content. */
function HistorySearchBar({ searchId, query, onQueryChange }: HistorySearchBarProps) {
  const t = useT()
  return (
    <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
      <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
        <IconSearch className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
        <label htmlFor={searchId} className="sr-only">
          {t('searchHistory')}
        </label>
        <input
          id={searchId}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-xs text-neutral-800 placeholder-neutral-400 outline-none dark:text-neutral-200 dark:placeholder-neutral-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            aria-label={t('clearSearch')}
          >
            <IconClose className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── HistoryEntryRow ──────────────────────────────────────────────────────────

interface HistoryEntryRowProps {
  entry: HistoryEntry
  isActive: boolean
  isRenaming: boolean
  isSelected: boolean
  selectMode: boolean
  currentMarkdown?: string | undefined
  renameValue: string
  onLoad: () => void
  onDelete: () => void
  onToggleSelect: () => void
  onStartRename: () => void
  onCommitRename: () => void
  onCancelRename: () => void
  onRenameValueChange: (v: string) => void
  onOpenDiff: () => void
}

/** Renders a single history entry row with load, rename, diff, and delete actions. */
function HistoryEntryRow({
  entry,
  isActive,
  isRenaming,
  isSelected,
  selectMode,
  currentMarkdown,
  renameValue,
  onLoad,
  onDelete,
  onToggleSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRenameValueChange,
  onOpenDiff,
}: HistoryEntryRowProps) {
  const t = useT()
  const ti = useTI()
  return (
    <li
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
              onChange={onToggleSelect}
              className="h-3.5 w-3.5 shrink-0 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
              aria-label={ti('selectEntryLabel', { title: entry.title })}
            />
            <span className="min-w-0 truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {entry.title}
            </span>
          </label>
        ) : isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitRename()
              if (e.key === 'Escape') onCancelRename()
              e.stopPropagation()
            }}
            autoFocus
            className="min-w-0 flex-1 rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-600 dark:bg-neutral-900 dark:text-neutral-200"
            aria-label={t('renameEntryLabel')}
          />
        ) : (
          <button
            type="button"
            onClick={onLoad}
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
            {currentMarkdown !== undefined && currentMarkdown !== entry.content && (
              <button
                type="button"
                onClick={onOpenDiff}
                className="rounded p-0.5 text-neutral-300 hover:text-indigo-500 dark:text-neutral-600 dark:hover:text-indigo-400 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 text-[10px] font-mono leading-none px-1"
                aria-label={t('historyDiff')}
                title={t('historyDiff')}
              >
                diff
              </button>
            )}
            <button
              type="button"
              onClick={onStartRename}
              className="rounded p-0.5 text-neutral-300 hover:text-blue-500 dark:text-neutral-600 dark:hover:text-blue-400 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={ti('renameEntryAction', { title: entry.title })}
            >
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
              onClick={onDelete}
              className="rounded p-0.5 text-neutral-300 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={ti('deleteEntryLabel', { title: entry.title })}
            >
              <IconClose className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <span className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
        {formatDate(entry.savedAt)} {'\u00B7'} {entry.content.length.toLocaleString()}{' '}
        {t('charsLabel')}
      </span>
    </li>
  )
}

// ── HistoryBulkBar ───────────────────────────────────────────────────────────

interface HistoryBulkBarProps {
  selectedCount: number
  totalFiltered: number
  onDeleteSelected: () => void
  onToggleSelectAll: () => void
  onCancel: () => void
}

/** Footer toolbar shown in select mode — delete selected, select/deselect all, cancel. */
function HistoryBulkBar({
  selectedCount,
  totalFiltered,
  onDeleteSelected,
  onToggleSelectAll,
  onCancel,
}: HistoryBulkBarProps) {
  const t = useT()
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  // Reset confirm state when nothing is selected (e.g. user deselects all)
  useEffect(() => {
    if (selectedCount === 0) setConfirmBulkDelete(false)
  }, [selectedCount])

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          if (confirmBulkDelete) {
            onDeleteSelected()
            setConfirmBulkDelete(false)
          } else {
            setConfirmBulkDelete(true)
          }
        }}
        disabled={selectedCount === 0}
        className={`rounded px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500${confirmBulkDelete ? ' ring-1 ring-red-400 dark:ring-red-600' : ''}`}
      >
        {confirmBulkDelete ? t('historyDeleteSelectedConfirm') : t('historyDeleteSelected')}
        {selectedCount > 0 ? ` (${selectedCount})` : ''}
      </button>
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
      >
        {selectedCount === totalFiltered && totalFiltered > 0
          ? t('historyDeselectAll')
          : t('historySelectAll')}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirmBulkDelete(false)
          onCancel()
        }}
        className="rounded px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
      >
        {t('historyCancelSelect')}
      </button>
    </div>
  )
}

// ── DiffModal ────────────────────────────────────────────────────────────────

function DiffModal({
  entry,
  currentMarkdown,
  onClose,
}: {
  entry: HistoryEntry
  currentMarkdown: string
  onClose: () => void
}) {
  const t = useT()
  const modalId = useId()
  const { lines: diff, truncated: diffTruncated } = useMemo(
    () => computeLineDiff(entry.content, currentMarkdown),
    [entry.content, currentMarkdown]
  )
  const hasChanges = diff.some((l) => l.type !== 'eq')

  return (
    <Modal onClose={onClose} ariaLabelledBy={modalId}>
      <div className="flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <h2 id={modalId} className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('historyDiffModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            aria-label={t('close')}
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-4 border-b border-neutral-100 px-5 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            {t('historyDiffLabelBefore')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
            {t('historyDiffLabelAfter')}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-1 font-mono text-xs">
          {diffTruncated && (
            <p className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              {t('historyDiffTruncated').replace('{n}', String(MAX_DIFF_LINES))}
            </p>
          )}
          {!hasChanges ? (
            <p className="px-4 py-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {t('historyDiffNoChanges')}
            </p>
          ) : (
            diff.map((line, i) => (
              <div
                key={i}
                className={`flex gap-1 px-3 py-0.5 leading-5 ${
                  line.type === 'add'
                    ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                    : line.type === 'del'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                      : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                <span className="w-4 shrink-0 select-none">
                  {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                </span>
                <span className="min-w-0 break-all">{line.text || '\u00a0'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

export const HistorySidebar = memo(function HistorySidebar({
  history,
  currentMarkdown,
  onLoadEntry,
  onDeleteEntry,
  onDeleteEntries,
  onClearHistory,
  onClose,
  onRenameEntry,
  onImportSuccess,
}: HistorySidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [query, setQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectMode, setSelectMode] = useState(false)
  const [diffEntry, setDiffEntry] = useState<HistoryEntry | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const searchId = useId()
  const t = useT()
  const ti = useTI()
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
          onImportSuccess?.(newEntries.length)
        } catch {
          // invalid JSON — ignore
        }
      }
      reader.readAsText(file)
      // Reset input so the same file can be re-imported
      e.target.value = ''
    },
    [history, maxHistoryEntries, onImportSuccess]
  )

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40" onClick={onClose} />
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
          <HistorySearchBar searchId={searchId} query={query} onQueryChange={setQuery} />
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
                        <HistoryEntryRow
                          key={entry.id}
                          entry={entry}
                          isActive={isActive}
                          isRenaming={isRenaming}
                          isSelected={isSelected}
                          selectMode={selectMode}
                          currentMarkdown={currentMarkdown}
                          renameValue={renameValue}
                          onLoad={() => onLoadEntry(entry.id)}
                          onDelete={() => onDeleteEntry(entry.id)}
                          onToggleSelect={() => toggleSelect(entry.id)}
                          onStartRename={() => startRename(entry)}
                          onCommitRename={() => commitRename(entry.id)}
                          onCancelRename={() => setRenamingId(null)}
                          onRenameValueChange={setRenameValue}
                          onOpenDiff={() => setDiffEntry(entry)}
                        />
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
            <HistoryBulkBar
              selectedCount={selectedIds.size}
              totalFiltered={filtered.length}
              onDeleteSelected={handleDeleteSelected}
              onToggleSelectAll={handleToggleSelectAll}
              onCancel={exitSelectMode}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Import — always available */}
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                title={t('importHistoryTitle')}
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
                    title={t('exportHistoryTitle')}
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
      {diffEntry !== null && currentMarkdown !== undefined && (
        <DiffModal
          entry={diffEntry}
          currentMarkdown={currentMarkdown}
          onClose={() => setDiffEntry(null)}
        />
      )}
    </>
  )
})
