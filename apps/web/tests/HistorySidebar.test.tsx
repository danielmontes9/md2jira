import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
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

  it('clicking delete opens a confirm modal; confirming calls onDeleteEntry', () => {
    vi.useFakeTimers()
    const onDeleteEntry = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntry={onDeleteEntry} />)
    // First click opens the modal — onDeleteEntry must NOT fire yet
    fireEvent.click(screen.getByRole('button', { name: /delete "Doc One"/i }))
    expect(screen.getByText('Confirm delete?')).toBeInTheDocument()
    expect(onDeleteEntry).not.toHaveBeenCalled()
    // Click Delete in the modal — action deferred until exit animation completes
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(onDeleteEntry).not.toHaveBeenCalled()
    act(() => {
      vi.runAllTimers()
    })
    expect(onDeleteEntry).toHaveBeenCalledWith('1')
    vi.useRealTimers()
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

  it('shows the active indicator for the entry whose id matches activeEntryId', () => {
    // activeEntryId = string: O(1) lookup — content does not matter
    render(<HistorySidebar {...baseProps} history={entries} activeEntryId="1" />)
    expect(screen.getByTestId('active-indicator')).toBeInTheDocument()
  })

  it('does not show the active indicator when activeEntryId is null even if content matches', () => {
    // activeEntryId = null means "nothing loaded" — overrides content comparison
    render(
      <HistorySidebar
        {...baseProps}
        history={entries}
        currentMarkdown={'# Doc One\n\nContent.'}
        activeEntryId={null}
      />
    )
    expect(screen.queryByTestId('active-indicator')).not.toBeInTheDocument()
  })

  it('does not show the active indicator when activeEntryId points to a deleted/non-existent entry', () => {
    // Covers the race condition where loadedEntryId holds a stale ID after bulk delete
    render(<HistorySidebar {...baseProps} history={entries} activeEntryId="999" />)
    expect(screen.queryByTestId('active-indicator')).not.toBeInTheDocument()
  })
})

// ── Keyboard & close ─────────────────────────────────────────────────────────

describe('HistorySidebar — keyboard & close', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<HistorySidebar {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close document history/i }))
    vi.runAllTimers()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed inside the panel', () => {
    const onClose = vi.fn()
    const { container } = render(
      <HistorySidebar {...baseProps} history={[makeEntry('1', '# x', 'x')]} onClose={onClose} />
    )
    const aside = container.querySelector('aside')!
    fireEvent.keyDown(aside, { key: 'Escape' })
    vi.runAllTimers()
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
    vi.useFakeTimers()
    const onDeleteEntries = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntries={onDeleteEntries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    // Single click opens the confirmation modal
    fireEvent.click(screen.getByRole('button', { name: /delete selected/i }))
    expect(
      screen.getByRole('heading', { name: /delete selected documents\?/i })
    ).toBeInTheDocument()
    expect(onDeleteEntries).not.toHaveBeenCalled()
    // Confirm in modal — action deferred until exit animation completes
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    act(() => {
      vi.runAllTimers()
    })
    expect(onDeleteEntries).toHaveBeenCalledWith(['1'])
    vi.useRealTimers()
  })

  it('falls back to calling onDeleteEntry for each id when onDeleteEntries is not provided', () => {
    vi.useFakeTimers()
    const onDeleteEntry = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntry={onDeleteEntry} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc Two"/i))
    fireEvent.click(screen.getByRole('button', { name: /delete selected/i }))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    act(() => {
      vi.runAllTimers()
    })
    expect(onDeleteEntry).toHaveBeenCalledWith('2')
    vi.useRealTimers()
  })

  it('exits select mode when Cancel is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    // Select mode should be gone — load buttons visible again
    expect(screen.getByRole('button', { name: 'Doc One' })).toBeInTheDocument()
  })

  it('exits select mode automatically after bulk delete', () => {
    vi.useFakeTimers()
    const onDeleteEntries = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntries={onDeleteEntries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    fireEvent.click(screen.getByRole('button', { name: /delete selected/i }))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    act(() => {
      vi.runAllTimers()
    })
    // After deletion the sidebar should return to normal mode
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument()
    vi.useRealTimers()
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

  it('clicking Delete selected opens a confirmation modal', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    fireEvent.click(screen.getByRole('button', { name: /delete selected \(1\)/i }))
    // Confirmation modal should appear
    expect(
      screen.getByRole('heading', { name: /delete selected documents\?/i })
    ).toBeInTheDocument()
  })

  it('Cancel button in bulk delete modal closes it without deleting', () => {
    vi.useFakeTimers()
    const onDeleteEntries = vi.fn()
    render(<HistorySidebar {...baseProps} history={entries} onDeleteEntries={onDeleteEntries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    fireEvent.click(screen.getByLabelText(/select "Doc One"/i))
    fireEvent.click(screen.getByRole('button', { name: /delete selected \(1\)/i }))
    expect(
      screen.getByRole('heading', { name: /delete selected documents\?/i })
    ).toBeInTheDocument()
    // Discriminate by accessible name so we target the modal, not the sidebar
    const dialog = screen.getByRole('dialog', { name: /delete selected documents/i })
    fireEvent.click(within(dialog).getByRole('button', { name: /^cancel$/i }))
    act(() => {
      vi.runAllTimers()
    })
    expect(onDeleteEntries).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('heading', { name: /delete selected documents\?/i })
    ).not.toBeInTheDocument()
    vi.useRealTimers()
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

  it('calls onImportSuccess with the count of newly merged entries', async () => {
    const onImportSuccess = vi.fn()

    const readTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (
      this: FileReader
    ) {
      Promise.resolve().then(() => {
        Object.defineProperty(this, 'result', {
          configurable: true,
          get: () =>
            JSON.stringify([
              { id: 'fresh1', title: 'Fresh', content: '# Fresh', savedAt: 3_000_000 },
            ]),
        })
        this.dispatchEvent(new ProgressEvent('load'))
      })
    })

    render(
      <HistorySidebar
        {...baseProps}
        history={[makeEntry('existing', '# Old', 'Old')]}
        onImportSuccess={onImportSuccess}
      />
    )

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['[]'], 'h.json')] } })

    await vi.waitFor(() => {
      expect(onImportSuccess).toHaveBeenCalledWith(1)
    })

    readTextSpy.mockRestore()
  })

  it('calls onImportSuccess with 0 when all imported entries are duplicates', async () => {
    const onImportSuccess = vi.fn()
    const existing = makeEntry('dup2', '# Dup2', 'Dup2')

    const readTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (
      this: FileReader
    ) {
      Promise.resolve().then(() => {
        Object.defineProperty(this, 'result', {
          configurable: true,
          get: () => JSON.stringify([{ id: 'dup2', title: 'Dup2', content: '# Dup2', savedAt: 1 }]),
        })
        this.dispatchEvent(new ProgressEvent('load'))
      })
    })

    render(<HistorySidebar {...baseProps} history={[existing]} onImportSuccess={onImportSuccess} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['[]'], 'h.json')] } })

    await vi.waitFor(() => {
      expect(onImportSuccess).toHaveBeenCalledWith(0)
    })

    readTextSpy.mockRestore()
  })
})

