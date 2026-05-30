import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useDocumentHistory,
  LS_KEY,
  SAVE_DEBOUNCE_MS,
  isValidEntry,
} from '../src/hooks/useDocumentHistory.js'

// Re-import extractTitle indirectly through saveNow title output
// (extractTitle is a private module function — tested via the public API)

beforeEach(() => {
  localStorage.clear()
})

// ── extractTitle (via saveNow title output) ────────────────────────────────────
describe('extractTitle — title extraction', () => {
  function getTitle(markdown: string): string {
    const { result } = renderHook(() => useDocumentHistory({ markdown, enabled: true }))
    act(() => result.current.saveNow())
    return result.current.history[0]?.title ?? ''
  }

  it('uses the first heading without the # prefix', () => {
    expect(getTitle('# Hello World')).toBe('Hello World')
  })

  it('skips leading blank lines and uses the first non-empty line', () => {
    expect(getTitle('\n\n## Section Title')).toBe('Section Title')
  })

  it('truncates titles longer than 60 characters with an ellipsis', () => {
    const long = '# ' + 'A'.repeat(70)
    const title = getTitle(long)
    expect(title.length).toBeLessThanOrEqual(61) // 60 chars + …
    expect(title.endsWith('…')).toBe(true)
  })

  it('saveNow guard prevents saving whitespace-only content', () => {
    // extractTitle would return \'Untitled\' for whitespace, but commitEntry
    // guards against empty/whitespace input before creating an entry.
    const { result } = renderHook(() => useDocumentHistory({ markdown: '   \n  ', enabled: true }))
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(0)
  })

  it("returns 'Untitled' when all lines are headings with no text", () => {
    expect(getTitle('# ')).toBe('Untitled')
  })

  it('handles level-2 and level-3 headings', () => {
    expect(getTitle('## Section')).toBe('Section')
    expect(getTitle('### Deep')).toBe('Deep')
  })

  it('uses plain text as title when the first line has no heading marker', () => {
    expect(getTitle('Hello world')).toBe('Hello world')
  })

  it('uses the full first line including leading punctuation when it is not a heading', () => {
    // Lines starting with '>' or other non-heading markers are not stripped —
    // the raw line becomes the title as-is.
    expect(getTitle('> blockquote text')).toBe('> blockquote text')
  })

  it('truncates plain-text titles longer than 60 characters with an ellipsis', () => {
    const long = 'A'.repeat(70) // no # prefix
    const title = getTitle(long)
    expect(title.length).toBeLessThanOrEqual(61) // 60 chars + …
    expect(title.endsWith('…')).toBe(true)
  })
})

// ── isValidEntry ─────────────────────────────────────────────────────────────

describe('isValidEntry — runtime type guard', () => {
  it('returns true for a well-formed HistoryEntry', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', content: '# Hello', savedAt: 123456 })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isValidEntry(null)).toBe(false)
  })

  it('returns false when savedAt is missing', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', content: '# Hello' })).toBe(false)
  })

  it('returns false when id is missing', () => {
    expect(isValidEntry({ title: 'T', content: '# Hello', savedAt: 123456 })).toBe(false)
  })

  it('returns false when title is missing', () => {
    expect(isValidEntry({ id: 'abc', content: '# Hello', savedAt: 123456 })).toBe(false)
  })

  it('returns false when content is missing', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', savedAt: 123456 })).toBe(false)
  })

  it('returns false when a field has the wrong type (savedAt is a string)', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', content: '# Hello', savedAt: '2026-01-01' })).toBe(
      false
    )
  })

  it('returns false when id has the wrong type (number instead of string)', () => {
    expect(isValidEntry({ id: 99, title: 'T', content: '# Hello', savedAt: 123456 })).toBe(false)
  })

  it('returns false when title has the wrong type (boolean instead of string)', () => {
    expect(isValidEntry({ id: 'abc', title: false, content: '# Hello', savedAt: 123456 })).toBe(
      false
    )
  })

  it('returns false when content has the wrong type (number instead of string)', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', content: 42, savedAt: 123456 })).toBe(false)
  })

  it('returns false when savedAt is NaN', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', content: '# Hello', savedAt: NaN })).toBe(false)
  })

  it('returns false when savedAt is Infinity', () => {
    expect(isValidEntry({ id: 'abc', title: 'T', content: '# Hello', savedAt: Infinity })).toBe(
      false
    )
  })

  it('returns false for undefined', () => {
    expect(isValidEntry(undefined)).toBe(false)
  })

  it('returns false for a number primitive', () => {
    expect(isValidEntry(42)).toBe(false)
  })

  it('returns false for a boolean primitive', () => {
    expect(isValidEntry(true)).toBe(false)
  })

  it('returns true for an entry with an empty-string id (guard does not require non-empty strings)', () => {
    // The guard only checks typeof === 'string', not length.
    // Empty-string ids are accepted — callers must ensure UUIDs are generated correctly.
    expect(isValidEntry({ id: '', title: 'T', content: '# Hello', savedAt: 123456 })).toBe(true)
  })
})

