import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOfflineStatus } from '../src/hooks/useOfflineStatus.js'

// jsdom exposes navigator.onLine but does not dispatch online/offline events
// reactively. We control the initial value via vi.stubGlobal.

beforeAll(() => {
  vi.stubGlobal('navigator', { ...navigator, onLine: true })
})

afterAll(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useOfflineStatus', () => {
  it('returns false when navigator.onLine is true', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    const { result } = renderHook(() => useOfflineStatus())
    expect(result.current).toBe(false)
  })

  it('returns true when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const { result } = renderHook(() => useOfflineStatus())
    expect(result.current).toBe(true)
  })

  it('switches to true when the offline event fires', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true })
    const { result } = renderHook(() => useOfflineStatus())
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(true)
  })

  it('switches back to false when the online event fires', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false })
    const { result } = renderHook(() => useOfflineStatus())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(false)
  })

  it('removes event listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useOfflineStatus())
    unmount()

    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
  })
})
