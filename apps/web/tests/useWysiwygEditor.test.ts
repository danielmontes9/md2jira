import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWysiwygEditor } from '../src/hooks/useWysiwygEditor.js'
import { convertToAdf } from 'md2jira-core'
import { adfToHtml } from '../src/components/jira-output/adf-renderer.js'

function makeOpts(md: string) {
  const adf = convertToAdf(md)
  return { previewHtml: adfToHtml(adf), onMarkdownChange: undefined }
}

// Minimal mocks needed by jsdom
beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useWysiwygEditor', () => {
  const baseOpts = makeOpts('# Hello')

  it('returns stable editorRef across renders', () => {
    const { result, rerender } = renderHook(() => useWysiwygEditor(baseOpts))
    const ref1 = result.current.editorRef
    rerender()
    expect(result.current.editorRef).toBe(ref1)
  })

  it('does not throw with empty previewHtml', () => {
    expect(() =>
      renderHook(() => useWysiwygEditor({ previewHtml: '', onMarkdownChange: undefined }))
    ).not.toThrow()
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

  it('accepts updated previewHtml without throwing', () => {
    const opts1 = makeOpts('# One')
    const opts2 = makeOpts('## Two')
    const { rerender } = renderHook((opts) => useWysiwygEditor(opts), { initialProps: opts1 })
    expect(() => rerender(opts2)).not.toThrow()
  })
})