// ── enabled/disabled ───────────────────────────────────────────────────────────

describe('useDocumentHistory — enabled/disabled', () => {
  it('returns empty history when disabled', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: false }))
    expect(result.current.history).toHaveLength(0)
    // lastSavedAt must also start as null when the hook is disabled from the beginning
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('does not save when disabled, even via saveNow', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: false }))
    act(() => {
      result.current.saveNow()
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('clears history and resets lastSavedAt when enabled toggles from true to false', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(1)
    expect(result.current.lastSavedAt).not.toBeNull()

    rerender({ enabled: false })
    expect(result.current.history).toHaveLength(0)
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('reloads history from localStorage when enabled toggles from false to true', () => {
    const stored = [{ id: 'x1', title: 'Restored', content: '# Restored', savedAt: 1000 }]
    localStorage.setItem(LS_KEY, JSON.stringify(stored))

    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: false } }
    )
    expect(result.current.history).toHaveLength(0)

    rerender({ enabled: true })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('Restored')
  })
})

// ── saveNow ───────────────────────────────────────────────────────────────────

describe('useDocumentHistory — saveNow', () => {
  it('immediately saves the document', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Quick Save', enabled: true })
    )
    act(() => {
      result.current.saveNow()
    })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('Quick Save')
  })

  it('does not save when content is blank', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '   ', enabled: true }))
    act(() => {
      result.current.saveNow()
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('deduplicates identical content on repeated saves', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Same', enabled: true }))
    act(() => result.current.saveNow())
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(1)
  })

  it('does not update lastSavedAt when a duplicate save is a no-op', () => {
    // commitEntry returns early without touching lastSavedAt when content is identical.
    // This means the UI label does not flicker on re-saves with unchanged content.
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Same', enabled: true }))
    act(() => result.current.saveNow())
    const firstSavedAt = result.current.lastSavedAt
    expect(firstSavedAt).not.toBeNull()
    act(() => result.current.saveNow())
    // lastSavedAt must remain identical — no update on dedup
    expect(result.current.lastSavedAt).toBe(firstSavedAt)
  })

  it('persists the entry to localStorage', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Persist', enabled: true })
    )
    act(() => {
      result.current.saveNow()
    })
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as unknown[]
    expect(stored).toHaveLength(1)
  })

  it('updates lastSavedAt to a recent timestamp after saving', () => {
    const before = Date.now()
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Timestamp', enabled: true })
    )
    act(() => result.current.saveNow())
    expect(result.current.lastSavedAt).not.toBeNull()
    expect(result.current.lastSavedAt).toBeGreaterThanOrEqual(before)
  })

  it('deduplicates a non-top entry and promotes the new version to top', () => {
    // Save A, then B — now history is [B, A]
    let md = '# Alpha'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: md } }
    )
    act(() => result.current.saveNow())
    md = '# Beta'
    rerender({ markdown: md })
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(2)
    // history is now [Beta, Alpha]

    // Save Alpha again — it matches the non-top entry; should deduplicate
    rerender({ markdown: '# Alpha' })
    act(() => result.current.saveNow())
    // New Alpha promoted to top, old Alpha removed — length stays 2
    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0]!.content).toBe('# Alpha')
    expect(result.current.history[1]!.content).toBe('# Beta')
  })
})

// ── Auto-save debounce ────────────────────────────────────────────────────────

