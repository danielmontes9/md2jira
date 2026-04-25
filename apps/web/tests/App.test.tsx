import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { App } from '../src/App.js'
import { PLACEHOLDER } from '../src/utils/markdown-url.js'

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
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) =>
    cb({ didTimeout: false, timeRemaining: () => 50 })
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// Encode helper matching the base64url scheme used in App.tsx
function encodeMarkdown(md: string): string {
  return btoa(encodeURIComponent(md)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('App – conversion pipeline', () => {
  it('renders wiki output for the PLACEHOLDER when wiki format is selected', async () => {
    render(<App />)

    // Switch to Wiki Markup format
    const wikiBtn = screen.getByRole('radio', { name: 'Wiki Markup' })
    await act(async () => {
      fireEvent.click(wikiBtn)
    })

    // The PLACEHOLDER starts with "# My Issue" → should produce "h1. My Issue"
    await waitFor(() => {
      const pre = screen.getByRole('region', { name: /wiki markup preview/i })
      expect(pre.textContent).toContain('h1. My Issue')
    })
  })

  it('updates wiki output when markdown changes', async () => {
    render(<App />)

    // Switch to Wiki Markup format first
    const wikiBtn = screen.getByRole('radio', { name: 'Wiki Markup' })
    await act(async () => {
      fireEvent.click(wikiBtn)
    })

    // Clear the textarea and type simple markdown
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    await act(async () => {
      fireEvent.change(textarea, { target: { value: '## Section' } })
    })

    await waitFor(() => {
      const pre = screen.getByRole('region', { name: /wiki markup preview/i })
      expect(pre.textContent).toContain('h2. Section')
    })
  })

  it('shows ADF JSON output in code view when format is ADF', async () => {
    render(<App />)

    // App starts in ADF format. Switch to Code view.
    const viewModeGroup = screen.getByRole('radiogroup', { name: /view mode/i })
    const codeBtn = within(viewModeGroup).getByRole('radio', { name: 'Code' })
    await act(async () => {
      fireEvent.click(codeBtn)
    })

    // The code view pre should show JSON with ADF version field
    await waitFor(() => {
      const pre = screen.getByRole('region', { name: /adf json code/i })
      expect(pre.textContent).toContain('"version"')
    })
  })
})

describe('App – format toggle', () => {
  it('switching from ADF to Wiki shows the wiki output region', async () => {
    render(<App />)

    // Initially ADF (no wiki region)
    expect(screen.queryByRole('region', { name: /wiki markup preview/i })).not.toBeInTheDocument()

    const wikiBtn = screen.getByRole('radio', { name: 'Wiki Markup' })
    await act(async () => {
      fireEvent.click(wikiBtn)
    })

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /wiki markup preview/i })).toBeInTheDocument()
    })
  })

  it('switching back to ADF removes the wiki output region', async () => {
    render(<App />)

    // Go to Wiki Markup
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Wiki Markup' }))
    })
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /wiki markup preview/i })).toBeInTheDocument()
    })

    // Go back to Jira Cloud (ADF)
    const adfBtn = screen.getByRole('radio', { name: 'Jira Cloud' })
    await act(async () => {
      fireEvent.click(adfBtn)
    })

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /wiki markup preview/i })).not.toBeInTheDocument()
    })
  })
})

