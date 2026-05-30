import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { ToastProvider } from '../src/context/ToastContext.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'
import { JiraOutput } from '../src/components/JiraOutput.js'
import { useTiptapEditor } from '../src/hooks/useTiptapEditor.js'
import { wikiToMarkdown } from '../src/utils/wiki-to-markdown.js'

// Mock useTiptapEditor to prevent TipTap initialization in jsdom and keep
// tests focused on JiraOutput's own behavior (error banner, warning toasts).
vi.mock('../src/hooks/useTiptapEditor.js', () => ({
  useTiptapEditor: vi.fn(),
}))

// Mock useJiraCopy to avoid clipboard API in unit tests.
vi.mock('../src/hooks/useJiraCopy.js', () => ({
  useJiraCopy: vi.fn(() => ({ copied: false, handleCopy: vi.fn() })),
}))

vi.mock('../src/utils/wiki-to-markdown.js', () => ({
  wikiToMarkdown: vi.fn((s: string) => `md:${s}`),
}))

const stubEditorState = {
  editor: null,
  activeBlock: 'p',
  activeFormats: new Set<string>(),
  activeColor: undefined,
  isInTable: false,
  hasLossyMarks: false,
  exec: vi.fn(),
  insertHtml: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useTiptapEditor).mockReturnValue(stubEditorState)
})

function renderWithToast(ui: ReactNode) {
  return render(createElement(SettingsProvider, null, createElement(ToastProvider, null, ui)))
}

const baseProps = {
  value: '* item',
  format: 'adf' as const,
  onFormatChange: vi.fn(),
  previewHtml: '<ul><li>item</li></ul>',
}

// ── No duplicate worker-error alert ──────────────────────────────────────────
// Worker errors are surfaced by App.tsx's top-level banner.
// JiraOutput must not render its own redundant role="alert" so screen readers
// announce the error only once (WCAG 4.1.3 Status Messages).

describe('JiraOutput — no duplicate worker-error alert', () => {
  it('renders without any role="alert" element in normal operation', () => {
    renderWithToast(createElement(JiraOutput, baseProps))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders without any role="alert" element when isPending is true', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, isPending: true }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders without any role="alert" element in wiki format', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, format: 'wiki' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ── onUnderlineWarning toast wiring ──────────────────────────────────────────

describe('JiraOutput — onUnderlineWarning toast', () => {
  it('fires a warning toast containing "Underline" when onUnderlineWarning callback is called', () => {
    let capturedWarning: (() => void) | undefined
    vi.mocked(useTiptapEditor).mockImplementation((opts) => {
      capturedWarning = opts.onUnderlineWarning
      return stubEditorState
    })

    renderWithToast(createElement(JiraOutput, { ...baseProps, onMarkdownChange: vi.fn() }))

    act(() => {
      capturedWarning?.()
    })

    expect(screen.getByText(/underline formatting is not supported/i)).toBeInTheDocument()
  })

  it('passes onUnderlineWarning as a function to useTiptapEditor', () => {
    let capturedWarning: unknown
    vi.mocked(useTiptapEditor).mockImplementation((opts) => {
      capturedWarning = opts.onUnderlineWarning
      return stubEditorState
    })

    renderWithToast(createElement(JiraOutput, { ...baseProps, onMarkdownChange: vi.fn() }))

    expect(typeof capturedWarning).toBe('function')
  })
})

// ── Wiki edit desync warning ──────────────────────────────────────────────────

describe('JiraOutput — wiki edit desync warning', () => {
  it('shows a warning toast when entering wiki edit mode', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, format: 'wiki', previewHtml: '' }))
    // In wiki mode canEdit=true, so the Edit button is rendered.
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByText(/wiki markup edits are independent/i)).toBeInTheDocument()
  })

  it('does not show the desync toast when switching back to view mode', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, format: 'wiki', previewHtml: '' }))
    // Enter edit mode (toast fires)
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    // Exit edit mode (no second toast)
    fireEvent.click(screen.getByRole('button', { name: 'View' }))
    // Still only one toast visible (the first one)
    expect(screen.getAllByText(/wiki markup edits are independent/i)).toHaveLength(1)
  })
})

// ── JiraOutputHeader view mode ────────────────────────────────────────────────

describe('JiraOutput — view mode toggle (ADF)', () => {
  it('clicking Preview after Code returns to preview mode', () => {
    renderWithToast(createElement(JiraOutput, baseProps))
    // Switch to Code view
    const viewModeGroup = screen.getByRole('radiogroup', { name: /view mode/i })
    fireEvent.click(within(viewModeGroup).getByRole('radio', { name: 'Code' }))
    expect(within(viewModeGroup).getByRole('radio', { name: 'Code' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    // Switch back to Preview
    fireEvent.click(within(viewModeGroup).getByRole('radio', { name: 'Preview' }))
    expect(within(viewModeGroup).getByRole('radio', { name: 'Preview' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })
})

// ── Wiki Sync to Markdown ─────────────────────────────────────────────────────

describe('JiraOutput — Wiki Sync to Markdown', () => {
  const wikiProps = {
    value: 'h1. Hello',
    format: 'wiki' as const,
    onFormatChange: vi.fn(),
    previewHtml: '',
  }

  beforeEach(() => {
    vi.mocked(useTiptapEditor).mockReturnValue(stubEditorState)
    vi.mocked(wikiToMarkdown).mockImplementation((s: string) => `md:${s}`)
  })

  it('sync button is not visible when not in edit mode', () => {
    renderWithToast(createElement(JiraOutput, { ...wikiProps, onMarkdownChange: vi.fn() }))
    expect(screen.queryByRole('button', { name: /sync to markdown/i })).not.toBeInTheDocument()
  })

  it('sync button is not visible when onMarkdownChange is not provided', () => {
    renderWithToast(createElement(JiraOutput, wikiProps))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.queryByRole('button', { name: /sync to markdown/i })).not.toBeInTheDocument()
  })

  it('sync button is visible in wiki edit mode when onMarkdownChange is provided', () => {
    renderWithToast(createElement(JiraOutput, { ...wikiProps, onMarkdownChange: vi.fn() }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('button', { name: /sync to markdown/i })).toBeInTheDocument()
  })

  it('clicking sync calls onMarkdownChange with wikiToMarkdown result and shows success toast', () => {
    vi.mocked(wikiToMarkdown).mockReturnValue('# Hello')
    const onMarkdownChange = vi.fn()
    renderWithToast(createElement(JiraOutput, { ...wikiProps, onMarkdownChange }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: /sync to markdown/i }))
    expect(onMarkdownChange).toHaveBeenCalledWith('# Hello')
    expect(screen.getByText(/wiki markup synced/i)).toBeInTheDocument()
  })
})