describe('useDocumentHistory — auto-save debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('auto-saves after the 3 s debounce delay', async () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Auto', enabled: true }))
    expect(result.current.history).toHaveLength(0)
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(1)
  })

  it('does not auto-save before the debounce elapses', async () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# NotYet', enabled: true }))
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 1_000)
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('does not auto-save when history is disabled before the timer fires', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    // Disable history within the debounce window
    rerender({ enabled: false })
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('resets the debounce timer when markdown changes mid-window, saving only the latest version', async () => {
    // This test advances time by SAVE_DEBOUNCE_MS - 1_000 twice;
    // it requires SAVE_DEBOUNCE_MS to be at least 2000 ms to be meaningful.
    expect(SAVE_DEBOUNCE_MS).toBeGreaterThanOrEqual(2000)

    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Alpha' } }
    )
    // Advance 2 s — within the debounce window, no save yet
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 1_000)
    })
    expect(result.current.history).toHaveLength(0)

    // Markdown changes — timer must restart from zero
    rerender({ markdown: '# Beta' })

    // Advance another partial window — still no save (timer restarted)
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS - 1_000)
    })
    expect(result.current.history).toHaveLength(0)

    // Now the full debounce from the last change elapses — Beta is saved, Alpha is not
    await act(async () => {
      vi.advanceTimersByTime(1_100)
    })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]!.content).toBe('# Beta')
  })
})

// ── maxEntries ────────────────────────────────────────────────────────────────

describe('useDocumentHistory — maxEntries', () => {
  it('respects the maxEntries limit', () => {
    let md = '# A'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true, maxEntries: 3 }),
      { initialProps: { markdown: md } }
    )
    for (let i = 1; i <= 5; i++) {
      md = `# Doc ${i}`
      rerender({ markdown: md })
      act(() => result.current.saveNow())
    }
    expect(result.current.history).toHaveLength(3)
  })

  it('does not retroactively trim existing entries when maxEntries decreases', () => {
    // Entries already in the list are only trimmed on the next commitEntry call.
    // This documents the intentional lazy-trim behaviour of the implementation.
    let md = '# A'
    const { result, rerender } = renderHook(
      ({ markdown, maxEntries }) => useDocumentHistory({ markdown, enabled: true, maxEntries }),
      { initialProps: { markdown: md, maxEntries: 5 } }
    )
    for (let i = 1; i <= 5; i++) {
      md = `# Doc ${i}`
      rerender({ markdown: md, maxEntries: 5 })
      act(() => result.current.saveNow())
    }
    expect(result.current.history).toHaveLength(5)

    // Lower the cap — existing entries are NOT trimmed until next save
    rerender({ markdown: md, maxEntries: 2 })
    expect(result.current.history).toHaveLength(5)

    // Next save applies the new cap
    rerender({ markdown: '# New Entry', maxEntries: 2 })
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(2)
  })

  it('keeps history as a singleton when maxEntries is 1', () => {
    let md = '# First'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true, maxEntries: 1 }),
      { initialProps: { markdown: md } }
    )
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('First')

    md = '# Second'
    rerender({ markdown: md })
    act(() => result.current.saveNow())
    // New entry replaces the old one — length stays 1 in memory and in localStorage
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('Second')
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as unknown[]
    expect(stored).toHaveLength(1)
  })
})

// ── Initialization from localStorage ─────────────────────────────────────────