describe('App – URL deep-linking', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Reset location mocks to a clean base URL
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/', search: '' },
    })
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { replaceState: vi.fn() },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('initializes textarea with markdown decoded from ?md= URL param', () => {
    const encoded = encodeMarkdown('# Hello from URL')
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: `http://localhost/?md=${encoded}`, search: `?md=${encoded}` },
    })

    render(<App />)

    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    expect(textarea).toHaveValue('# Hello from URL')
  })

  it('falls back to PLACEHOLDER when ?md= param is absent', () => {
    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    expect(textarea).toHaveValue(PLACEHOLDER)
  })

  it('falls back to PLACEHOLDER when ?md= param is invalid base64', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?md=!!!invalid!!!', search: '?md=!!!invalid!!!' },
    })

    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    expect(textarea).toHaveValue(PLACEHOLDER)
  })

  it('falls back to PLACEHOLDER when ?md= param exceeds size limit', () => {
    // URL_MD_MAX_ENCODED is 1500; decodeMarkdown rejects encoded.length > 3000
    const oversized = 'A'.repeat(3001)
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: `http://localhost/?md=${oversized}`, search: `?md=${oversized}` },
    })

    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    expect(textarea).toHaveValue(PLACEHOLDER)
  })

  it('falls back to PLACEHOLDER when ?md= param is empty string', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?md=', search: '?md=' },
    })

    render(<App />)
    const textarea = screen.getByPlaceholderText('Paste your Markdown here...')
    expect(textarea).toHaveValue(PLACEHOLDER)
  })

  it('starts in Wiki Markup format when ?fmt=wiki is in the URL', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?fmt=wiki', search: '?fmt=wiki' },
    })

    render(<App />)
    const wikiBtn = screen.getByRole('radio', { name: 'Wiki Markup' })
    expect(wikiBtn).toHaveAttribute('aria-checked', 'true')
    const adfBtn = screen.getByRole('radio', { name: 'Jira Cloud' })
    expect(adfBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('starts in Jira Cloud (ADF) format when ?fmt=adf is in the URL', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?fmt=adf', search: '?fmt=adf' },
    })

    render(<App />)
    const adfBtn = screen.getByRole('radio', { name: 'Jira Cloud' })
    expect(adfBtn).toHaveAttribute('aria-checked', 'true')
  })
})

describe('App – accessibility', () => {
  it('renders a skip link that targets the main content landmark', () => {
    render(<App />)
    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('main landmark exists and matches the skip-link target', () => {
    render(<App />)
    const main = document.getElementById('main-content')
    expect(main).not.toBeNull()
    expect(main!.tagName).toBe('MAIN')
  })

  it('skip link is the first focusable element in the page', () => {
    render(<App />)
    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    // The skip link must appear before any other interactive element in the DOM
    const allInteractive = document.querySelectorAll('a, button, input, [tabindex]')
    expect(allInteractive[0]).toBe(skipLink)
  })
})

describe('App – loading state', () => {
  it('does not show a loading spinner when input and deferred value are in sync', () => {
    render(<App />)
    // isPending is false when not transitioning — no spinner/progressbar visible
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

describe('App – wiki code view', () => {
  it('shows wiki markup code view region when format is wiki and view mode is code', async () => {
    render(<App />)

    // Switch to Wiki Markup format
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Wiki Markup' }))
    })

    // Wiki format has no view-mode toggle (code/preview only exists for ADF);
    // the wiki output is always rendered as the wiki markup preview region.
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /wiki markup preview/i })).toBeInTheDocument()
    })
  })

  it('shows wiki markup code view when format is wiki and code view is selected', async () => {
    render(<App />)

    // Switch to ADF code view first so view-mode toggle exists, then switch format
    const viewModeGroup = screen.getByRole('radiogroup', { name: /view mode/i })
    await act(async () => {
      fireEvent.click(within(viewModeGroup).getByRole('radio', { name: 'Code' }))
    })

    // Switch to Wiki Markup — wiki format renders a single region without a view-mode toggle
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Wiki Markup' }))
    })

    // The PLACEHOLDER starts with "# My Issue" → should produce "h1. My Issue" in the region
    await waitFor(() => {
      const pre = screen.getByRole('region', { name: /wiki markup preview/i })
      expect(pre.textContent).toContain('h1. My Issue')
    })
  })
})

describe('getInitialFormat via App', () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/', search: '' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReset()
  })

  it('falls back to ADF when ?fmt= param has an unrecognised value', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?fmt=html', search: '?fmt=html' },
    })
    render(<App />)
    expect(screen.getByRole('radio', { name: 'Jira Cloud' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('reads wiki format from localStorage when no ?fmt= param is present', () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
      key === 'output-format' ? 'wiki' : null
    )
    render(<App />)
    expect(screen.getByRole('radio', { name: 'Wiki Markup' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('falls back to ADF when localStorage has an invalid format value', () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
      key === 'output-format' ? 'html' : null
    )
    render(<App />)
    expect(screen.getByRole('radio', { name: 'Jira Cloud' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('URL ?fmt= param takes precedence over localStorage', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/?fmt=adf', search: '?fmt=adf' },
    })
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
      key === 'output-format' ? 'wiki' : null
    )
    render(<App />)
    expect(screen.getByRole('radio', { name: 'Jira Cloud' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })
})
