import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { useJiraCopy } from '../src/hooks/useJiraCopy.js'
import { ToastProvider } from '../src/context/ToastContext.js'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ToastProvider, null, children)
}

describe('useJiraCopy', () => {
  const mockEditorRef = { current: null as HTMLDivElement | null }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    // jsdom does not implement ClipboardItem — stub it
    Object.defineProperty(global, 'ClipboardItem', {
      writable: true,
      value: vi.fn().mockImplementation((data: Record<string, Blob>) => ({ data })),
    })
  })

  it('wiki format calls navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText, write: vi.fn() },
      configurable: true,
    })
    const { result } = renderHook(
      () => useJiraCopy('output', 'wiki', mockEditorRef as React.RefObject<HTMLDivElement>),
      { wrapper }
    )
    await act(async () => {
      await result.current.handleCopy()
    })
    expect(writeText).toHaveBeenCalledWith('output')
    expect(result.current.copied).toBe(true)
  })

  it('adf format calls navigator.clipboard.write with a ClipboardItem', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { write, writeText: vi.fn() },
      configurable: true,
    })
    const div = document.createElement('div')
    div.innerHTML = '<p>hello</p>'
    mockEditorRef.current = div
    const { result } = renderHook(
      () => useJiraCopy('{"type":"doc"}', 'adf', mockEditorRef as React.RefObject<HTMLDivElement>),
      { wrapper }
    )
    await act(async () => {
      await result.current.handleCopy()
    })
    expect(write).toHaveBeenCalledOnce()
    expect(result.current.copied).toBe(true)
    mockEditorRef.current = null
  })

  it('falls back to writeText when write() fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const write = vi.fn().mockRejectedValue(new Error('Not supported'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { write, writeText },
      configurable: true,
    })
    const { result } = renderHook(
      () => useJiraCopy('output', 'adf', mockEditorRef as React.RefObject<HTMLDivElement>),
      { wrapper }
    )
    await act(async () => {
      await result.current.handleCopy()
    })
    expect(writeText).toHaveBeenCalledWith('output')
    expect(result.current.copied).toBe(true)
  })

  it('does not set copied when both write() and writeText() fail', async () => {
    const write = vi.fn().mockRejectedValue(new Error('Not supported'))
    const writeText = vi.fn().mockRejectedValue(new Error('Not supported'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { write, writeText },
      configurable: true,
    })
    const { result } = renderHook(
      () => useJiraCopy('output', 'wiki', mockEditorRef as React.RefObject<HTMLDivElement>),
      { wrapper }
    )
    await act(async () => {
      await result.current.handleCopy()
    })
    expect(result.current.copied).toBe(false)
  })

  it('copied resets to false after 2 seconds', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText, write: vi.fn() },
      configurable: true,
    })
    const { result } = renderHook(
      () => useJiraCopy('x', 'wiki', mockEditorRef as React.RefObject<HTMLDivElement>),
      { wrapper }
    )
    await act(async () => {
      await result.current.handleCopy()
    })
    expect(result.current.copied).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2100)
    })
    expect(result.current.copied).toBe(false)
    vi.useRealTimers()
  })
})