describe('useDocumentHistory — initialization from localStorage', () => {
  it('loads all valid entries from localStorage in order on mount', () => {
    const entries = [
      { id: 'a1', title: 'First', content: '# First', savedAt: 2000 },
      { id: 'a2', title: 'Second', content: '# Second', savedAt: 1000 },
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(entries))

    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: true }))
    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0]?.id).toBe('a1')
    expect(result.current.history[1]?.id).toBe('a2')
  })

  it('initializes with empty history when the localStorage key is absent', () => {
    // localStorage is cleared in the global beforeEach — no key is set here
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: true }))
    expect(result.current.history).toHaveLength(0)
  })

  it('initializes with empty history when localStorage contains malformed JSON', () => {
    localStorage.setItem(LS_KEY, 'not valid json {')
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: true }))
    // Must not throw; malformed JSON is treated as empty history
    expect(result.current.history).toHaveLength(0)
  })

  it('initializes with empty history when localStorage contains valid JSON that is not an array', () => {
    // e.g. a bug caused an object to be written instead of an array
    localStorage.setItem(LS_KEY, JSON.stringify({ id: 'x', title: 'T' }))
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: true }))
    expect(result.current.history).toHaveLength(0)
  })

  it('filters out corrupt entries from localStorage on init, keeping valid ones', () => {
    const validEntry = { id: 'v1', title: 'Valid', content: '# Valid', savedAt: 1000 }
    const corruptEntries = [
      { id: 'c1', title: 'No content field', savedAt: 999 }, // missing content
      null,
      { id: 'c2', title: 'Bad date', content: '# X', savedAt: Infinity }, // non-finite savedAt
      'not an object',
    ]
    localStorage.setItem(LS_KEY, JSON.stringify([...corruptEntries, validEntry]))

    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: true }))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.id).toBe('v1')
  })
})

// ── deleteEntry / clearHistory ────────────────────────────────────────────────

describe('useDocumentHistory — deleteEntry / clearHistory', () => {
  it('deleteEntry removes the entry by id', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Del', enabled: true }))
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    act(() => result.current.deleteEntry(id))
    expect(result.current.history).toHaveLength(0)
  })

  it('persists the deletion to localStorage', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Del', enabled: true }))
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    act(() => result.current.deleteEntry(id))
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as unknown[]
    expect(stored).toHaveLength(0)
  })

  it('preserves lastSavedAt after deleteEntry', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Keep', enabled: true }))
    act(() => result.current.saveNow())
    const savedAt = result.current.lastSavedAt
    expect(savedAt).not.toBeNull()
    const id = result.current.history[0]!.id
    act(() => result.current.deleteEntry(id))
    // deleteEntry must not reset lastSavedAt — the label stays visible
    expect(result.current.lastSavedAt).toBe(savedAt)
  })

  it('deleteEntry is a no-op and does not write to localStorage when id does not exist', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Keep', enabled: true }))
    act(() => result.current.saveNow())
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    act(() => result.current.deleteEntry('non-existent-id'))
    expect(result.current.history).toHaveLength(1)
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('clearHistory empties the list and removes the localStorage key', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Clear', enabled: true }))
    act(() => result.current.saveNow())
    act(() => result.current.clearHistory())
    expect(result.current.history).toHaveLength(0)
    expect(localStorage.getItem(LS_KEY)).toBeNull()
  })

  it('clearHistory resets lastSavedAt to null', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Clear', enabled: true }))
    act(() => result.current.saveNow())
    expect(result.current.lastSavedAt).not.toBeNull()
    act(() => result.current.clearHistory())
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('clearHistory is a no-op and does not touch localStorage when already empty', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: true }))
    // history is empty and lastSavedAt is null on first render — guard should fire
    const removeSpy = vi.spyOn(localStorage, 'removeItem')
    act(() => result.current.clearHistory())
    expect(removeSpy).not.toHaveBeenCalled()
    removeSpy.mockRestore()
  })
})

// ── loadEntry ───────────────────────────────────────────────────────────────

describe('useDocumentHistory — loadEntry', () => {
  it('returns the content for a known id', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Load', enabled: true }))
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    expect(result.current.loadEntry(id)).toBe('# Load')
  })

  it('returns null for an unknown id', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# X', enabled: true }))
    expect(result.current.loadEntry('non-existent')).toBeNull()
  })

  it('returns null for any id when history is disabled', () => {
    // When disabled the history array is empty, so no id can ever be found.
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# X', enabled: false }))
    expect(result.current.loadEntry('any-id')).toBeNull()
  })
})

// ── Cross-tab sync ────────────────────────────────────────────────────────────

