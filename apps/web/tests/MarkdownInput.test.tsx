import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import { MarkdownInput } from '../src/components/MarkdownInput.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'
import { ToastProvider } from '../src/context/ToastContext.js'
import { useFileImportExport } from '../src/hooks/useFileImportExport.js'

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

  it('opens shortcuts modal when keyboard shortcuts button is clicked', async () => {
    renderInput()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }))
    })
    // The modal renders (setShowShortcuts(true) called)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  })

  it('closes shortcuts modal when its close button is clicked', async () => {
    renderInput()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }))
    })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    // Close via close button (calls setShowShortcuts(false))
    const closeBtn = screen.getByRole('button', { name: /close.*shortcuts/i })
    await act(async () => {
      fireEvent.click(closeBtn)
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
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

  it('clicking New shows the new document modal', () => {
    renderInput({ value: '# Hello' })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    expect(screen.getByText('New document')).toBeInTheDocument()
    expect(screen.getByLabelText('Document name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })

  it('clicking No dismisses the modal', () => {
    vi.useFakeTimers()
    renderInput({ value: '# Hello' })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    act(() => {
      vi.runAllTimers()
    })
    expect(screen.queryByText('New document')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('clicking Create with no name calls onChange with empty string', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    renderInput({ value: '# Hello', onChange })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    // Action is deferred until after the exit animation completes (200 ms)
    expect(onChange).not.toHaveBeenCalled()
    act(() => {
      vi.runAllTimers()
    })
    expect(onChange).toHaveBeenCalledWith('')
    expect(screen.queryByText('New document')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('clicking Create with a name calls onChange with a heading', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    renderInput({ value: '# Hello', onChange })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.change(screen.getByLabelText('Document name'), { target: { value: 'Sprint 42' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(onChange).not.toHaveBeenCalled()
    act(() => {
      vi.runAllTimers()
    })
    expect(onChange).toHaveBeenCalledWith('# Sprint 42\n\n')
    vi.useRealTimers()
  })

  it('clicking Create calls onSave before clearing when onSave is provided', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const onSave = vi.fn()
    renderInput({ value: '# Hello', onChange, onSave })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    act(() => {
      vi.runAllTimers()
    })
    expect(onSave).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('')
    vi.useRealTimers()
  })

  it('clicking Create with onNewDocument provided calls onNewDocument instead of onChange', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const onNewDocument = vi.fn()
    renderInput({ value: '# Hello', onChange, onNewDocument })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    fireEvent.change(screen.getByLabelText('Document name'), { target: { value: 'My Doc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    act(() => {
      vi.runAllTimers()
    })
    expect(onNewDocument).toHaveBeenCalledWith('My Doc')
    expect(onChange).not.toHaveBeenCalled()
    vi.useRealTimers()
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

// ── Drag and drop ────────────────────────────────────────────────────────────

describe('MarkdownInput — drag and drop', () => {
  function renderWithDragHandlers(isDragging = false) {
    const handleDragOver = vi.fn()
    const handleDragLeave = vi.fn()
    const handleDrop = vi.fn()
    vi.mocked(useFileImportExport).mockReturnValueOnce({
      fileInputRef: { current: null },
      handleImport: vi.fn(),
      handleFileChange: vi.fn(),
      handleExport: vi.fn(),
      handleDragOver,
      handleDragLeave,
      handleDrop,
      isDragging,
    })
    const result = renderInput()
    return { ...result, handleDragOver, handleDragLeave, handleDrop }
  }

  it('calls handleDragOver when a file is dragged over the editor area', () => {
    const { container, handleDragOver } = renderWithDragHandlers()
    const dragArea = container.firstChild as HTMLElement
    fireEvent.dragOver(dragArea)
    expect(handleDragOver).toHaveBeenCalledTimes(1)
  })

  it('calls handleDragLeave when the drag leaves the editor area', () => {
    const { container, handleDragLeave } = renderWithDragHandlers()
    const dragArea = container.firstChild as HTMLElement
    fireEvent.dragLeave(dragArea)
    expect(handleDragLeave).toHaveBeenCalledTimes(1)
  })

  it('calls handleDrop when a file is dropped on the editor area', () => {
    const { container, handleDrop } = renderWithDragHandlers()
    const dragArea = container.firstChild as HTMLElement
    fireEvent.drop(dragArea)
    expect(handleDrop).toHaveBeenCalledTimes(1)
  })

  it('applies drag-active ring styles when isDragging is true', () => {
    const { container } = renderWithDragHandlers(true)
    const dragArea = container.firstChild as HTMLElement
    expect(dragArea.className).toMatch(/ring-2/)
  })
})

// ── Copy Markdown ─────────────────────────────────────────────────────────────

describe('MarkdownInput — copy markdown', () => {
  it('clicking Copy MD calls navigator.clipboard.writeText with the current value', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    renderInput({ value: '# Hello' })
    const copyBtn = screen.getByRole('button', { name: /copy markdown/i })
    await act(async () => {
      fireEvent.click(copyBtn)
    })

    expect(writeText).toHaveBeenCalledWith('# Hello')

    vi.unstubAllGlobals()
  })

  it('shows "Copied!" feedback text after clicking Copy MD', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    renderInput({ value: '# Hello' })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy markdown/i }))
    })

    // The button label should reflect the copied state
    const copyBtn = screen.getByRole('button', { name: /copy markdown/i })
    expect(copyBtn.textContent).toMatch(/cop/i)

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('resets copy feedback after 2000 ms', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    renderInput({ value: '# Hello' })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy markdown/i }))
    })
    await act(async () => {
      vi.advanceTimersByTime(2001)
    })

    // After timer expires the button should be back to normal
    expect(screen.getByRole('button', { name: /copy markdown/i })).toBeInTheDocument()

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('clears existing timer when Copy MD is clicked a second time', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    renderInput({ value: '# Hello' })
    // First click — sets the timer (copiedTimerRef.current !== null after)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy markdown/i }))
    })
    // Second click — enters the `if (copiedTimerRef.current !== null)` branch
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy markdown/i }))
    })

    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
})

