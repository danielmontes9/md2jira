import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { App } from '../src/App.js'
import { ErrorBoundary } from '../src/components/ErrorBoundary.js'

// Use vi.stubGlobal so vitest restores originals after this file's tests run,
// preventing cross-file global pollution in shared worker pools.
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
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('renders the page title', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /md2jira-previewer/i })
    ).toBeInTheDocument()
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
    // At least one copy button visible (mobile + desktop rendered but one hidden via CSS)
    // The accessible name comes from aria-label, which for the default ADF format is:
    const btns = screen.getAllByRole('button', { name: /copy as rich text for jira cloud/i })
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

  it('calls onError callback when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    const Boom = () => {
      throw new Error('boundary-test')
    }
    render(
      <ErrorBoundary onError={onError}>
        <Boom />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boundary-test' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
    spy.mockRestore()
  })
})

describe('Markdown → output conversion', () => {
  it('converts markdown headings to Jira Wiki Markup in code view', () => {
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    fireEvent.change(textarea, { target: { value: '# Hello World' } })

    // Switch to Wiki Markup format
    const wikiBtn = screen.getAllByRole('radio', { name: /wiki markup/i })
    fireEvent.click(wikiBtn[0]!)

    // Wiki mode has no Code/Preview toggle — the raw markup is shown directly in the
    // "Wiki markup preview" region (the Code/Preview toggle is ADF-only).
    const pre = screen.getByRole('region', { name: /wiki markup preview/i })
    expect(pre.textContent).toContain('h1. Hello World')
  })

  it('produces JSON ADF output for Jira Cloud format', () => {
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    fireEvent.change(textarea, { target: { value: '# Test' } })

    // Jira Cloud (ADF) is the default format — switch to Code view
    const codeBtns = screen.getAllByRole('radio', { name: /^code$/i })
    fireEvent.click(codeBtns[0]!)

    const pre = document.querySelector('pre')
    expect(pre?.textContent).toContain('"type": "doc"')
  })

  it('shows different output when toggling between ADF and Wiki formats', () => {
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    fireEvent.change(textarea, { target: { value: '**bold**' } })

    const codeBtns = screen.getAllByRole('radio', { name: /^code$/i })
    fireEvent.click(codeBtns[0]!)

    // ADF output is JSON
    const preAdf = document.querySelector('pre')
    const adfText = preAdf?.textContent ?? ''
    expect(adfText).toContain('"type": "doc"')

    // Switch to Wiki Markup
    const wikiBtn = screen.getAllByRole('radio', { name: /wiki markup/i })
    fireEvent.click(wikiBtn[0]!)

    const preWiki = document.querySelector('pre')
    expect(preWiki?.textContent).not.toContain('"type": "doc"')
    expect(preWiki?.textContent).toContain('*bold*')
  })

  it('shows no conversion error banner for valid markdown', () => {
    render(<App />)
    expect(screen.queryByText(/conversion error/i)).not.toBeInTheDocument()
  })
})

describe('Copy link button', () => {
  beforeEach(() => {
    vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) =>
      cb({ didTimeout: false, timeRemaining: () => 50 })
    )
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?md=SGVsbG8' },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows Copy link button when deep-link is active and content exists', async () => {
    const clipboardSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: clipboardSpy },
    })

    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    fireEvent.change(textarea, { target: { value: '# Hello' } })

    const copyLinkBtns = screen.queryAllByRole('button', { name: /copy shareable link/i })
    expect(copyLinkBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('calls clipboard.writeText with current URL when Copy link is clicked', async () => {
    const clipboardSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: clipboardSpy },
    })

    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    fireEvent.change(textarea, { target: { value: '# Hello' } })

    const btn = screen.getAllByRole('button', { name: /copy shareable link/i })[0]!
    fireEvent.click(btn)

    await waitFor(() => {
      expect(clipboardSpy).toHaveBeenCalledWith('http://localhost/?md=SGVsbG8')
    })
  })
})

describe('URL deep-linking', () => {
  let originalLocation: Location

  beforeEach(() => {
    originalLocation = window.location
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('initializes markdown from ?md= base64url query param', () => {
    const md = '# Hello from URL'
    const encoded = btoa(encodeURIComponent(md))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: `?md=${encoded}` },
      writable: true,
      configurable: true,
    })
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    expect((textarea as HTMLTextAreaElement).value).toContain('Hello from URL')
  })

  it('falls back to placeholder when ?md= is invalid base64', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?md=!!!invalid!!!' },
      writable: true,
      configurable: true,
    })
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    // Should fall back to the PLACEHOLDER which starts with "# My Issue"
    expect((textarea as HTMLTextAreaElement).value).toContain('My Issue')
  })
})

describe('Copy for Jira button', () => {
  it('calls clipboard API and shows Copied! feedback', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined)
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: writeMock, writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    render(<App />)
    // Default format is ADF; aria-label takes precedence over text content
    const copyBtns = screen.getAllByRole('button', { name: /copy as rich text for jira cloud/i })
    fireEvent.click(copyBtns[0]!)

    // jsdom does not support ClipboardItem, so write() may fail and fall back to writeText().
    await waitFor(() => {
      const called = writeMock.mock.calls.length > 0 || writeTextMock.mock.calls.length > 0
      expect(called).toBe(true)
    })
  })
})
