import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDeepLink } from '../src/hooks/useDeepLink.js'
import { encodeMarkdown, URL_MD_MAX_ENCODED } from '../src/utils/markdown-url.js'

// ── Stubs ─────────────────────────────────────────────────────────────────────

const replaceStateSpy = vi.fn()

function setLocation(href: string) {
  Object.defineProperty(window, 'location', {
    value: { href, search: new URL(href).search },
    writable: true,
    configurable: true,
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  replaceStateSpy.mockReset()
  Object.defineProperty(window, 'history', {
    value: { replaceState: replaceStateSpy },
    writable: true,
    configurable: true,
  })
  // Default location: clean base URL with no params
  setLocation('http://localhost/')
})

afterEach(() => {
  vi.useRealTimers()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDeepLink', () => {
  it('isDeepLinkActive is true when markdown is empty', () => {
    const { result } = renderHook(() => useDeepLink('', 'adf'))
    expect(result.current.isDeepLinkActive).toBe(true)
  })

  it('isDeepLinkActive is true when short markdown fits within the URL limit', () => {
    const { result } = renderHook(() => useDeepLink('# Hello', 'adf'))
    expect(result.current.isDeepLinkActive).toBe(true)
  })

  it('isDeepLinkActive is false when encoded markdown exceeds URL_MD_MAX_ENCODED', () => {
    // Unicode chars encode ~9x longer — 300 CJK chars easily exceed the 2000-byte limit
    const longMd = '中'.repeat(300)
    const encoded = encodeMarkdown(longMd)
    expect(encoded.length).toBeGreaterThan(URL_MD_MAX_ENCODED) // verify test assumption
    const { result } = renderHook(() => useDeepLink(longMd, 'adf'))
    expect(result.current.isDeepLinkActive).toBe(false)
  })

  it('does not call replaceState before the 500ms debounce fires', () => {
    renderHook(() => useDeepLink('# Hello', 'adf'))
    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(replaceStateSpy).not.toHaveBeenCalled()
  })

  it('calls replaceState after the 500ms debounce', () => {
    renderHook(() => useDeepLink('# Hello', 'adf'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(replaceStateSpy).toHaveBeenCalledOnce()
  })

  it('sets the ?md= param with the base64url-encoded markdown value', () => {
    const md = '# Hello'
    renderHook(() => useDeepLink(md, 'adf'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const calledUrl = replaceStateSpy.mock.calls[0]![2] as string
    const url = new URL(calledUrl)
    expect(url.searchParams.get('md')).toBe(encodeMarkdown(md))
  })

  it('removes ?md= param when markdown is empty', () => {
    setLocation('http://localhost/?md=abc123')
    renderHook(() => useDeepLink('', 'adf'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const calledUrl = replaceStateSpy.mock.calls[0]![2] as string
    const url = new URL(calledUrl)
    expect(url.searchParams.has('md')).toBe(false)
  })

  it('adds ?fmt=wiki for wiki format', () => {
    renderHook(() => useDeepLink('# Hello', 'wiki'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const calledUrl = replaceStateSpy.mock.calls[0]![2] as string
    const url = new URL(calledUrl)
    expect(url.searchParams.get('fmt')).toBe('wiki')
  })

  it('removes ?fmt= param for adf format', () => {
    setLocation('http://localhost/?fmt=wiki')
    renderHook(() => useDeepLink('# Hello', 'adf'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    const calledUrl = replaceStateSpy.mock.calls[0]![2] as string
    const url = new URL(calledUrl)
    expect(url.searchParams.has('fmt')).toBe(false)
  })

  it('does not set ?md= when markdown exceeds URL_MD_MAX_ENCODED', () => {
    const longMd = '中'.repeat(300)
    // Start with an existing ?md= param so there is a URL change to make
    setLocation('http://localhost/?md=previousvalue')
    renderHook(() => useDeepLink(longMd, 'adf'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    // replaceState IS called (to strip the old ?md= param)
    const calledUrl = replaceStateSpy.mock.calls[0]![2] as string
    const url = new URL(calledUrl)
    expect(url.searchParams.has('md')).toBe(false)
  })

  it('cancels the pending debounce when the component unmounts', () => {
    const { unmount } = renderHook(() => useDeepLink('# Hello', 'adf'))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    unmount()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(replaceStateSpy).not.toHaveBeenCalled()
  })

  it('skips replaceState when the computed URL is identical to the current one', () => {
    const md = '# Hello'
    const encoded = encodeMarkdown(md)
    // Pre-set location to exactly what the hook would compute
    setLocation(`http://localhost/?md=${encoded}`)
    renderHook(() => useDeepLink(md, 'adf'))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(replaceStateSpy).not.toHaveBeenCalled()
  })
})
