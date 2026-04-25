/**
 * App – conversion error banner tests
 *
 * vi.mock('md2jira-core') is hoisted by Vitest to module level, so this file
 * is intentionally separate from App.test.tsx, which uses the real converter.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../src/App.js'

// Make both convert() and convertToAdf() throw so App's useMemo try/catch
// sets hasConversionError = true and renders the role="alert" error banner.
vi.mock('md2jira-core', () => ({
  convert: vi.fn(() => {
    throw new Error('parse failed')
  }),
  convertToAdf: vi.fn(() => {
    throw new Error('parse failed')
  }),
}))

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

describe('App \u2013 conversion error banner', () => {
  it('shows a role="alert" banner when convert() throws', () => {
    render(<App />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('banner contains the conversion-error guidance text', () => {
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/conversion error/i)
  })

  it('banner instructs the user to check their Markdown', () => {
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/check your markdown/i)
  })
})
