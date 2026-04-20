import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClipboardEvents } from '../src/hooks/useClipboardEvents.js'
import type { RefObject } from 'react'

describe('useClipboardEvents', () => {
  const mockAddToast = vi.fn()
  const mockOnChange = vi.fn()
  let textareaEl: HTMLTextAreaElement

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    textareaEl = document.createElement('textarea')
    document.body.appendChild(textareaEl)
  })

  afterEach(() => {
    if (textareaEl.parentNode) document.body.removeChild(textareaEl)
  })

  it('returns copiedMd as false on initial render', () => {
    const ref = { current: null } as RefObject<HTMLTextAreaElement>
    const { result } = renderHook(() => useClipboardEvents('', ref, mockAddToast, mockOnChange))
    expect(result.current.copiedMd).toBe(false)
  })

  it('does not throw when textareaRef.current is null', () => {
    const ref = { current: null } as RefObject<HTMLTextAreaElement>
    expect(() =>
      renderHook(() => useClipboardEvents('text', ref, mockAddToast, mockOnChange))
    ).not.toThrow()
  })

  it('copy event writes plain text and <pre>-wrapped HTML to clipboard', () => {
    const ref = { current: textareaEl } as RefObject<HTMLTextAreaElement>
    textareaEl.value = '# Hello'
    textareaEl.setSelectionRange(0, 7)

    renderHook(() => useClipboardEvents('# Hello', ref, mockAddToast, mockOnChange))

    const clipboardData = { clearData: vi.fn(), setData: vi.fn() }
    const copyEvent = Object.assign(new Event('copy'), {
      clipboardData,
      preventDefault: vi.fn(),
    })
    act(() => textareaEl.dispatchEvent(copyEvent))

    expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', expect.any(String))
    expect(clipboardData.setData).toHaveBeenCalledWith('text/html', expect.stringContaining('<pre'))
  })

  it('paste event prevents default, strips rich text, and calls onChange', () => {
    const ref = { current: textareaEl } as RefObject<HTMLTextAreaElement>
    textareaEl.value = ''

    renderHook(() => useClipboardEvents('', ref, mockAddToast, mockOnChange))

    const preventDefaultSpy = vi.fn()
    const clipboardData = { getData: vi.fn().mockReturnValue('pasted') }
    const pasteEvent = Object.assign(new Event('paste'), {
      clipboardData,
      preventDefault: preventDefaultSpy,
    })
    act(() => textareaEl.dispatchEvent(pasteEvent))

    expect(preventDefaultSpy).toHaveBeenCalledOnce()
    expect(clipboardData.getData).toHaveBeenCalledWith('text/plain')
    // onChange should be called with the pasted value replacing the selection
    expect(mockOnChange).toHaveBeenCalledWith('pasted')
  })

  it('handleCopyMd calls clipboard.write with a pre-wrapped HTML blob', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { write, writeText: vi.fn() },
      configurable: true,
    })
    Object.defineProperty(global, 'ClipboardItem', {
      writable: true,
      value: vi.fn().mockImplementation((data: Record<string, Blob>) => ({ data })),
    })

    const ref = { current: null } as RefObject<HTMLTextAreaElement>
    const { result } = renderHook(() =>
      useClipboardEvents('# Hello', ref, mockAddToast, mockOnChange)
    )

    await act(async () => {
      result.current.handleCopyMd()
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
    })

    expect(write).toHaveBeenCalledOnce()
    expect(result.current.copiedMd).toBe(true)
  })

  it('handleCopyMd calls addToast when clipboard fails', async () => {
    const write = vi.fn().mockRejectedValue(new Error('not supported'))
    const writeText = vi.fn().mockRejectedValue(new Error('not supported'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { write, writeText },
      configurable: true,
    })
    Object.defineProperty(global, 'ClipboardItem', {
      writable: true,
      value: vi.fn().mockImplementation((data: Record<string, Blob>) => ({ data })),
    })

    const ref = { current: null } as RefObject<HTMLTextAreaElement>
    const { result } = renderHook(() =>
      useClipboardEvents('# Hello', ref, mockAddToast, mockOnChange)
    )

    await act(async () => {
      result.current.handleCopyMd()
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    })

    expect(mockAddToast).toHaveBeenCalledWith('Failed to copy to clipboard', 'error')
    expect(result.current.copiedMd).toBe(false)
  })
})
