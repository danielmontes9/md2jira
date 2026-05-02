import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistorySidebar } from '../src/components/HistorySidebar.js'
import type { HistoryEntry } from '../src/hooks/useDocumentHistory.js'

// HistorySidebar uses useT() which calls useSettings(). Mock the context so
// these unit tests don't need a SettingsProvider wrapper.
vi.mock('../src/context/SettingsContext.js', () => ({
  useSettings: () => ({
    historyEnabled: true,
    maxHistoryEntries: 10 as const,
    locale: 'en' as const,
    toggleHistory: vi.fn(),
    setMaxHistoryEntries: vi.fn(),
    setLocale: vi.fn(),
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  )
})
afterAll(() => vi.unstubAllGlobals())

function makeEntry(id: string, content: string, title = id): HistoryEntry {
  return { id, title, content, savedAt: Date.parse('2025-01-15T10:30:00Z') }
}

const baseProps = {
  history: [],
  onLoadEntry: vi.fn(),
  onDeleteEntry: vi.fn(),
  onClearHistory: vi.fn(),
  onClose: vi.fn(),
}

// ── Empty state ──────────────────────────────────────────────────────────────

describe('HistorySidebar — empty state', () => {
  it('renders the empty-state message when history is empty', () => {
    render(<HistorySidebar {...baseProps} />)
    expect(screen.getByText(/no saved documents yet/i)).toBeInTheDocument()
  })

  it('does not render the Clear all button when history is empty', () => {
    render(<HistorySidebar {...baseProps} />)
    expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument()
  })
})

// ── With entries ─────────────────────────────────────────────────────────────

describe('HistorySidebar — with entries', () => {
  const entries = [makeEntry('1', '# Doc One', 'Doc One'), makeEntry('2', '## Doc Two', 'Doc Two')]

  it('renders all entry titles', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.getByText('Doc One')).toBeInTheDocument()
    expect(screen.getByText('Doc Two')).toBeInTheDocument()
  })

  it('calls onLoadEntry with the entry id when a title is clicked', () => {
    const onLoadEntry = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onLoadEntry={onLoadEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Doc One' }))
    expect(onLoadEntry).toHaveBeenCalledWith('1')
  })

  it('calls onDeleteEntry when the delete button is clicked', () => {
    const onDeleteEntry = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntry={onDeleteEntry} />)
    fireEvent.click(screen.getByRole('button', { name: /delete "Doc One"/i }))
    expect(onDeleteEntry).toHaveBeenCalledWith('1')
  })
})

// ── Clear confirmation ────────────────────────────────────────────────────────

describe('HistorySidebar — clear confirmation', () => {
  const entries = [makeEntry('1', '# Doc', 'Doc')]

  it('shows the Clear all button when history has entries', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })

  it('shows a confirmation prompt when Clear all is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(screen.getByText(/clear all\?/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^yes$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^no$/i })).toBeInTheDocument()
  })

  it('calls onClearHistory when Yes is confirmed', () => {
    const onClearHistory = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onClearHistory={onClearHistory} />)
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }))
    expect(onClearHistory).toHaveBeenCalledOnce()
  })

  it('does not call onClearHistory when No is clicked', () => {
    const onClearHistory = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onClearHistory={onClearHistory} />)
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    fireEvent.click(screen.getByRole('button', { name: /^no$/i }))
    expect(onClearHistory).not.toHaveBeenCalled()
  })

  it('hides the confirmation prompt after No is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    fireEvent.click(screen.getByRole('button', { name: /^no$/i }))
    expect(screen.queryByText(/clear all\?/i)).not.toBeInTheDocument()
  })
})

// ── Active indicator ─────────────────────────────────────────────────────────

describe('HistorySidebar — active indicator', () => {
  const entries = [
    makeEntry('1', '# Doc One\n\nContent.', 'Doc One'),
    makeEntry('2', '# Doc Two\n\nOther.', 'Doc Two'),
  ]

  it('shows the active indicator for the entry that matches currentMarkdown', () => {
    render(
      <HistorySidebar {...baseProps} history={entries} currentMarkdown={'# Doc One\n\nContent.'} />
    )
    expect(screen.getByTestId('active-indicator')).toBeInTheDocument()
  })

  it('does not show the active indicator when currentMarkdown does not match any entry', () => {
    render(
      <HistorySidebar
        {...baseProps}
        history={entries}
        currentMarkdown={'something completely different'}
      />
    )
    expect(screen.queryByTestId('active-indicator')).not.toBeInTheDocument()
  })

  it('does not show the active indicator when currentMarkdown is undefined', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.queryByTestId('active-indicator')).not.toBeInTheDocument()
  })
})

// ── Keyboard & close ─────────────────────────────────────────────────────────

describe('HistorySidebar — keyboard & close', () => {
  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<HistorySidebar {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close document history/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed inside the panel', () => {
    const onClose = vi.fn()
    const { container } = render(
      <HistorySidebar {...baseProps} history={[makeEntry('1', '# x', 'x')]} onClose={onClose} />
    )
    const aside = container.querySelector('aside')!
    fireEvent.keyDown(aside, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ── ARIA semantics ────────────────────────────────────────────────────────────

describe('HistorySidebar — ARIA', () => {
  it('renders as a dialog with aria-modal', () => {
    const { container } = render(<HistorySidebar {...baseProps} />)
    const aside = container.querySelector('aside')!
    expect(aside).toHaveAttribute('role', 'dialog')
    expect(aside).toHaveAttribute('aria-modal', 'true')
  })
})