describe('useDocumentHistory — cross-tab sync', () => {
  it('reloads history when another tab writes to localStorage via storage event', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Tab 1', enabled: true }))
    expect(result.current.history).toHaveLength(0)

    const externalEntry = [
      { id: 'ext-1', title: 'From Tab 2', content: '# Tab 2', savedAt: Date.now() },
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(externalEntry))

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(externalEntry) })
      )
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('From Tab 2')
  })

  it('does not react to storage events for unrelated keys', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Tab 1', enabled: true }))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other-key', newValue: '[]' }))
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('does not reload history when disabled and a storage event fires for LS_KEY', () => {
    const stored = [{ id: 'ext-1', title: 'From Tab 2', content: '# Tab 2', savedAt: Date.now() }]
    localStorage.setItem(LS_KEY, JSON.stringify(stored))

    // Hook starts disabled — no storage listener is registered
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Local', enabled: false }))
    expect(result.current.history).toHaveLength(0)

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(stored) })
      )
    })

    // History must still be empty — disabled hooks must not react
    expect(result.current.history).toHaveLength(0)
  })

  it('re-registers the storage listener when enabled toggles true → false → true', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )

    // Disable — listener is removed
    rerender({ enabled: false })

    // Re-enable — listener must be re-registered
    rerender({ enabled: true })

    const externalEntry = [
      { id: 'ext-2', title: 'After Re-enable', content: '# After', savedAt: Date.now() },
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(externalEntry))
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(externalEntry) })
      )
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('After Re-enable')
  })

  it('clears history when another tab removes the localStorage key (newValue is null)', () => {
    // Pre-populate history in this tab
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Tab 1', enabled: true }))
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(1)
    expect(result.current.lastSavedAt).not.toBeNull()

    // Another tab calls localStorage.removeItem(LS_KEY) — StorageEvent has newValue: null
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY, newValue: null }))
    })

    expect(result.current.history).toHaveLength(0)
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('ignores storage events where key is null (fired by localStorage.clear() in another tab)', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Tab 1', enabled: true }))
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(1)

    // localStorage.clear() dispatches a StorageEvent with key: null
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null }))
    })

    // Hook must ignore events with key: null — history is unchanged
    expect(result.current.history).toHaveLength(1)
  })
})

// ── deleteEntries ─────────────────────────────────────────────────────────────

describe('useDocumentHistory — deleteEntries', () => {
  it('removes multiple entries atomically', () => {
    let md = '# Doc A'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: md } }
    )
    act(() => result.current.saveNow())
    md = '# Doc B'
    rerender({ markdown: md })
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(2)

    const ids = result.current.history.map((e) => e.id)
    act(() => result.current.deleteEntries(ids))
    expect(result.current.history).toHaveLength(0)
  })

  it('removes only the specified ids and leaves the rest', () => {
    let md = '# Doc A'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: md } }
    )
    act(() => result.current.saveNow())
    md = '# Doc B'
    rerender({ markdown: md })
    act(() => result.current.saveNow())
    expect(result.current.history).toHaveLength(2)

    const idToRemove = result.current.history[0]!.id
    act(() => result.current.deleteEntries([idToRemove]))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.id).not.toBe(idToRemove)
  })

  it('is a no-op when the ids array is empty', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Stay', enabled: true }))
    act(() => result.current.saveNow())
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    act(() => result.current.deleteEntries([]))
    expect(result.current.history).toHaveLength(1)
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('persists the removal to localStorage', () => {
    let md = '# A'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: md } }
    )
    act(() => result.current.saveNow())
    md = '# B'
    rerender({ markdown: md })
    act(() => result.current.saveNow())

    const ids = result.current.history.map((e) => e.id)
    act(() => result.current.deleteEntries(ids))

    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as unknown[]
    expect(stored).toHaveLength(0)
  })

  it('is a no-op when ids do not exist in history', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Keep', enabled: true }))
    act(() => result.current.saveNow())
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    act(() => result.current.deleteEntries(['non-existent-id']))
    expect(result.current.history).toHaveLength(1)
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('preserves lastSavedAt after deleteEntries', () => {
    let md = '# Doc A'
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: md } }
    )
    act(() => result.current.saveNow())
    md = '# Doc B'
    rerender({ markdown: md })
    act(() => result.current.saveNow())
    const savedAt = result.current.lastSavedAt
    expect(savedAt).not.toBeNull()

    const idToRemove = result.current.history[0]!.id
    act(() => result.current.deleteEntries([idToRemove]))
    // deleteEntries must not reset lastSavedAt
    expect(result.current.lastSavedAt).toBe(savedAt)
  })
})

