import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCodeMirrorEditor } from '../src/hooks/useCodeMirrorEditor.js'
import { undo as mockCmUndo, redo as mockCmRedo } from '@codemirror/commands'
import { openSearchPanel as mockOpenSearchPanel } from '@codemirror/search'
import { EditorView } from '@codemirror/view'
import { IS_MAC, MOD_KEY } from '../src/utils/keyboard.js'

// ── Shared mock state for useCodeMirrorEditor tests ──────────────────────────
// Declared at module scope so vi.mock factory closures can reference them;
// they are only *accessed* inside closures that run at test time (after init).
const mockDispatch = vi.fn()
const mockDestroy = vi.fn()
const updateListenerRef: {
  current: ((u: { docChanged: boolean; state: { doc: { toString(): string } } }) => void) | null
} = { current: null }

vi.mock('@codemirror/view', () => {
  const MockEditorView = Object.assign(
    vi.fn().mockImplementation(({ parent }: { parent?: HTMLElement }) => {
      if (parent) {
        const div = document.createElement('div')
        parent.appendChild(div)
      }
      return {
        state: { doc: { toString: () => '' } },
        dispatch: mockDispatch,
        destroy: mockDestroy,
        scrollDOM: document.createElement('div'),
      }
    }),
    {
      theme: vi.fn(() => ({})),
      lineWrapping: {} as object,
      contentAttributes: { of: vi.fn(() => ({})) },
      updateListener: {
        of: vi.fn((cb: unknown) => {
          updateListenerRef.current = cb as typeof updateListenerRef.current
          return {}
        }),
      },
    }
  )
  return {
    EditorView: MockEditorView,
    keymap: { of: vi.fn(() => ({})) },
    lineNumbers: vi.fn(() => ({})),
    highlightActiveLine: vi.fn(() => ({})),
    drawSelection: vi.fn(() => ({})),
    highlightActiveLineGutter: vi.fn(() => ({})),
    placeholder: vi.fn(() => ({})),
  }
})

vi.mock('@codemirror/state', () => ({
  EditorState: { create: vi.fn(() => ({ doc: { toString: () => '' } })) },
  Compartment: vi.fn().mockImplementation(() => ({
    of: vi.fn(() => ({})),
    reconfigure: vi.fn(() => ({})),
  })),
}))

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: vi.fn(() => ({})),
  historyKeymap: [],
  undo: vi.fn(),
  redo: vi.fn(),
}))

vi.mock('@codemirror/lang-markdown', () => ({ markdown: vi.fn(() => ({})) }))

vi.mock('@codemirror/language', () => ({
  HighlightStyle: { define: vi.fn(() => ({})) },
  syntaxHighlighting: vi.fn(() => ({})),
}))

vi.mock('@codemirror/search', () => ({
  search: vi.fn(() => ({})),
  searchKeymap: [],
  openSearchPanel: vi.fn(),
}))

vi.mock('@lezer/highlight', () => ({ tags: new Proxy({}, { get: () => ({}) }) }))

function makeRef(el = document.createElement('div')) {
  return { current: el }
}

describe('keyboard.ts constants', () => {
  it('IS_MAC is a boolean', () => {
    expect(typeof IS_MAC).toBe('boolean')
  })

  it('MOD_KEY is the correct modifier for the current platform', () => {
    if (IS_MAC) {
      expect(MOD_KEY).toBe('\u2318')
    } else {
      expect(MOD_KEY).toBe('Ctrl')
    }
  })

  it('MOD_KEY is either "\u2318" or "Ctrl"', () => {
    expect(['\u2318', 'Ctrl']).toContain(MOD_KEY)
  })

  it('IS_MAC=true implies MOD_KEY="\u2318" (consistency)', () => {
    if (IS_MAC) expect(MOD_KEY).toBe('\u2318')
  })

  it('IS_MAC=false implies MOD_KEY="Ctrl" (consistency)', () => {
    if (!IS_MAC) expect(MOD_KEY).toBe('Ctrl')
  })
})

