/**
 * App – URL-too-large warning toast tests
 *
 * Verifies that a warning toast fires once when the document grows beyond the
 * URL-safe size limit (isDeepLinkActive transitions true → false) and does NOT
 * fire on initial load when the document is already too large.
 *
 * Lives in a separate file so the vi.mock() for useDeepLink is scoped only
 * to this module and does not affect other App test suites.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { App } from '../src/App.js'

// ---------------------------------------------------------------------------
// Controllable mock for useDeepLink.
// The factory captures `mockDeepLinkActive` by reference so tests can change
// the returned value between renders without re-importing the module.
// ---------------------------------------------------------------------------
const mockDeepLinkActive = { current: true }

vi.mock('../src/hooks/useDeepLink.js', () => ({
  useDeepLink: () => ({ isDeepLinkActive: mockDeepLinkActive.current }),
}))

// ---------------------------------------------------------------------------
// jsdom globals required by App
// ---------------------------------------------------------------------------
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  )
  vi.stubGlobal('localStorage', { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() })
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) =>
    cb({ didTimeout: false, timeRemaining: () => 50 })
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  // Reset to "shareable" state before every test.
  mockDeepLinkActive.current = true
})

describe('App – URL-too-large warning toast', () => {
  it('shows a warning toast when the document transitions from shareable to too-large', async () => {
    const { rerender } = render(<App />)

    // No toast on initial render (doc fits in URL).
    expect(screen.queryByRole('alert')).toBeNull()

    // Simulate the document growing beyond the URL limit.
    mockDeepLinkActive.current = false
    act(() => {
      rerender(<App />)
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/document too large for url sharing/i)
  })

  it('does NOT show a toast on initial load when the document is already too large', () => {
    // Simulate App mounting with an already-oversized document (e.g. loaded from history).
    mockDeepLinkActive.current = false
    render(<App />)

    // No toast — the transition effect starts with prev=null, not prev=true.
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does NOT show a toast when isDeepLinkActive remains true', () => {
    const { rerender } = render(<App />)

    // Document stays within URL limit across re-renders.
    act(() => {
      rerender(<App />)
    })

    expect(screen.queryByRole('alert')).toBeNull()
  })
})
