import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentHistory } from '../src/hooks/useDocumentHistory.js'

const LS_KEY = 'md2jira-doc-history'

beforeEach(() => {
  localStorage.clear()
})

// ── Basic: enabled/disabled ───────────────────────────────────────────────────

describe('useDocumentHistory — enabled/disabled', () => {
  it('returns empty history when disabled', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: false }))
    expect(result.current.history).toHaveLength(0)
  })

  it('does not save when disabled, even via saveNow', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Hello', enabled: false }))
    act(() => {
      result.current.saveNow()
    })
    expect(result.current.history).toHaveLength(0)
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
})

// ── Auto-save debounce ────────────────────────────────────────────────────────

describe('useDocumentHistory — auto-save debounce', () => {
  it('auto-saves after the 3 s debounce delay', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Auto', enabled: true }))
    expect(result.current.history).toHaveLength(0)
    await act(async () => {
      vi.advanceTimersByTime(3_100)
    })
    expect(result.current.history).toHaveLength(1)
    vi.useRealTimers()
  })

  it('does not auto-save before the debounce elapses', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# NotYet', enabled: true }))
    await act(async () => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current.history).toHaveLength(0)
    vi.useRealTimers()
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

  it('clearHistory empties the list and removes the localStorage key', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Clear', enabled: true }))
    act(() => result.current.saveNow())
    act(() => result.current.clearHistory())
    expect(result.current.history).toHaveLength(0)
    expect(localStorage.getItem(LS_KEY)).toBeNull()
  })

  it('loadEntry returns the content for a known id', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# Load', enabled: true }))
    act(() => result.current.saveNow())
    const id = result.current.history[0]!.id
    expect(result.current.loadEntry(id)).toBe('# Load')
  })

  it('loadEntry returns null for an unknown id', () => {
    const { result } = renderHook(() => useDocumentHistory({ markdown: '# X', enabled: true }))
    expect(result.current.loadEntry('non-existent')).toBeNull()
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
    act(() => result.current.deleteEntries([]))
    expect(result.current.history).toHaveLength(1)
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
    act(() => result.current.deleteEntries(['non-existent-id']))
    expect(result.current.history).toHaveLength(1)
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
})
