/**
 * App - useOutputConversion wiring tests
 *
 * Mocks useOutputConversion so AppContent wiring is verified independently
 * of the conversion logic. vi.mock is hoisted, so this is a separate file.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from '../src/App.js'

const mockRetryWorker = vi.fn()
const mockImpl = vi.fn()

vi.mock('../src/hooks/useOutputConversion.js', () => ({
  useOutputConversion: (...args: unknown[]) => mockImpl(...args),
}))

function defaultResult(overrides: Record<string, unknown> = {}) {
  return {
    jiraOutput: JSON.stringify({ version: 1, type: 'doc', content: [] }),
    adfDoc: { version: 1, type: 'doc', content: [] },
    hasConversionError: false,
    previewHtml: '',
    workerError: false,
    retryWorker: mockRetryWorker,
    isPending: false,
    isLoadingPreview: false,
    ...overrides,
  }
}

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
  mockRetryWorker.mockReset()
  mockImpl.mockReturnValue(defaultResult())
})

describe('App - useOutputConversion wiring', () => {
  it('shows the conversion-error alert when hasConversionError is true', () => {
    mockImpl.mockReturnValue(defaultResult({ hasConversionError: true, adfDoc: null }))
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/conversion error/i)
  })

  it('shows the worker-error alert when workerError is true (ADF format)', () => {
    mockImpl.mockReturnValue(defaultResult({ workerError: true }))
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/preview rendering failed/i)
  })

  it('calls retryWorker when the Retry button is clicked', () => {
    mockImpl.mockReturnValue(defaultResult({ workerError: true }))
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockRetryWorker).toHaveBeenCalledOnce()
  })

  it('passes format=adf to useOutputConversion on initial render', () => {
    render(<App />)
    expect(mockImpl).toHaveBeenCalledWith(expect.objectContaining({ format: 'adf' }))
  })

  it('passes format=wiki after switching to Wiki Markup', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: 'Wiki Markup' }))
    expect(mockImpl).toHaveBeenCalledWith(expect.objectContaining({ format: 'wiki' }))
  })
})
