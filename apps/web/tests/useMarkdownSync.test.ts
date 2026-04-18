import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMarkdownSync } from '../src/hooks/useMarkdownSync.js'

describe('useMarkdownSync', () => {
  it('returns isEditorUpdateRef with initial value false', () => {
    const editorRef = { current: null }
    const onMarkdownChangeRef = { current: undefined }
    const { result } = renderHook(() => useMarkdownSync(editorRef, onMarkdownChangeRef, false))
    expect(result.current.isEditorUpdateRef.current).toBe(false)
  })

  it('scheduleMarkdownUpdate does not throw when refs are null', () => {
    const editorRef = { current: null }
    const onMarkdownChangeRef = { current: undefined }
    const { result } = renderHook(() => useMarkdownSync(editorRef, onMarkdownChangeRef, false))
    expect(() => result.current.scheduleMarkdownUpdate()).not.toThrow()
  })

  it('returns a stable scheduleMarkdownUpdate reference across re-renders', () => {
    const editorRef = { current: null }
    const onMarkdownChangeRef = { current: undefined }
    const { result, rerender } = renderHook(() =>
      useMarkdownSync(editorRef, onMarkdownChangeRef, false)
    )
    const first = result.current.scheduleMarkdownUpdate
    rerender()
    expect(result.current.scheduleMarkdownUpdate).toBe(first)
  })

  it('unmounts cleanly without throwing', () => {
    const editorRef = { current: null }
    const onMarkdownChangeRef = { current: undefined }
    const { unmount } = renderHook(() => useMarkdownSync(editorRef, onMarkdownChangeRef, false))
    expect(() => unmount()).not.toThrow()
  })
})