describe('keyboard.ts \u2013 module guard', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('module can be re-imported without throwing', async () => {
    await expect(import('../src/utils/keyboard.js')).resolves.toBeDefined()
  })
})

// ── useCodeMirrorEditor unit tests ────────────────────────────────────────────
describe('useCodeMirrorEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateListenerRef.current = null
  })

  it('creates an EditorView and attaches it to the container div', () => {
    const container = document.createElement('div')
    renderHook(() =>
      useCodeMirrorEditor({
        containerRef: makeRef(container),
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    expect(vi.mocked(EditorView)).toHaveBeenCalledOnce()
    expect(container.childElementCount).toBeGreaterThan(0)
  })

  it('does not create an EditorView when containerRef.current is null', () => {
    renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: null },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    expect(vi.mocked(EditorView)).not.toHaveBeenCalled()
  })

  it('destroys the EditorView on unmount', () => {
    const { unmount } = renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange: vi.fn(), isDark: false })
    )
    unmount()
    expect(mockDestroy).toHaveBeenCalledOnce()
  })

  it('returns undo, redo, and openSearch callback functions', () => {
    const { result } = renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange: vi.fn(), isDark: false })
    )
    expect(typeof result.current.undo).toBe('function')
    expect(typeof result.current.redo).toBe('function')
    expect(typeof result.current.openSearch).toBe('function')
  })

  it('undo() delegates to cmUndo', () => {
    const { result } = renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange: vi.fn(), isDark: false })
    )
    act(() => {
      result.current.undo()
    })
    expect(mockCmUndo).toHaveBeenCalledOnce()
  })

  it('redo() delegates to cmRedo', () => {
    const { result } = renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange: vi.fn(), isDark: false })
    )
    act(() => {
      result.current.redo()
    })
    expect(mockCmRedo).toHaveBeenCalledOnce()
  })

  it('openSearch() delegates to openSearchPanel', () => {
    const { result } = renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange: vi.fn(), isDark: false })
    )
    act(() => {
      result.current.openSearch()
    })
    expect(mockOpenSearchPanel).toHaveBeenCalledOnce()
  })

  it('dispatches a content change when value prop changes externally', () => {
    const containerRef = makeRef()
    const onChange = vi.fn()
    const { rerender } = renderHook((props) => useCodeMirrorEditor(props), {
      initialProps: { containerRef, value: 'initial', onChange, isDark: false },
    })
    mockDispatch.mockClear()
    rerender({ containerRef, value: 'updated', onChange, isDark: false })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ changes: expect.objectContaining({ insert: 'updated' }) })
    )
  })

  it('dispatches a theme reconfigure when isDark toggles', () => {
    const containerRef = makeRef()
    const onChange = vi.fn()
    const { rerender } = renderHook((props) => useCodeMirrorEditor(props), {
      initialProps: { containerRef, value: '', onChange, isDark: false },
    })
    mockDispatch.mockClear()
    rerender({ containerRef, value: '', onChange, isDark: true })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ effects: expect.anything() })
    )
  })

  it('calls onChange when the editor content changes internally', () => {
    const onChange = vi.fn()
    renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange, isDark: false })
    )
    act(() => {
      updateListenerRef.current?.({
        docChanged: true,
        state: { doc: { toString: () => 'typed text' } },
      })
    })
    expect(onChange).toHaveBeenCalledWith('typed text')
  })

  it('does not call onChange when docChanged is false', () => {
    const onChange = vi.fn()
    renderHook(() =>
      useCodeMirrorEditor({ containerRef: makeRef(), value: '', onChange, isDark: false })
    )
    act(() => {
      updateListenerRef.current?.({
        docChanged: false,
        state: { doc: { toString: () => '' } },
      })
    })
    expect(onChange).not.toHaveBeenCalled()
  })
})