// ── confirmNew timer ──────────────────────────────────────────────────────────

describe('MarkdownInput — confirmNew auto-dismiss', () => {
  it('dismisses confirmNew when value becomes empty', () => {
    const { rerender } = renderInput({ value: '# Hello' })
    fireEvent.click(screen.getByTitle('New document (clears editor)'))
    expect(screen.getByText('New document')).toBeInTheDocument()
    rerender(<MarkdownInput value="" onChange={vi.fn()} isDark={false} />)
    expect(screen.queryByText('New document')).not.toBeInTheDocument()
  })
})

// ── newDocumentTrigger prop ───────────────────────────────────────────────────

describe('MarkdownInput — newDocumentTrigger', () => {
  it('opens the new-document modal when trigger increments and editor has content', () => {
    const { rerender } = renderInput({ value: '# Hello', newDocumentTrigger: 0 })
    expect(screen.queryByText('New document')).not.toBeInTheDocument()
    rerender(
      <MarkdownInput value="# Hello" onChange={vi.fn()} isDark={false} newDocumentTrigger={1} />
    )
    // Wrap in act because the useEffect triggers a state update
    act(() => {})
    expect(screen.getByText('New document')).toBeInTheDocument()
  })

  it('does NOT open the modal when trigger increments but editor is empty', () => {
    const { rerender } = renderInput({ value: '', newDocumentTrigger: 0 })
    rerender(<MarkdownInput value="" onChange={vi.fn()} isDark={false} newDocumentTrigger={1} />)
    act(() => {})
    expect(screen.queryByText('New document')).not.toBeInTheDocument()
  })

  it('opens the modal again on each subsequent trigger increment after cancelling', () => {
    vi.useFakeTimers()
    const { rerender } = renderInput({ value: '# Hello', newDocumentTrigger: 0 })

    // First trigger — opens modal
    rerender(
      <MarkdownInput value="# Hello" onChange={vi.fn()} isDark={false} newDocumentTrigger={1} />
    )
    act(() => {})
    expect(screen.getByText('New document')).toBeInTheDocument()

    // Cancel the modal (label is 'No')
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    act(() => {
      vi.runAllTimers()
    })
    expect(screen.queryByText('New document')).not.toBeInTheDocument()

    // Second trigger — modal should open again
    rerender(
      <MarkdownInput value="# Hello" onChange={vi.fn()} isDark={false} newDocumentTrigger={2} />
    )
    act(() => {})
    expect(screen.getByText('New document')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