// ── renameEntry ───────────────────────────────────────────────────────────────

describe('useDocumentHistory — renameEntry', () => {
  it('renames an entry to the new title', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Original', enabled: true })
    )
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    act(() => result.current.renameEntry(id, 'New Title'))
    expect(result.current.history[0]?.title).toBe('New Title')
  })

  it('keeps the original title when called with empty string', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Original', enabled: true })
    )
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    const originalTitle = result.current.history[0]!.title
    act(() => result.current.renameEntry(id, ''))
    expect(result.current.history[0]?.title).toBe(originalTitle)
  })

  it('keeps the original title when called with whitespace-only string', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Original', enabled: true })
    )
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    const originalTitle = result.current.history[0]!.title
    act(() => result.current.renameEntry(id, '   '))
    expect(result.current.history[0]?.title).toBe(originalTitle)
  })

  it('persists the rename to localStorage', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Persist', enabled: true })
    )
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    act(() => result.current.renameEntry(id, 'Persisted Title'))
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as Array<{ title: string }>
    expect(stored[0]?.title).toBe('Persisted Title')
  })

  it('is a no-op and does not write to localStorage when title is identical', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Original', enabled: true })
    )
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    const originalTitle = result.current.history[0]!.title
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    act(() => result.current.renameEntry(id, originalTitle))
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('is a no-op and does not write to localStorage when the id does not exist', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Original', enabled: true })
    )
    act(() => result.current.saveNow())
    const setItemSpy = vi.spyOn(localStorage, 'setItem')
    act(() => result.current.renameEntry('non-existent-id', 'Any Title'))
    expect(result.current.history).toHaveLength(1) // unchanged
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('preserves lastSavedAt after renameEntry', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Original', enabled: true })
    )
    act(() => result.current.saveNow())
    const savedAt = result.current.lastSavedAt
    expect(savedAt).not.toBeNull()
    const id = result.current.history[0]!.id
    act(() => result.current.renameEntry(id, 'Renamed Title'))
    // renameEntry must not reset lastSavedAt
    expect(result.current.lastSavedAt).toBe(savedAt)
  })
})

// ── saveContent ───────────────────────────────────────────────────────────────

describe('useDocumentHistory — saveContent', () => {
  it('immediately saves the provided content string', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('# Saved via saveContent'))
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.title).toBe('Saved via saveContent')
    expect(result.current.history[0]?.content).toBe('# Saved via saveContent')
  })

  it('does not save when content is blank', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('   '))
    expect(result.current.history).toHaveLength(0)
  })

  it('does not save when history is disabled', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: false })
    )
    act(() => result.current.saveContent('# Should not save'))
    expect(result.current.history).toHaveLength(0)
  })

  it('deduplicates when content matches the most recent entry', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('# Same'))
    act(() => result.current.saveContent('# Same'))
    expect(result.current.history).toHaveLength(1)
  })

  it('does not update lastSavedAt when saveContent deduplicates identical content', () => {
    // saveContent passes through commitEntry, which returns early on duplicate.
    // The UI timestamp label must not flicker on re-saves with unchanged content.
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('# Same'))
    const firstSavedAt = result.current.lastSavedAt
    expect(firstSavedAt).not.toBeNull()
    act(() => result.current.saveContent('# Same'))
    // lastSavedAt must remain identical — no update on dedup
    expect(result.current.lastSavedAt).toBe(firstSavedAt)
  })

  it('persists the entry to localStorage', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('# Persist'))
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as unknown[]
    expect(stored).toHaveLength(1)
  })

  it('updates lastSavedAt to a recent timestamp after saving', () => {
    const before = Date.now()
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('# Timestamp check'))
    expect(result.current.lastSavedAt).not.toBeNull()
    expect(result.current.lastSavedAt).toBeGreaterThanOrEqual(before)
  })

  it('deduplicates a non-top entry when saving via saveContent', () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Current', enabled: true })
    )
    act(() => result.current.saveContent('# Alpha'))
    act(() => result.current.saveContent('# Beta'))
    expect(result.current.history).toHaveLength(2)
    // history is [Beta, Alpha]

    // Save Alpha again — matches non-top; should deduplicate
    act(() => result.current.saveContent('# Alpha'))
    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[0]!.content).toBe('# Alpha')
    expect(result.current.history[1]!.content).toBe('# Beta')
  })
})

