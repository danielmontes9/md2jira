/**
 * App – offline and PWA-update status banner integration tests.
 *
 * These tests live in a separate file so that the vi.mock() calls for
 * useOfflineStatus and usePwaUpdate are scoped only to this module.
 * Both hooks are mocked at module level (vi.mock is hoisted by Vitest).
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { App } from '../src/App.js'

// ---------------------------------------------------------------------------
// Mock useOfflineStatus to always return true (device is offline).
// ---------------------------------------------------------------------------
vi.mock('../src/hooks/useOfflineStatus.js', () => ({
  useOfflineStatus: vi.fn(() => true),
}))

// ---------------------------------------------------------------------------
// Mock usePwaUpdate to always report a pending update.
// ---------------------------------------------------------------------------
const mockApplyUpdate = vi.fn()

vi.mock('../src/hooks/usePwaUpdate.js', () => ({
  usePwaUpdate: vi.fn(() => ({ needsUpdate: true, applyUpdate: mockApplyUpdate })),
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

// ---------------------------------------------------------------------------
// With both mocks active, App renders two role="status" banners simultaneously:
// one for offline and one for the PWA update. Tests use text content to
// distinguish them.
// ---------------------------------------------------------------------------

describe('App – offline status banner', () => {
  it('renders a status banner when the device is offline', () => {
    render(<App />)
    const statuses = screen.getAllByRole('status')
    const offlineBanner = statuses.find((el) => /offline/i.test(el.textContent ?? ''))
    expect(offlineBanner).toBeTruthy()
  })

  it('offline banner informs the user that conversions still work from cache', () => {
    render(<App />)
    const statuses = screen.getAllByRole('status')
    const offlineBanner = statuses.find((el) => /offline/i.test(el.textContent ?? ''))
    expect(offlineBanner).toHaveTextContent(/running from cache/i)
    expect(offlineBanner).toHaveTextContent(/conversions still work/i)
  })

  it('offline banner uses aria-live="polite" so screen readers are not interrupted', () => {
    render(<App />)
    const statuses = screen.getAllByRole('status')
    const offlineBanner = statuses.find((el) => /offline/i.test(el.textContent ?? ''))
    expect(offlineBanner).toHaveAttribute('aria-live', 'polite')
  })
})

describe('App – PWA update banner', () => {
  it('renders a status banner when a new version is available', () => {
    render(<App />)
    const statuses = screen.getAllByRole('status')
    const updateBanner = statuses.find((el) => /new version/i.test(el.textContent ?? ''))
    expect(updateBanner).toBeTruthy()
  })

  it('PWA update banner informs the user a new version is available', () => {
    render(<App />)
    const statuses = screen.getAllByRole('status')
    const updateBanner = statuses.find((el) => /new version/i.test(el.textContent ?? ''))
    expect(updateBanner).toHaveTextContent(/new version is available/i)
  })

  it('renders an "Update now" button inside the PWA update banner', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /update now/i })).toBeInTheDocument()
  })

  it('"Update now" button calls applyUpdate when clicked', () => {
    mockApplyUpdate.mockReset()
    render(<App />)
    const btn = screen.getByRole('button', { name: /update now/i })
    act(() => {
      fireEvent.click(btn)
    })
    expect(mockApplyUpdate).toHaveBeenCalledOnce()
  })
})
