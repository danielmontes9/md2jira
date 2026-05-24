import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
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

// ── Select mode & bulk delete ─────────────────────────────────────────────────

describe('HistorySidebar — select mode & bulk delete', () => {
  const entries = [makeEntry('1', '# Doc One', 'Doc One'), makeEntry('2', '## Doc Two', 'Doc Two')]

  it('shows the Select button when history has entries', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.getByRole('button', { name: /enter bulk selection mode/i })).toBeInTheDocument()
  })

  it('does not show the Select button when history is empty', () => {
    render(<HistorySidebar {...baseProps} />)
    expect(
      screen.queryByRole('button', { name: /enter bulk selection mode/i })
    ).not.toBeInTheDocument()
  })

  it('enters select mode and shows checkboxes when Select is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    expect(screen.getByLabelText(/select "Doc One"/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/select "Doc Two"/i)).toBeInTheDocument()
  })

  it('shows Delete selected and Cancel buttons in select mode', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
  })

  it('Delete selected is disabled when no entries are checked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    const deleteBtn = screen.getByRole('button', { name: /delete selected/i })
    expect(deleteBtn).toBeDisabled()
  })

  it('calls onDeleteEntries with selected ids when Delete selected is clicked', () => {
    const onDeleteEntries = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntries={onDeleteEntries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    const deleteBtn = screen.getByRole('button', { name: /delete selected/i })
    expect(deleteBtn).not.toBeDisabled()
    fireEvent.click(deleteBtn)
    expect(onDeleteEntries).toHaveBeenCalledWith(['1'])
  })

  it('falls back to calling onDeleteEntry for each id when onDeleteEntries is not provided', () => {
    const onDeleteEntry = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntry={onDeleteEntry} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc Two"/i))
    fireEvent.click(screen.getByRole('button', { name: /delete selected/i }))
    expect(onDeleteEntry).toHaveBeenCalledWith('2')
  })

  it('exits select mode when Cancel is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    // Select mode should be gone — load buttons visible again
    expect(screen.getByRole('button', { name: 'Doc One' })).toBeInTheDocument()
  })

  it('exits select mode automatically after bulk delete', () => {
    const onDeleteEntries = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntries={onDeleteEntries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    fireEvent.click(screen.getByRole('button', { name: /delete selected/i }))
    // After deletion the sidebar should return to normal mode
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument()
  })

  it('Select all button selects all filtered entries', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    const deleteBtn = screen.getByRole('button', { name: /delete selected \(2\)/i })
    expect(deleteBtn).not.toBeDisabled()
  })

  it('Deselect all button clears all selections when all are selected', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    // Select all
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    // Now button should say "Deselect all"
    expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument()
    // Click deselect all
    fireEvent.click(screen.getByRole('button', { name: /deselect all/i }))
    // Delete selected should be disabled again
    expect(screen.getByRole('button', { name: /delete selected$/i })).toBeDisabled()
  })

  it('shows selected count in Delete button label', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    expect(screen.getByRole('button', { name: /delete selected \(1\)/i })).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/select "Doc Two"/i))
    expect(screen.getByRole('button', { name: /delete selected \(2\)/i })).toBeInTheDocument()
  })
})

// ── Import / Export ──────────────────────────────────────────────────────────

describe('HistorySidebar — import/export', () => {
  const entries = [makeEntry('1', '# Doc One', 'Doc One'), makeEntry('2', '## Doc Two', 'Doc Two')]

  beforeEach(() => localStorage.clear())

  it('Export button triggers a download with the history JSON', () => {
    // jsdom does not implement URL.createObjectURL/revokeObjectURL — assign stubs
    const createObjectURL = vi.fn().mockReturnValue('blob:fake')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue(undefined)

    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /export history/i }))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(anchorClick).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')

    anchorClick.mockRestore()
    // restore originals (they were undefined in jsdom, so delete the assigned props)
    delete (URL as unknown as Record<string, unknown>)['createObjectURL']
    delete (URL as unknown as Record<string, unknown>)['revokeObjectURL']
  })

  it('Import button is always present regardless of history length', () => {
    render(<HistorySidebar {...baseProps} history={[]} />)
    expect(screen.getByRole('button', { name: /import history/i })).toBeInTheDocument()
  })

  it('Import merges new valid entries and ignores invalid ones', async () => {
    const readTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (
      this: FileReader
    ) {
      // Simulate async load: valid entry + several invalid ones
      Promise.resolve().then(() => {
        Object.defineProperty(this, 'result', {
          configurable: true,
          get: () =>
            JSON.stringify([
              { id: 'n1', title: 'New Valid', content: '# new', savedAt: 2_000_000 },
              { id: 'bad1', title: null, content: '# bad', savedAt: 1 }, // null title
              { id: 'bad2', title: 'ok' }, // missing content + savedAt
              'not-an-object',
            ]),
        })
        this.dispatchEvent(new ProgressEvent('load'))
      })
    })

    render(<HistorySidebar {...baseProps} history={[makeEntry('existing', '# Old', 'Old')]} />)

    // Trigger the hidden file input change
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['[]'], 'h.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })

    // Wait for the FileReader onload simulation
    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('md2jira-doc-history') ?? '[]') as unknown[]
      expect(stored.length).toBe(2) // 'n1' + 'existing'
    })

    const stored = JSON.parse(localStorage.getItem('md2jira-doc-history') ?? '[]') as Array<{
      id: string
    }>
    expect(stored.map((e) => e.id)).toContain('n1')
    expect(stored.map((e) => e.id)).toContain('existing')

    readTextSpy.mockRestore()
  })

  it('Import respects maxHistoryEntries cap (mocked at 10) and does not exceed it', async () => {
    // maxHistoryEntries is mocked to 10 in the vi.mock at the top of this file
    const manyEntries = Array.from({ length: 20 }, (_, i) => ({
      id: `n${i}`,
      title: `Doc ${i}`,
      content: `# Doc ${i}`,
      savedAt: Date.now() + i,
    }))

    const readTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (
      this: FileReader
    ) {
      Promise.resolve().then(() => {
        Object.defineProperty(this, 'result', {
          configurable: true,
          get: () => JSON.stringify(manyEntries),
        })
        this.dispatchEvent(new ProgressEvent('load'))
      })
    })

    render(<HistorySidebar {...baseProps} history={[]} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['[]'], 'h.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('md2jira-doc-history') ?? '[]') as unknown[]
      expect(stored.length).toBeLessThanOrEqual(10)
    })

    readTextSpy.mockRestore()
  })

  it('Import does not add duplicate ids that already exist in history', async () => {
    const existing = makeEntry('dup', '# Dup', 'Dup')

    const readTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (
      this: FileReader
    ) {
      Promise.resolve().then(() => {
        Object.defineProperty(this, 'result', {
          configurable: true,
          get: () =>
            JSON.stringify([
              { id: 'dup', title: 'Dup', content: '# Dup', savedAt: 1 }, // duplicate
              { id: 'new1', title: 'New', content: '# New', savedAt: 2 },
            ]),
        })
        this.dispatchEvent(new ProgressEvent('load'))
      })
    })

    render(<HistorySidebar {...baseProps} history={[existing]} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['[]'], 'h.json')] } })

    await vi.waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('md2jira-doc-history') ?? '[]') as Array<{
        id: string
      }>
      expect(stored.map((e) => e.id).filter((id) => id === 'dup')).toHaveLength(1)
    })

    readTextSpy.mockRestore()
  })
})