// ── Callback stability ───────────────────────────────────────────────────────

describe('useDocumentHistory — callback stability', () => {
  it('saveNow reference is stable across re-renders', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.saveNow
    rerender({ markdown: '# Updated content after keystroke' })
    expect(result.current.saveNow).toBe(first)
  })

  it('saveNow reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.saveNow
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.saveNow).toBe(first)
  })

  it('saveContent reference is stable across re-renders', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.saveContent
    rerender({ markdown: '# Updated' })
    expect(result.current.saveContent).toBe(first)
  })

  it('saveContent reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.saveContent
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.saveContent).toBe(first)
  })

  it('loadEntry reference is stable across re-renders and saves', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.loadEntry
    act(() => result.current.saveNow())
    rerender({ markdown: '# Other doc' })
    expect(result.current.loadEntry).toBe(first)
  })

  it('loadEntry reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.loadEntry
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.loadEntry).toBe(first)
  })

  it('saveNow reads the latest markdown at call time, not at hook render time', () => {
    // Verify that the stable saveNow reads from the ref, not a stale closure
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# First' } }
    )
    rerender({ markdown: '# Second' })
    act(() => result.current.saveNow())
    expect(result.current.history[0]!.content).toBe('# Second')
  })

  it('clearHistory reference is stable across re-renders and saves', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.clearHistory
    act(() => result.current.saveNow())
    rerender({ markdown: '# Updated' })
    expect(result.current.clearHistory).toBe(first)
  })

  it('clearHistory reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.clearHistory
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.clearHistory).toBe(first)
  })

  it('deleteEntry reference is stable across re-renders and saves', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.deleteEntry
    act(() => result.current.saveNow())
    rerender({ markdown: '# Updated' })
    expect(result.current.deleteEntry).toBe(first)
  })

  it('deleteEntry reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.deleteEntry
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.deleteEntry).toBe(first)
  })

  it('deleteEntries reference is stable across re-renders and saves', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.deleteEntries
    act(() => result.current.saveNow())
    rerender({ markdown: '# Updated' })
    expect(result.current.deleteEntries).toBe(first)
  })

  it('deleteEntries reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.deleteEntries
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.deleteEntries).toBe(first)
  })

  it('renameEntry reference is stable across re-renders and saves', () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    const first = result.current.renameEntry
    act(() => result.current.saveNow())
    rerender({ markdown: '# Updated' })
    expect(result.current.renameEntry).toBe(first)
  })

  it('renameEntry reference is stable across enabled toggle', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDocumentHistory({ markdown: '# Hello', enabled }),
      { initialProps: { enabled: true } }
    )
    const first = result.current.renameEntry
    rerender({ enabled: false })
    rerender({ enabled: true })
    expect(result.current.renameEntry).toBe(first)
  })
})

// ── autosave duplicate guard ────────────────────────────────────────────────

describe('useDocumentHistory — autosave duplicate guard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not create a new entry when content matches the most recent entry', async () => {
    const { result } = renderHook(() =>
      useDocumentHistory({ markdown: '# Same Content', enabled: true })
    )
    // First autosave creates the entry
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(1)
    const firstId = result.current.history[0]!.id

    // Autosave fires again with identical content — should be a no-op
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]!.id).toBe(firstId)
  })

  it('does not auto-save when content becomes empty before the timer fires', async () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello' } }
    )
    // User clears the editor within the debounce window
    rerender({ markdown: '' })
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('does not autosave whitespace-only content', async () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '   \n  ', enabled: true }))
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(0)
  })

  it('treats CRLF and LF as identical for duplicate detection', async () => {
    const { result, rerender } = renderHook(
      ({ markdown }) => useDocumentHistory({ markdown, enabled: true }),
      { initialProps: { markdown: '# Hello\nworld' } }
    )
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(1)
    const firstId = result.current.history[0]!.id

    // Switch to CRLF line endings — should not create a duplicate
    rerender({ markdown: '# Hello\r\nworld' })
    await act(async () => {
      vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + 100)
    })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]!.id).toBe(firstId)
  })
})
