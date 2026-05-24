import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { MarkdownInput } from '../src/components/MarkdownInput.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'
import { ToastProvider } from '../src/context/ToastContext.js'

// CodeMirror wraps browser APIs unavailable in jsdom — mock the hook.
vi.mock('../src/hooks/useCodeMirrorEditor.js', () => ({
  useCodeMirrorEditor: vi.fn(() => ({
    undo: vi.fn(),
    redo: vi.fn(),
    openSearch: vi.fn(),
  })),
}))

// useFileImportExport relies on FileReader / URL.createObjectURL — mock it.
vi.mock('../src/hooks/useFileImportExport.js', () => ({
  useFileImportExport: vi.fn(() => ({
    fileInputRef: { current: null },
    handleImport: vi.fn(),
    handleFileChange: vi.fn(),
    handleExport: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    isDragging: false,
  })),
}))

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SettingsProvider, null, createElement(ToastProvider, null, children))
}

function renderInput(props: Partial<React.ComponentProps<typeof MarkdownInput>> = {}) {
  return render(<MarkdownInput value="" onChange={vi.fn()} isDark={false} {...props} />, {
    wrapper,
  })
}

afterEach(() => {
  localStorage.clear()
})

// ── Panel structure ──────────────────────────────────────────────────────────

describe('MarkdownInput — panel structure', () => {
  it('renders the Markdown panel label', () => {
    renderInput()
    expect(screen.getByText('Markdown')).toBeInTheDocument()
  })

  it('import button has correct aria-label', () => {
    renderInput()
    expect(screen.getByRole('button', { name: 'Import Markdown file' })).toBeInTheDocument()
  })

  it('export button has correct aria-label', () => {
    renderInput()
    expect(screen.getByRole('button', { name: 'Export Markdown file' })).toBeInTheDocument()
  })

  it('keyboard shortcuts button has correct aria-label', () => {
    renderInput()
    expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
  })

  it('copy markdown button has correct aria-label', () => {
    renderInput()
    expect(screen.getByRole('button', { name: 'Copy Markdown' })).toBeInTheDocument()
  })

  it('edit actions group with Undo / Redo / Find buttons is present', () => {
    renderInput()
    expect(screen.getByRole('group', { name: 'Edit actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find / Replace' })).toBeInTheDocument()
  })
})

// ── New document flow ────────────────────────────────────────────────────────

describe('MarkdownInput — new document flow', () => {
  it('New button is NOT shown when value is empty', () => {
    renderInput({ value: '' })
    expect(screen.queryByTitle('New document (clears editor)')).not.toBeInTheDocument()
  })

  it('New button is shown when value is non-empty', () => {
    renderInput({ value: '# Hello' })
    expect(screen.getByTitle('New document (clears editor)')).toBeInTheDocument()
  })

  it('clicking New shows the clear editor confirmation', () => {
    renderInput({ value: '# Hello' })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    expect(screen.getByText('Clear editor?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })

  it('clicking No dismisses the confirmation', () => {
    renderInput({ value: '# Hello' })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(screen.queryByText('Clear editor?')).not.toBeInTheDocument()
  })

  it('clicking Yes calls onChange with empty string and dismisses confirmation', () => {
    const onChange = vi.fn()
    renderInput({ value: '# Hello', onChange })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(onChange).toHaveBeenCalledWith('')
    expect(screen.queryByText('Clear editor?')).not.toBeInTheDocument()
  })

  it('clicking Yes calls onSave before clearing when onSave is provided', () => {
    const onChange = vi.fn()
    const onSave = vi.fn()
    renderInput({ value: '# Hello', onChange, onSave })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(onSave).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('')
  })
})

// ── History-dependent UI ─────────────────────────────────────────────────────

describe('MarkdownInput — history-dependent UI', () => {
  it('Save button IS shown when historyEnabled and onSave are provided', () => {
    renderInput({ historyEnabled: true, onSave: vi.fn() })
    expect(screen.getByRole('button', { name: 'Save document to history' })).toBeInTheDocument()
  })

  it('Save button is NOT shown when historyEnabled is false', () => {
    renderInput({ historyEnabled: false, onSave: vi.fn() })
    expect(
      screen.queryByRole('button', { name: 'Save document to history' })
    ).not.toBeInTheDocument()
  })
})

// ── Word count ───────────────────────────────────────────────────────────────

describe('MarkdownInput — word count', () => {
  it('shows 0 words and 0 chars for empty value', () => {
    renderInput({ value: '' })
    expect(screen.getByText(/0 words/)).toBeInTheDocument()
  })

  it('shows correct word count for non-empty value', () => {
    renderInput({ value: 'hello world foo' })
    expect(screen.getByText(/3 words/)).toBeInTheDocument()
  })
})
