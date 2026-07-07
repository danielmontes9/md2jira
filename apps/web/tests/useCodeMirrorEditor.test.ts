import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'

// -- CodeMirror mocks (vi.mock calls are hoisted before imports) ---------------

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn(() => ({ _mockState: true })),
  },
  Compartment: class Compartment {
    of(ext: unknown) {
      return { _compartment: true, ext }
    }
    reconfigure(ext: unknown) {
      return { _reconfigure: true, ext }
    }
  },
}))

vi.mock('@codemirror/view', () => {
  const MockEditorView = vi.fn(function (
    this: Record<string, unknown>,
    { parent }: { parent: HTMLElement | null }
  ) {
    this.state = { doc: { toString: () => '' } }
    this.dispatch = vi.fn()
    this.destroy = vi.fn()
    this.scrollDOM = document.createElement('div')
    if (parent) parent.setAttribute('data-codemirror-mock', 'true')
  }) as unknown as { new (opts: { parent: HTMLElement | null }): object } & {
    theme: ReturnType<typeof vi.fn>
    updateListener: { of: ReturnType<typeof vi.fn> }
    lineWrapping: object
    contentAttributes: { of: ReturnType<typeof vi.fn> }
  } & ReturnType<typeof vi.fn>
  MockEditorView.theme = vi.fn(() => ({}))
  MockEditorView.updateListener = { of: vi.fn(() => ({})) }
  MockEditorView.lineWrapping = {}
  MockEditorView.contentAttributes = { of: vi.fn(() => ({})) }
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

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: vi.fn(() => ({})),
  historyKeymap: [],
  undo: vi.fn(),
  redo: vi.fn(),
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: vi.fn(() => ({})),
}))

vi.mock('@codemirror/language', () => ({
  HighlightStyle: { define: vi.fn(() => ({})) },
  syntaxHighlighting: vi.fn(() => ({})),
}))

vi.mock('@codemirror/search', () => ({
  search: vi.fn(() => ({})),
  searchKeymap: [],
  openSearchPanel: vi.fn(),
}))

vi.mock('@lezer/highlight', () => ({
  tags: new Proxy({}, { get: (_t, key) => Symbol(String(key)) }),
}))

// -- Import under test (after mocks are declared) ----------------------------

import { useCodeMirrorEditor } from '../src/hooks/useCodeMirrorEditor.js'
import { undo as cmUndo, redo as cmRedo } from '@codemirror/commands'
import { openSearchPanel } from '@codemirror/search'
import { EditorView } from '@codemirror/view'

// -- Helpers ------------------------------------------------------------------

function makeContainer() {
  const div = document.createElement('div')
  document.body.appendChild(div)
  return div
}

// -- Tests --------------------------------------------------------------------

describe('useCodeMirrorEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('returns undo, redo and openSearch functions', () => {
    const container = makeContainer()
    const { result } = renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: container },
        value: '# Hello',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    expect(typeof result.current.undo).toBe('function')
    expect(typeof result.current.redo).toBe('function')
    expect(typeof result.current.openSearch).toBe('function')
  })

  it('creates an EditorView on mount with the provided container', () => {
    const container = makeContainer()
    renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: container },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    expect(vi.mocked(EditorView)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(EditorView)).toHaveBeenCalledWith(
      expect.objectContaining({ parent: container })
    )
  })

  it('does not crash when containerRef.current is null', () => {
    expect(() =>
      renderHook(() =>
        useCodeMirrorEditor({
          containerRef: { current: null },
          value: '',
          onChange: vi.fn(),
          isDark: false,
        })
      )
    ).not.toThrow()
    expect(vi.mocked(EditorView)).not.toHaveBeenCalled()
  })

  it('calling undo() invokes cmUndo with the editor view', () => {
    const container = makeContainer()
    const { result } = renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: container },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    act(() => {
      result.current.undo()
    })
    expect(vi.mocked(cmUndo)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(cmUndo)).toHaveBeenCalledWith(expect.anything())
  })

  it('calling redo() invokes cmRedo with the editor view', () => {
    const container = makeContainer()
    const { result } = renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: container },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    act(() => {
      result.current.redo()
    })
    expect(vi.mocked(cmRedo)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(cmRedo)).toHaveBeenCalledWith(expect.anything())
  })

  it('calling openSearch() invokes openSearchPanel with the editor view', () => {
    const container = makeContainer()
    const { result } = renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: container },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    act(() => {
      result.current.openSearch()
    })
    expect(vi.mocked(openSearchPanel)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(openSearchPanel)).toHaveBeenCalledWith(expect.anything())
  })

  it('undo/redo/openSearch are no-ops when view is null (no container)', () => {
    const { result } = renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: null },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    act(() => {
      result.current.undo()
      result.current.redo()
      result.current.openSearch()
    })
    expect(vi.mocked(cmUndo)).not.toHaveBeenCalled()
    expect(vi.mocked(cmRedo)).not.toHaveBeenCalled()
    expect(vi.mocked(openSearchPanel)).not.toHaveBeenCalled()
  })

  it('destroys the editor view on unmount', () => {
    const container = makeContainer()
    const { unmount } = renderHook(() =>
      useCodeMirrorEditor({
        containerRef: { current: container },
        value: '',
        onChange: vi.fn(),
        isDark: false,
      })
    )
    const instance = vi.mocked(EditorView).mock.instances[0]!
    unmount()
    expect(instance.destroy).toHaveBeenCalled()
  })

  it('accepts an optional onSave callback without crashing', () => {
    const container = makeContainer()
    expect(() =>
      renderHook(() =>
        useCodeMirrorEditor({
          containerRef: { current: container },
          value: '# Test',
          onChange: vi.fn(),
          isDark: true,
          onSave: vi.fn(),
        })
      )
    ).not.toThrow()
  })

  it('accepts a custom placeholderText without crashing', () => {
    const container = makeContainer()
    expect(() =>
      renderHook(() =>
        useCodeMirrorEditor({
          containerRef: { current: container },
          value: '',
          onChange: vi.fn(),
          isDark: false,
          placeholderText: 'Type here...',
        })
      )
    ).not.toThrow()
  })
})
