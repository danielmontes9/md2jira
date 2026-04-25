import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePanelSplit, SPLIT_MIN, SPLIT_MAX } from '../src/hooks/usePanelSplit.js'

describe('usePanelSplit', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exports SPLIT_MIN=20 and SPLIT_MAX=80', () => {
    expect(SPLIT_MIN).toBe(20)
    expect(SPLIT_MAX).toBe(80)
  })

  it('returns the default split (50) when localStorage has no value', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    expect(result.current.split).toBe(50)
  })

  it('accepts a custom initial value', () => {
    const { result } = renderHook(() => usePanelSplit('test-split', 30))
    expect(result.current.split).toBe(30)
  })

  it('reads persisted split from localStorage', () => {
    localStorage.setItem('test-split', '65')
    const { result } = renderHook(() => usePanelSplit('test-split'))
    expect(result.current.split).toBe(65)
  })

  it('ignores persisted values below SPLIT_MIN', () => {
    localStorage.setItem('test-split', '10')
    const { result } = renderHook(() => usePanelSplit('test-split'))
    expect(result.current.split).toBe(50)
  })

  it('ignores persisted values above SPLIT_MAX', () => {
    localStorage.setItem('test-split', '90')
    const { result } = renderHook(() => usePanelSplit('test-split'))
    expect(result.current.split).toBe(50)
  })

  it('ignores non-numeric persisted values', () => {
    localStorage.setItem('test-split', 'not-a-number')
    const { result } = renderHook(() => usePanelSplit('test-split'))
    expect(result.current.split).toBe(50)
  })

  it('persists an updated split to localStorage via setSplit', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    act(() => {
      result.current.setSplit(70)
    })
    expect(result.current.split).toBe(70)
    expect(localStorage.getItem('test-split')).toBe('70')
  })

  it('setSplit accepts a functional update', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    act(() => {
      result.current.setSplit((prev) => prev + 10)
    })
    expect(result.current.split).toBe(60)
    expect(localStorage.getItem('test-split')).toBe('60')
  })

  it('mainRef is initially null', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    expect(result.current.mainRef.current).toBeNull()
  })

  it('handleDragEnd stops dragging', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    // Should not throw when called without a prior dragStart
    act(() => {
      result.current.handleDragEnd()
    })
    expect(result.current.split).toBe(50)
  })

  it('setSplit clamps values below SPLIT_MIN to SPLIT_MIN', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    act(() => {
      result.current.setSplit(5)
    })
    expect(result.current.split).toBe(SPLIT_MIN)
    expect(localStorage.getItem('test-split')).toBe(String(SPLIT_MIN))
  })

  it('setSplit clamps values above SPLIT_MAX to SPLIT_MAX', () => {
    const { result } = renderHook(() => usePanelSplit('test-split'))
    act(() => {
      result.current.setSplit(95)
    })
    expect(result.current.split).toBe(SPLIT_MAX)
    expect(localStorage.getItem('test-split')).toBe(String(SPLIT_MAX))
  })

  it('setSplit clamps functional updates that exceed SPLIT_MAX', () => {
    const { result } = renderHook(() => usePanelSplit('test-split', 79))
    act(() => {
      result.current.setSplit((prev) => prev + 10) // 79 + 10 = 89 → clamped to 80
    })
    expect(result.current.split).toBe(SPLIT_MAX)
  })
})
