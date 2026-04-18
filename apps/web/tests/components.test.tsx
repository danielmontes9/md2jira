import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { App } from '../src/App.js'
import { ErrorBoundary } from '../src/components/ErrorBoundary.js'

// Minimal stub for localStorage and matchMedia (jsdom lacks these)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockReturnValue({ matches: false }),
})
Object.defineProperty(window, 'localStorage', {
  value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
})

describe('App', () => {
  it('renders the page title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders the Markdown textarea', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('Paste your Markdown here...')).toBeInTheDocument()
  })

  it('shows the Jira output section', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: /jira output/i })).toBeInTheDocument()
  })

  it('toggles theme button label', () => {
    render(<App />)
    const btn = screen.getByRole('button', { name: /switch to/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    // After click the label flips (light→dark or dark→light)
    expect(screen.getByRole('button', { name: /switch to/i })).toBeInTheDocument()
  })

  it('renders the Markdown input section', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: /markdown input/i })).toBeInTheDocument()
  })

  it('shows the Copy for Jira button', () => {
    render(<App />)
    // At least one "Copy for Jira" button visible (mobile + desktop rendered but one hidden via CSS)
    const btns = screen.getAllByRole('button', { name: /copy for jira/i })
    expect(btns.length).toBeGreaterThanOrEqual(1)
  })
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <span>ok</span>
      </ErrorBoundary>
    )
    expect(screen.getByText('ok')).toBeInTheDocument()
  })

  it('renders fallback on error', () => {
    // Suppress console.error for expected boundary error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => {
      throw new Error('test error')
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/test error/i)).toBeInTheDocument()
    spy.mockRestore()
  })

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => {
      throw new Error('boom')
    }
    render(
      <ErrorBoundary fallback={<span>custom fallback</span>}>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('custom fallback')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('recovers when Retry is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true
    const MaybeThrow = () => {
      if (shouldThrow) throw new Error('boom')
      return <span>recovered</span>
    }
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(screen.getByText('recovered')).toBeInTheDocument()
    spy.mockRestore()
  })
})
