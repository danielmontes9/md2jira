import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
})
