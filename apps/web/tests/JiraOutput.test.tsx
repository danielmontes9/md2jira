import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { ToastProvider } from '../src/context/ToastContext.js'
import { JiraOutput } from '../src/components/JiraOutput.js'
import { useTiptapEditor } from '../src/hooks/useTiptapEditor.js'

// Mock useTiptapEditor to prevent TipTap initialization in jsdom and keep
// tests focused on JiraOutput's own behavior (error banner, warning toasts).
vi.mock('../src/hooks/useTiptapEditor.js', () => ({
  useTiptapEditor: vi.fn(),
}))

// Mock useJiraCopy to avoid clipboard API in unit tests.
vi.mock('../src/hooks/useJiraCopy.js', () => ({
  useJiraCopy: vi.fn(() => ({ copied: false, handleCopy: vi.fn() })),
}))

const stubEditorState = {
  editor: null,
  activeBlock: 'p',
  activeFormats: new Set<string>(),
  activeColor: undefined,
  exec: vi.fn(),
  insertHtml: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useTiptapEditor).mockReturnValue(stubEditorState)
})

function renderWithToast(ui: ReactNode) {
  return render(createElement(ToastProvider, null, ui))
}

const baseProps = {
  value: '* item',
  format: 'adf' as const,
  onFormatChange: vi.fn(),
  previewHtml: '<ul><li>item</li></ul>',
}

// ── Worker error banner ───────────────────────────────────────────────────────

describe('JiraOutput — worker error banner', () => {
  it('does not show error banner when workerError is absent', () => {
    renderWithToast(createElement(JiraOutput, baseProps))
    expect(screen.queryByText('Preview rendering failed.')).not.toBeInTheDocument()
  })

  it('does not show error banner when workerError=false', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, workerError: false }))
    expect(screen.queryByText('Preview rendering failed.')).not.toBeInTheDocument()
  })

  it('shows role="alert" banner when workerError=true', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, workerError: true }))
    const alerts = screen.getAllByRole('alert')
    const banner = alerts.find((el) => el.textContent?.includes('Preview rendering failed.'))
    expect(banner).toBeDefined()
  })

  it('banner text contains "Preview rendering failed."', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, workerError: true }))
    expect(screen.getByText('Preview rendering failed.')).toBeInTheDocument()
  })

  it('shows Retry button when retryWorker is provided alongside workerError', () => {
    const retryWorker = vi.fn()
    renderWithToast(
      createElement(JiraOutput, { ...baseProps, workerError: true, retryWorker })
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('calls retryWorker when Retry button is clicked', () => {
    const retryWorker = vi.fn()
    renderWithToast(
      createElement(JiraOutput, { ...baseProps, workerError: true, retryWorker })
    )
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(retryWorker).toHaveBeenCalledOnce()
  })

  it('does not show Retry button when retryWorker is absent', () => {
    renderWithToast(createElement(JiraOutput, { ...baseProps, workerError: true }))
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
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

    renderWithToast(
      createElement(JiraOutput, { ...baseProps, onMarkdownChange: vi.fn() })
    )

    act(() => {
      capturedWarning?.()
    })

    expect(
      screen.getByText(/underline formatting is not supported/i)
    ).toBeInTheDocument()
  })

  it('passes onUnderlineWarning as a function to useTiptapEditor', () => {
    let capturedWarning: unknown
    vi.mocked(useTiptapEditor).mockImplementation((opts) => {
      capturedWarning = opts.onUnderlineWarning
      return stubEditorState
    })

    renderWithToast(
      createElement(JiraOutput, { ...baseProps, onMarkdownChange: vi.fn() })
    )

    expect(typeof capturedWarning).toBe('function')
  })
})
