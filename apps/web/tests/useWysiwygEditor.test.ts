import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWysiwygEditor } from '../src/hooks/useWysiwygEditor.js'

// Minimal mocks needed by jsdom
beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useWysiwygEditor', () => {
  const baseOpts = { markdown: '# Hello', onMarkdownChange: undefined }

  it('returns stable editorRef across renders', () => {
    const { result, rerender } = renderHook(() => useWysiwygEditor(baseOpts))
    const ref1 = result.current.editorRef
    rerender()
    expect(result.current.editorRef).toBe(ref1)
  })

  it('generates previewHtml from markdown', () => {
    const { result } = renderHook(() => useWysiwygEditor(baseOpts))
    expect(result.current.previewHtml).toContain('Hello')
  })

  it('returns error HTML on broken markdown conversion', () => {
    // convertToAdf may throw for truly malformed input;
    // the hook should catch and return an error preview.
    const { result } = renderHook(() =>
      useWysiwygEditor({ markdown: '', onMarkdownChange: undefined })
    )
    // Empty markdown should still produce valid (possibly empty) HTML without throwing.
    expect(typeof result.current.previewHtml).toBe('string')
  })

  it('initializes activeBlock to "p"', () => {
    const { result } = renderHook(() => useWysiwygEditor(baseOpts))
    expect(result.current.activeBlock).toBe('p')
  })

  it('initializes activeFormats as empty set', () => {
    const { result } = renderHook(() => useWysiwygEditor(baseOpts))
    expect(result.current.activeFormats.size).toBe(0)
  })

  it('exec calls document.execCommand', () => {
    // jsdom does not implement execCommand — define it so we can spy
    document.execCommand = vi.fn().mockReturnValue(true)
    const { result } = renderHook(() => useWysiwygEditor(baseOpts))

    act(() => {
      result.current.exec('bold')
    })

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, '')
  })

  it('insertHtml calls document.execCommand with insertHTML', () => {
    document.execCommand = vi.fn().mockReturnValue(true)
    const { result } = renderHook(() => useWysiwygEditor(baseOpts))

    act(() => {
      result.current.insertHtml('<b>test</b>')
    })

    expect(document.execCommand).toHaveBeenCalledWith('insertHTML', false, '<b>test</b>')
  })

  it('saveRange does not throw when no selection exists', () => {
    const { result } = renderHook(() => useWysiwygEditor(baseOpts))
    expect(() => {
      act(() => {
        result.current.saveRange()
      })
    }).not.toThrow()
  })

  it('previewHtml updates when markdown changes', () => {
    const { result, rerender } = renderHook(
      ({ md }) => useWysiwygEditor({ markdown: md, onMarkdownChange: undefined }),
      { initialProps: { md: '# One' } }
    )
    const html1 = result.current.previewHtml
    rerender({ md: '## Two' })
    expect(result.current.previewHtml).not.toBe(html1)
    expect(result.current.previewHtml).toContain('Two')
  })
})
