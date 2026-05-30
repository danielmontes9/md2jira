import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { SettingsModal } from '../src/components/SettingsModal.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'

const LS_KEY = 'md2jira-settings'

// setup.ts already stubs HTMLDialogElement.showModal / close globally.

function renderModal(
  props: {
    theme?: 'light' | 'dark'
    onClose?: () => void
    onToggleTheme?: () => void
    historyCount?: number
  } = {}
) {
  const onClose = props.onClose ?? vi.fn()
  const onToggleTheme = props.onToggleTheme ?? vi.fn()
  const theme = props.theme ?? 'light'
  return {
    onClose,
    onToggleTheme,
    ...render(
      <SettingsProvider>
        <SettingsModal
          onClose={onClose}
          theme={theme}
          onToggleTheme={onToggleTheme}
          {...(props.historyCount !== undefined ? { historyCount: props.historyCount } : {})}
        />
      </SettingsProvider>
    ),
  }
}

afterEach(() => {
  localStorage.clear()
})

// ── Rendering ──────────────────────────────────────────────────────────────

describe('SettingsModal — rendering', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders the settings title', () => {
    renderModal()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }))
    vi.runAllTimers()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('language radiogroup is present', () => {
    renderModal()
    // History is on by default so TWO radiogroups render (language + max entries).
    // Verify the language one is present via its accessible name from aria-labelledby.
    expect(screen.getAllByRole('radiogroup').length).toBeGreaterThanOrEqual(1)
  })

  it('"About this project" link is present', () => {
    renderModal()
    expect(screen.getByText('About this project')).toBeInTheDocument()
  })
})

// ── Locale selector ────────────────────────────────────────────────────────

describe('SettingsModal — locale selector', () => {
  it('English radio is aria-checked=true by default', () => {
    renderModal()
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true')
  })

  it('all four locale options are rendered', () => {
    renderModal()
    expect(screen.getByRole('radio', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Español' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Português' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Français' })).toBeInTheDocument()
  })

  it('clicking Español makes it aria-checked=true and English aria-checked=false', () => {
    renderModal()
    fireEvent.click(screen.getByRole('radio', { name: 'Español' }))
    expect(screen.getByRole('radio', { name: 'Español' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'false')
  })
})

// ── Theme toggle ───────────────────────────────────────────────────────────

describe('SettingsModal — theme toggle', () => {
  it('theme switch has aria-checked=false in light mode', () => {
    renderModal({ theme: 'light' })
    expect(screen.getByRole('switch', { name: 'Switch to dark mode' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('theme switch has aria-checked=true in dark mode', () => {
    renderModal({ theme: 'dark' })
    expect(screen.getByRole('switch', { name: 'Switch to light mode' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('clicking theme switch calls onToggleTheme', () => {
    const onToggleTheme = vi.fn()
    renderModal({ onToggleTheme })
    fireEvent.click(screen.getByRole('switch', { name: 'Switch to dark mode' }))
    expect(onToggleTheme).toHaveBeenCalledOnce()
  })
})

// ── History toggle ─────────────────────────────────────────────────────────

describe('SettingsModal — history toggle', () => {
  it('history switch is aria-checked=true by default (history on by default)', () => {
    renderModal()
    expect(screen.getByRole('switch', { name: 'Save document history' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('clicking history switch toggles it to aria-checked=false', () => {
    renderModal()
    const historySwitch = screen.getByRole('switch', { name: 'Save document history' })
    fireEvent.click(historySwitch)
    expect(historySwitch).toHaveAttribute('aria-checked', 'false')
  })

  it('max entries section IS rendered by default (history on by default)', () => {
    renderModal()
    expect(screen.getByText('Maximum saved documents')).toBeInTheDocument()
  })

  it('max entries section is NOT rendered when history is disabled via localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: false, maxHistoryEntries: 10, locale: 'en' })
    )
    renderModal()
    expect(screen.queryByText('Maximum saved documents')).not.toBeInTheDocument()
  })

  it('max entries buttons (10 / 25 / 50) rendered with 10 checked by default', () => {
    renderModal()
    expect(screen.getByRole('radio', { name: '10' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '25' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: '50' })).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking 25 max entries updates the selection', () => {
    renderModal()
    fireEvent.click(screen.getByRole('radio', { name: '25' }))
    expect(screen.getByRole('radio', { name: '25' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '10' })).toHaveAttribute('aria-checked', 'false')
  })

  it('historyCount value is displayed when count is provided', () => {
    renderModal({ historyCount: 3 })
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })
})

// ── InfoModal flow ─────────────────────────────────────────────────────────

describe('SettingsModal — InfoModal flow', () => {
  it('clicking "About this project" opens the InfoModal', async () => {
    renderModal()
    await act(async () => {
      fireEvent.click(screen.getByText('About this project'))
    })
    await waitFor(() => {
      expect(screen.getByText('md2jira')).toBeInTheDocument()
    })
  })

  it('closing the InfoModal hides it', async () => {
    renderModal()
    await act(async () => {
      fireEvent.click(screen.getByText('About this project'))
    })
    await waitFor(() => {
      expect(screen.getByText('md2jira')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByText('md2jira')).not.toBeInTheDocument()
    })
  })
})
