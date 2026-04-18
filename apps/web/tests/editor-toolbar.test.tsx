import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditorToolbar } from '../src/components/jira-output/EditorToolbar.js'

// Minimal matchMedia stub required by toolbar internals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockReturnValue({ matches: false }),
})

describe('EditorToolbar', () => {
  let execMock: ReturnType<typeof vi.fn>
  let insertHtmlMock: ReturnType<typeof vi.fn>
  let saveRangeMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    execMock = vi.fn()
    insertHtmlMock = vi.fn()
    saveRangeMock = vi.fn()
    // document.execCommand is not implemented in jsdom; mock it so toolbar
    // internals (saveRange, restoreRange) don't throw.
    document.execCommand = vi.fn().mockReturnValue(false)
  })

  function renderToolbar(activeFormats: Set<string> = new Set(), activeBlock = 'p') {
    return render(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        saveRange={saveRangeMock}
        activeBlock={activeBlock}
        activeFormats={activeFormats}
      />
    )
  }

  it('renders with role="toolbar" and accessible label', () => {
    renderToolbar()
    expect(screen.getByRole('toolbar', { name: 'Text formatting' })).toBeInTheDocument()
  })

  it('calls exec("undo") when Undo button is pressed', () => {
    renderToolbar()
    const undoBtn = screen.getByTitle(/undo/i)
    fireEvent.mouseDown(undoBtn)
    expect(execMock).toHaveBeenCalledWith('undo')
  })

  it('calls exec("redo") when Redo button is pressed', () => {
    renderToolbar()
    const redoBtn = screen.getByTitle(/redo/i)
    fireEvent.mouseDown(redoBtn)
    expect(execMock).toHaveBeenCalledWith('redo')
  })

  it('calls insertHtml with a code block when Code Snippet button is pressed', () => {
    renderToolbar()
    const codeBtn = screen.getByTitle('Code snippet')
    fireEvent.mouseDown(codeBtn)
    expect(insertHtmlMock).toHaveBeenCalledWith(expect.stringContaining('<pre><code>'))
  })

  it('Image button is aria-disabled', () => {
    renderToolbar()
    const imageBtn = screen.getByTitle(/add image/i)
    expect(imageBtn).toHaveAttribute('aria-disabled', 'true')
  })

  it('TextStyleMenu trigger has aria-haspopup="menu"', () => {
    renderToolbar()
    const ttBtn = screen.getByText('Tt').closest('button')
    expect(ttBtn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('TextStyleMenu opens on mousedown and shows heading options', () => {
    renderToolbar()
    const ttBtn = screen.getByText('Tt').closest('button')!
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
    fireEvent.mouseDown(ttBtn)
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    expect(screen.getByText('Heading 2')).toBeInTheDocument()
    expect(screen.getByText('Normal text')).toBeInTheDocument()
  })

  it('TextStyleMenu calls exec("formatBlock", "H1") when Heading 1 is selected', () => {
    renderToolbar()
    const ttBtn = screen.getByText('Tt').closest('button')!
    fireEvent.mouseDown(ttBtn)
    const h1Option = screen.getByText('Heading 1')
    fireEvent.mouseDown(h1Option)
    expect(execMock).toHaveBeenCalledWith('formatBlock', 'H1')
  })

  it('FormatMenu trigger has aria-haspopup="menu"', () => {
    renderToolbar()
    const bBtn = screen.getByTitle('Format text').closest('button')
    expect(bBtn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('FormatMenu opens on mousedown and shows Bold and Italic options', () => {
    renderToolbar()
    const bBtn = screen.getByTitle('Format text').closest('button')!
    expect(screen.queryByText('Bold')).not.toBeInTheDocument()
    fireEvent.mouseDown(bBtn)
    expect(screen.getByText('Bold')).toBeInTheDocument()
    expect(screen.getByText('Italic')).toBeInTheDocument()
  })

  it('FormatMenu calls exec("bold") when Bold is selected', () => {
    renderToolbar()
    const bBtn = screen.getByTitle('Format text').closest('button')!
    fireEvent.mouseDown(bBtn)
    const boldItem = screen.getByText('Bold')
    fireEvent.mouseDown(boldItem)
    expect(execMock).toHaveBeenCalledWith('bold')
  })

  it('renders multiple menu triggers with aria-haspopup="menu"', () => {
    renderToolbar()
    const menuTriggers = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-haspopup') === 'menu')
    // At minimum: TextStyleMenu + FormatMenu + ListsMenu
    expect(menuTriggers.length).toBeGreaterThanOrEqual(3)
  })
})
