import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTiptapEditor } from '../src/hooks/useTiptapEditor.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useTiptapEditor', () => {
  const baseOpts = { previewHtml: '<p>Hello</p>', onMarkdownChange: undefined }

  it('returns an editor instance', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    // Editor may be null initially but should initialize
    expect(result.current.editor).toBeDefined()
  })

  it('does not throw with empty previewHtml', () => {
    expect(() =>
      renderHook(() => useTiptapEditor({ previewHtml: '', onMarkdownChange: undefined }))
    ).not.toThrow()
  })

  it('initializes activeBlock to "p"', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    expect(result.current.activeBlock).toBe('p')
  })

  it('initializes activeFormats as empty set', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    expect(result.current.activeFormats.size).toBe(0)
  })

  it('exec does not throw when called', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    expect(() => {
      act(() => result.current.exec('bold'))
    }).not.toThrow()
  })

  it('insertHtml does not throw when called', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    expect(() => {
      act(() => result.current.insertHtml('<b>test</b>'))
    }).not.toThrow()
  })

  it('accepts updated previewHtml without throwing', () => {
    const opts1 = { previewHtml: '<p>One</p>', onMarkdownChange: undefined }
    const opts2 = { previewHtml: '<p>Two</p>', onMarkdownChange: undefined }
    const { rerender } = renderHook((opts) => useTiptapEditor(opts), { initialProps: opts1 })
    expect(() => rerender(opts2)).not.toThrow()
  })

  it('provides exec and insertHtml as functions', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    expect(typeof result.current.exec).toBe('function')
    expect(typeof result.current.insertHtml).toBe('function')
  })

  it('does not call onMarkdownChange on initial render', () => {
    const cb = vi.fn()
    renderHook(() => useTiptapEditor({ previewHtml: '<p>hello</p>', onMarkdownChange: cb }))
    expect(cb).not.toHaveBeenCalled()
  })

  it('exec supports all documented command names without throwing', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    const commands: [string, string?][] = [
      ['bold'],
      ['italic'],
      ['underline'],
      ['strikeThrough'],
      ['subscript'],
      ['superscript'],
      ['insertUnorderedList'],
      ['insertOrderedList'],
      ['insertHorizontalRule'],
      ['toggleTaskList'],
      ['insertTable'],
      ['toggleBlockquote'],
      ['toggleCode'],
      ['toggleCodeBlock'],
      ['undo'],
      ['redo'],
      ['removeFormat'],
      ['foreColor', '#0052CC'],
      ['foreColor'],
      ['formatBlock', 'h1'],
      ['formatBlock', 'h3'],
      ['formatBlock', 'p'],
      ['insertText', 'hello'],
      ['unknownCommand'], // silently ignored per execTiptapCommand default branch
    ]
    for (const [cmd, arg] of commands) {
      expect(() => act(() => result.current.exec(cmd, arg))).not.toThrow()
    }
  })

  it('updates editor when previewHtml prop changes', () => {
    const { result, rerender } = renderHook((opts) => useTiptapEditor(opts), {
      initialProps: { previewHtml: '<p>Before</p>', onMarkdownChange: undefined },
    })
    act(() => rerender({ previewHtml: '<p>After</p>', onMarkdownChange: undefined }))
    // Editor should remain stable and not throw after content sync
    expect(() => result.current.editor?.getHTML()).not.toThrow()
  })

  it('insertHtml does not throw with potentially unsafe input', () => {
    const { result } = renderHook(() => useTiptapEditor(baseOpts))
    expect(() => {
      act(() => result.current.insertHtml('<script>alert(1)</script>'))
      act(() => result.current.insertHtml('<img src=x onerror=alert(1)>'))
      act(() => result.current.insertHtml('<b>safe content</b>'))
    }).not.toThrow()
  })

  describe('onColorWarning', () => {
    it('calls onColorWarning once when colored content is set', async () => {
      const onColorWarning = vi.fn()
      const onMarkdownChange = vi.fn()

      const { result } = renderHook(() =>
        useTiptapEditor({
          previewHtml: '<p>Hello</p>',
          onMarkdownChange,
          onColorWarning,
          debounceMs: 50,
        })
      )

      // Flush any pending microtasks from the initial previewHtml sync
      await act(async () => {})

      // Wait for the editor to be ready before interacting
      await waitFor(() => expect(result.current.editor).not.toBeNull())

      act(() => {
        result.current.editor!.commands.setContent(
          '<p><span style="color: #ff0000">colored text</span></p>'
        )
      })

      await waitFor(() => expect(onColorWarning).toHaveBeenCalledTimes(1), { timeout: 2000 })
    })

    it('fires onColorWarning only once per editing session despite multiple color edits', async () => {
      const onColorWarning = vi.fn()
      const onMarkdownChange = vi.fn()

      const { result } = renderHook(() =>
        useTiptapEditor({
          previewHtml: '<p>Hello</p>',
          onMarkdownChange,
          onColorWarning,
          debounceMs: 50,
        })
      )

      await act(async () => {})
      await waitFor(() => expect(result.current.editor).not.toBeNull())

      act(() => {
        result.current.editor!.commands.setContent(
          '<p><span style="color: #ff0000">first color</span></p>'
        )
      })
      await waitFor(() => expect(onColorWarning).toHaveBeenCalledTimes(1), { timeout: 2000 })

      act(() => {
        result.current.editor!.commands.setContent(
          '<p><span style="color: #0000ff">second color</span></p>'
        )
      })
      // Wait for debounce to fire (onMarkdownChange should be called twice), then verify warning still only once
      await waitFor(() => expect(onMarkdownChange).toHaveBeenCalledTimes(2), { timeout: 2000 })
      expect(onColorWarning).toHaveBeenCalledTimes(1)
    })

    it('does not call onColorWarning for content without color marks', async () => {
      const onColorWarning = vi.fn()
      const onMarkdownChange = vi.fn()

      const { result } = renderHook(() =>
        useTiptapEditor({
          previewHtml: '<p>Hello</p>',
          onMarkdownChange,
          onColorWarning,
          debounceMs: 50,
        })
      )

      await act(async () => {})
      await waitFor(() => expect(result.current.editor).not.toBeNull())

      act(() => {
        result.current.editor!.commands.setContent('<p><strong>just bold text</strong></p>')
      })
      // Wait for debounce to fire, then verify color warning was not triggered
      await waitFor(() => expect(onMarkdownChange).toHaveBeenCalled(), { timeout: 2000 })
      expect(onColorWarning).not.toHaveBeenCalled()
    })
  })
})
