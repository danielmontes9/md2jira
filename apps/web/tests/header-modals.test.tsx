import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../src/components/Header.js'
import { ShortcutsModal } from '../src/components/ShortcutsModal.js'
import { InfoModal } from '../src/components/InfoModal.js'
import { ShareModal } from '../src/components/Modal.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'

function renderWithSettings(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>)
}

const LS_KEY = 'md2jira-settings'

function renderWithLocale(ui: React.ReactElement, locale: 'en' | 'es' | 'pt' | 'fr') {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale })
  )
  return render(<SettingsProvider>{ui}</SettingsProvider>)
}

afterEach(() => {
  localStorage.clear()
})

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
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('Header', () => {
  it('renders the page title', () => {
    renderWithSettings(<Header />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('md2jira-previewer')
  })

  it('has a settings button', () => {
    renderWithSettings(<Header />)
    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument()
  })

  it('calls onOpenSettings when settings button is clicked', () => {
    const onOpen = vi.fn()
    renderWithSettings(<Header onOpenSettings={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('has a share/export button that is disabled when no content', () => {
    renderWithSettings(<Header hasContent={false} />)
    expect(screen.getByRole('button', { name: /share or export/i })).toBeDisabled()
  })

  it('GitHub link opens in new tab with rel noopener', () => {
    renderWithSettings(<Header />)
    const link = screen.getByRole('link', { name: /view project on github/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('opens the export dropdown when Share/Export button is clicked with hasContent=true', () => {
    renderWithSettings(<Header hasContent={true} isDeepLinkActive={false} />)
    const btn = screen.getByRole('button', { name: /share or export/i })
    fireEvent.click(btn)
    expect(screen.getByText('Export PDF')).toBeInTheDocument()
  })

  it('clicking Share Link opens the ShareModal', () => {
    renderWithSettings(<Header hasContent={true} isDeepLinkActive={true} />)
    fireEvent.click(screen.getByRole('button', { name: /share or export/i }))
    fireEvent.click(screen.getByText('Share link'))
    // ShareModal should now be visible
    expect(screen.getByRole('heading', { name: /share document/i })).toBeInTheDocument()
  })

  it('onToggleHistory is called when History button is clicked', () => {
    const onToggle = vi.fn()
    renderWithSettings(<Header onToggleHistory={onToggle} historyEnabled={true} />)
    fireEvent.click(screen.getByRole('button', { name: /document history/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})

describe('InfoModal', () => {
  it('renders with accessible title', () => {
    renderWithSettings(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByText('md2jira')).toBeInTheDocument()
  })

  it('has a close button', () => {
    renderWithSettings(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    renderWithSettings(<InfoModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ShortcutsModal', () => {
  it('renders the title', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
  })

  it('displays shortcut groups', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Formatting')).toBeInTheDocument()
    expect(screen.getByText('Structure')).toBeInTheDocument()
    expect(screen.getByText('Lines')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
  })

  it('has a close button', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    renderWithSettings(<ShortcutsModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows individual shortcuts', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    // 'Bold' and 'Italic' appear in both the Formatting and WYSIWYG groups
    expect(screen.getAllByText('Bold').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Italic').length).toBeGreaterThan(0)
    expect(screen.getByText('Move line up')).toBeInTheDocument()
  })

  it('displays the Output format group with format-switch shortcuts', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Output format')).toBeInTheDocument()
    expect(screen.getByText('Switch to Jira Cloud (ADF)')).toBeInTheDocument()
    expect(screen.getByText('Switch to Wiki Markup')).toBeInTheDocument()
  })

  it('shows Formatting-group shortcut labels', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Insert link')).toBeInTheDocument()
    // 'Inline code' and 'Strikethrough' appear in both Formatting and WYSIWYG groups
    expect(screen.getAllByText('Inline code').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Strikethrough').length).toBeGreaterThan(0)
  })

  it('displays the WYSIWYG editor group with edit-mode-only shortcuts', () => {
    renderWithSettings(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('WYSIWYG editor (Edit mode only)')).toBeInTheDocument()
    // Shortcuts exclusive to the WYSIWYG group (not present in any other group)
    expect(screen.getByText('Underline')).toBeInTheDocument()
    expect(screen.getByText('Undo')).toBeInTheDocument()
    expect(screen.getByText('Redo')).toBeInTheDocument()
    expect(screen.getByText('Ordered list')).toBeInTheDocument()
    expect(screen.getByText('Bullet list')).toBeInTheDocument()
  })
})

describe('InfoModal — content', () => {
  it('renders the Open-source subtitle', () => {
    renderWithSettings(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByText(/open-source markdown.*jira converter/i)).toBeInTheDocument()
  })

  it('describes Jira Wiki Markup and ADF in the body', () => {
    renderWithSettings(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByText(/Jira Wiki Markup/)).toBeInTheDocument()
    expect(screen.getByText(/Atlassian Document Format/)).toBeInTheDocument()
  })

  it('lists the md2jira-core package', () => {
    renderWithSettings(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByText('md2jira-core')).toBeInTheDocument()
  })

  it('lists the md2jira-cli package', () => {
    renderWithSettings(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByText('md2jira-cli')).toBeInTheDocument()
  })
})

describe('ShortcutsModal — i18n', () => {
  it('renders shortcut labels in Spanish', () => {
    renderWithLocale(<ShortcutsModal onClose={vi.fn()} />, 'es')
    // scLabelBold in es = 'Negrita'
    expect(screen.getAllByText('Negrita').length).toBeGreaterThan(0)
  })

  it('renders shortcut group headings in French', () => {
    renderWithLocale(<ShortcutsModal onClose={vi.fn()} />, 'fr')
    // scLabelItalic in fr should differ from en
    expect(screen.queryByText('Bold')).toBeNull()
  })
})

describe('ShareModal — i18n', () => {
  it('renders the share title in Spanish', () => {
    renderWithLocale(<ShareModal url="https://example.com" onClose={vi.fn()} />, 'es')
    // shareDocumentTitle in es = 'Compartir documento'
    expect(screen.getByRole('heading', { name: /compartir documento/i })).toBeInTheDocument()
  })

  it('renders the copy link button in Spanish', () => {
    renderWithLocale(<ShareModal url="https://example.com" onClose={vi.fn()} />, 'es')
    // copyLinkToShare in es = 'Copiar enlace para compartir'
    expect(screen.getByRole('button', { name: /copiar enlace/i })).toBeInTheDocument()
  })
})