// ── ti() aria-label interpolation ─────────────────────────────────────────────

describe('HistorySidebar — ti() aria-label interpolation', () => {
  const entries = [makeEntry('1', '# Alpha', 'Alpha')]

  it('interpolates entry title into deleteEntryLabel aria-label', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.getByRole('button', { name: 'Delete "Alpha" from history' })).toBeInTheDocument()
  })

  it('interpolates entry title into renameEntryAction aria-label', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.getByRole('button', { name: 'Rename "Alpha"' })).toBeInTheDocument()
  })

  it('interpolates entry title into selectEntryLabel aria-label in select mode', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    expect(screen.getByLabelText('Select "Alpha"')).toBeInTheDocument()
  })
})

// ── Rename flow ──────────────────────────────────────────────────────────────

describe('HistorySidebar — rename flow', () => {
  const onRenameEntry = vi.fn()
  const entries = [makeEntry('1', '# Alpha', 'Alpha'), makeEntry('2', '## Beta', 'Beta')]

  beforeEach(() => {
    onRenameEntry.mockClear()
  })

  it('clicking the rename button shows the rename input', () => {
    render(<HistorySidebar {...baseProps} history={entries} onRenameEntry={onRenameEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rename "Alpha"' }))
    expect(screen.getByRole('textbox', { name: /rename entry/i })).toBeInTheDocument()
  })

  it('rename input has the current title pre-filled', () => {
    render(<HistorySidebar {...baseProps} history={entries} onRenameEntry={onRenameEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rename "Alpha"' }))
    const input = screen.getByRole('textbox', { name: /rename entry/i }) as HTMLInputElement
    expect(input.value).toBe('Alpha')
  })

  it('onChange updates the rename input value', () => {
    render(<HistorySidebar {...baseProps} history={entries} onRenameEntry={onRenameEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rename "Alpha"' }))
    const input = screen.getByRole('textbox', { name: /rename entry/i })
    fireEvent.change(input, { target: { value: 'Alpha Renamed' } })
    expect((input as HTMLInputElement).value).toBe('Alpha Renamed')
  })

  it('pressing Enter commits the rename', () => {
    render(<HistorySidebar {...baseProps} history={entries} onRenameEntry={onRenameEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rename "Alpha"' }))
    const input = screen.getByRole('textbox', { name: /rename entry/i })
    fireEvent.change(input, { target: { value: 'New Name' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onRenameEntry).toHaveBeenCalledWith('1', 'New Name')
    // Input disappears after commit
    expect(screen.queryByRole('textbox', { name: /rename entry/i })).not.toBeInTheDocument()
  })

  it('pressing Escape cancels the rename without calling onRenameEntry', () => {
    render(<HistorySidebar {...baseProps} history={entries} onRenameEntry={onRenameEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rename "Alpha"' }))
    const input = screen.getByRole('textbox', { name: /rename entry/i })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onRenameEntry).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: /rename entry/i })).not.toBeInTheDocument()
  })

  it('blurring the rename input commits the rename', () => {
    render(<HistorySidebar {...baseProps} history={entries} onRenameEntry={onRenameEntry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rename "Alpha"' }))
    const input = screen.getByRole('textbox', { name: /rename entry/i })
    fireEvent.change(input, { target: { value: 'Blur Commit' } })
    fireEvent.blur(input)
    expect(onRenameEntry).toHaveBeenCalledWith('1', 'Blur Commit')
  })
})

// ── Search / filter ───────────────────────────────────────────────────────────

describe('HistorySidebar — search', () => {
  const entries = [
    makeEntry('1', '# Alpha doc', 'Alpha doc'),
    makeEntry('2', '## Beta page', 'Beta page'),
  ]

  it('shows all entries when query is empty', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.getByText('Alpha doc')).toBeInTheDocument()
    expect(screen.getByText('Beta page')).toBeInTheDocument()
  })

  it('filters entries by title when a query is typed', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    const input = screen.getByRole('textbox', { name: /search history/i })
    fireEvent.change(input, { target: { value: 'alpha' } })
    expect(screen.getByText('Alpha doc')).toBeInTheDocument()
    expect(screen.queryByText('Beta page')).not.toBeInTheDocument()
  })

  it('shows "no match" message when search matches nothing', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    const input = screen.getByRole('textbox', { name: /search history/i })
    fireEvent.change(input, { target: { value: 'zzznomatch' } })
    expect(screen.getByText(/zzznomatch/)).toBeInTheDocument()
  })

  it('clears the search when the clear button is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    const input = screen.getByRole('textbox', { name: /search history/i })
    fireEvent.change(input, { target: { value: 'alpha' } })
    expect(screen.queryByText('Beta page')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }))
    expect(screen.getByText('Beta page')).toBeInTheDocument()
  })
})

// ── Diff button ───────────────────────────────────────────────────────────────

describe('HistorySidebar — diff button', () => {
  const entryContent = '# Old doc\n\nSome content.'
  const entries = [makeEntry('1', entryContent, 'Old doc')]

  it('shows the diff button when currentMarkdown differs from the entry', () => {
    render(<HistorySidebar {...baseProps} history={entries} currentMarkdown="# New doc" />)
    expect(screen.getByRole('button', { name: /^diff$/i })).toBeInTheDocument()
  })

  it('does not show the diff button when currentMarkdown matches the entry', () => {
    render(<HistorySidebar {...baseProps} history={entries} currentMarkdown={entryContent} />)
    expect(screen.queryByRole('button', { name: /^diff$/i })).not.toBeInTheDocument()
  })

  it('does not show the diff button when currentMarkdown is undefined', () => {
    render(<HistorySidebar {...baseProps} history={entries} />)
    expect(screen.queryByRole('button', { name: /^diff$/i })).not.toBeInTheDocument()
  })

  it('opens the diff modal when the diff button is clicked', () => {
    render(<HistorySidebar {...baseProps} history={entries} currentMarkdown="# New doc" />)
    fireEvent.click(screen.getByRole('button', { name: /^diff$/i }))
    expect(screen.getByText(/compare with current document/i)).toBeInTheDocument()
  })

  it('closes the diff modal when the close button inside it is clicked', () => {
    vi.useFakeTimers()
    render(<HistorySidebar {...baseProps} history={entries} currentMarkdown="# New doc" />)
    fireEvent.click(screen.getByRole('button', { name: /^diff$/i }))
    expect(screen.getByText(/compare with current document/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
    act(() => vi.runAllTimers())
    expect(screen.queryByText(/compare with current document/i)).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})

// ── Axe accessibility ─────────────────────────────────────────────────────────
describe('HistorySidebar — axe accessibility', () => {
  it('has no WCAG violations in the empty state', async () => {
    const { container } = render(<HistorySidebar {...baseProps} />)
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    })
    const summary = results.violations.map((v) => `  [${v.id}] ${v.help}`).join('\n')
    expect(results.violations, `WCAG violations:\n${summary}`).toHaveLength(0)
  })

  it('has no WCAG violations when entries are present', async () => {
    const entries = [
      makeEntry('1', '# Doc One', 'Doc One'),
      makeEntry('2', '## Doc Two', 'Doc Two'),
    ]
    const { container } = render(<HistorySidebar {...baseProps} history={entries} />)
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    })
    const summary = results.violations.map((v) => `  [${v.id}] ${v.help}`).join('\n')
    expect(results.violations, `WCAG violations:\n${summary}`).toHaveLength(0)
  })

  it('has no WCAG violations in select mode', async () => {
    const entries = [
      makeEntry('1', '# Doc One', 'Doc One'),
      makeEntry('2', '## Doc Two', 'Doc Two'),
    ]
    const { container } = render(<HistorySidebar {...baseProps} history={entries} />)
    fireEvent.click(screen.getByRole('button', { name: /enter bulk selection mode/i }))
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    })
    const summary = results.violations.map((v) => `  [${v.id}] ${v.help}`).join('\n')
    expect(results.violations, `WCAG violations:\n${summary}`).toHaveLength(0)
  })
})
