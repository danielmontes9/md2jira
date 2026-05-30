import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useKeyboardShortcuts } from '../src/hooks/useKeyboardShortcuts.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function key(
  target: EventTarget,
  k: string,
  modifiers: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; shiftKey?: boolean } = {}
) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...modifiers })
  )
}

function makeOpts(overrides: Partial<Parameters<typeof useKeyboardShortcuts>[0]> = {}) {
  return {
    historyEnabled: true,
    saveNow: vi.fn(),
    setFormat: vi.fn(),
    setShowHistory: vi.fn(),
    onTriggerNewDocument: vi.fn(),
    ...overrides,
  }
}

afterEach(cleanup)

// ---------------------------------------------------------------------------
// Ctrl/Cmd + S
// ---------------------------------------------------------------------------

describe('useKeyboardShortcuts — Ctrl+S / Cmd+S', () => {
  it('calls saveNow on Ctrl+S when historyEnabled is true', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(window, 's', { ctrlKey: true })
    expect(opts.saveNow).toHaveBeenCalledOnce()
  })

  it('calls saveNow on Cmd+S (metaKey) when historyEnabled is true', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(window, 's', { metaKey: true })
    expect(opts.saveNow).toHaveBeenCalledOnce()
  })

  it('does NOT call saveNow on Ctrl+S when historyEnabled is false', () => {
    const opts = makeOpts({ historyEnabled: false })
    renderHook(() => useKeyboardShortcuts(opts))
    key(window, 's', { ctrlKey: true })
    expect(opts.saveNow).not.toHaveBeenCalled()
  })

  it('does NOT call saveNow on plain S (no modifier)', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(window, 's')
    expect(opts.saveNow).not.toHaveBeenCalled()
  })

  it('removes the window listener on unmount', () => {
    const opts = makeOpts()
    const { unmount } = renderHook(() => useKeyboardShortcuts(opts))
    unmount()
    key(window, 's', { ctrlKey: true })
    expect(opts.saveNow).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Alt+H — toggle history sidebar
// ---------------------------------------------------------------------------

describe('useKeyboardShortcuts — Alt+H', () => {
  it('calls setShowHistory on Alt+H', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'h', { altKey: true })
    expect(opts.setShowHistory).toHaveBeenCalledOnce()
  })

  it('passes a toggling updater function', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'h', { altKey: true })
    const updater = vi.mocked(opts.setShowHistory).mock.calls[0]?.[0]
    if (!updater) throw new Error('setShowHistory was not called with an updater')
    expect(updater(false)).toBe(true)
    expect(updater(true)).toBe(false)
  })

  it('does NOT call setShowHistory when Alt+Shift+H is pressed', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'h', { altKey: true, shiftKey: true })
    expect(opts.setShowHistory).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Alt+N — new document
// ---------------------------------------------------------------------------

describe('useKeyboardShortcuts — Alt+N', () => {
  it('calls onTriggerNewDocument on Alt+N', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'n', { altKey: true })
    expect(opts.onTriggerNewDocument).toHaveBeenCalledOnce()
  })

  it('does NOT call saveNow directly on Alt+N (saving happens inside the modal confirm)', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'n', { altKey: true })
    expect(opts.saveNow).not.toHaveBeenCalled()
  })

  it('does NOT trigger when Alt+Shift+N is pressed', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'n', { altKey: true, shiftKey: true })
    // Alt+Shift+N is not a registered shortcut
    expect(opts.onTriggerNewDocument).not.toHaveBeenCalled()
  })

  it('removes the document listener on unmount (Alt+N no longer fires)', () => {
    const opts = makeOpts()
    const { unmount } = renderHook(() => useKeyboardShortcuts(opts))
    unmount()
    key(document, 'n', { altKey: true })
    expect(opts.onTriggerNewDocument).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Alt+Shift+A/W/C — format switching
// ---------------------------------------------------------------------------

describe('useKeyboardShortcuts — format shortcuts', () => {
  it('sets format to "adf" on Alt+Shift+A', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'A', { altKey: true, shiftKey: true })
    expect(opts.setFormat).toHaveBeenCalledWith('adf')
  })

  it('sets format to "wiki" on Alt+Shift+W', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'W', { altKey: true, shiftKey: true })
    expect(opts.setFormat).toHaveBeenCalledWith('wiki')
  })

  it('sets format to "confluence" on Alt+Shift+C', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'C', { altKey: true, shiftKey: true })
    expect(opts.setFormat).toHaveBeenCalledWith('confluence')
  })

  it('does NOT call setFormat for unregistered Alt+Shift keys', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'X', { altKey: true, shiftKey: true })
    expect(opts.setFormat).not.toHaveBeenCalled()
  })

  it('does NOT call setFormat when only Alt is pressed (no Shift)', () => {
    const opts = makeOpts()
    renderHook(() => useKeyboardShortcuts(opts))
    key(document, 'A', { altKey: true })
    expect(opts.setFormat).not.toHaveBeenCalled()
  })

  it('removes the document listener on unmount (format shortcut no longer fires)', () => {
    const opts = makeOpts()
    const { unmount } = renderHook(() => useKeyboardShortcuts(opts))
    unmount()
    key(document, 'A', { altKey: true, shiftKey: true })
    expect(opts.setFormat).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// saveNow ref stays current after re-render
// ---------------------------------------------------------------------------

describe('useKeyboardShortcuts — saveNow ref stability', () => {
  it('calls the latest saveNow when Alt+N is pressed after a re-render', () => {
    const firstSave = vi.fn()
    const secondSave = vi.fn()

    const { rerender } = renderHook(
      ({ saveNow }: { saveNow: () => void }) => useKeyboardShortcuts(makeOpts({ saveNow })),
      { initialProps: { saveNow: firstSave } }
    )

    // Re-render with a new saveNow
    rerender({ saveNow: secondSave })

    key(document, 'n', { altKey: true })

    expect(firstSave).not.toHaveBeenCalled()
    expect(secondSave).toHaveBeenCalledOnce()
  })

  it('calls the latest saveNow when Ctrl+S is pressed after a re-render with historyEnabled', () => {
    const firstSave = vi.fn()
    const secondSave = vi.fn()

    const { rerender } = renderHook(
      ({ saveNow }: { saveNow: () => void }) =>
        useKeyboardShortcuts(makeOpts({ saveNow, historyEnabled: true })),
      { initialProps: { saveNow: firstSave } }
    )

    rerender({ saveNow: secondSave })
    key(window, 's', { ctrlKey: true })

    expect(firstSave).not.toHaveBeenCalled()
    expect(secondSave).toHaveBeenCalledOnce()
  })

  beforeEach(() => {
    cleanup()
  })
})
