/**
 * App – worker error banner tests
 *
 * These tests live in a separate file so that the vi.mock() for useAdfHtmlWorker
 * is scoped only to this module.  Placing vi.mock() inside beforeEach() in
 * App.test.tsx caused Vitest to hoist it file-wide, breaking all existing tests.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { App } from '../src/App.js'

// ---------------------------------------------------------------------------
// Module-level stub for the ADF HTML worker hook.
// vi.mock is hoisted by Vitest, so it must live at the top level of the file.
// ---------------------------------------------------------------------------
const mockRetryWorker = vi.fn()

vi.mock('../src/hooks/useAdfHtmlWorker.js', () => ({
  useAdfHtmlWorker: vi.fn(() => ({
    html: '',
    workerError: true,
    retryWorker: mockRetryWorker,
  })),
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

describe('App – worker error banner', () => {
  beforeEach(() => {
    mockRetryWorker.mockReset()
  })

  it('shows the worker-error alert banner when workerError is true', async () => {
    render(<App />)
    // Only App.tsx's top-level banner renders role="alert" for worker errors
    // after removing the duplicate banner from JiraOutput.tsx (WCAG 4.1.3).
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/preview rendering failed/i)
  })

  it('renders a Retry button inside the worker-error banner', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('calls retryWorker when the Retry button is clicked', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    })
    expect(mockRetryWorker).toHaveBeenCalledOnce()
  })
})
