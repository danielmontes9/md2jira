import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { EditorToolbar } from '../src/components/jira-output/EditorToolbar.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'

function renderWithSettings(ui: ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>)
}

// Use vi.stubGlobal so vitest restores originals after this file's tests run.
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

describe('EditorToolbar', () => {
  let execMock: ReturnType<typeof vi.fn>
  let insertHtmlMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    execMock = vi.fn()
    insertHtmlMock = vi.fn()
  })

  function renderToolbar(activeFormats: Set<string> = new Set(), activeBlock = 'p') {
    return renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock={activeBlock}
        activeFormats={activeFormats}
        activeColor={undefined}
      />
    )
  }

  it('renders with role="toolbar" and accessible label', () => {
    renderToolbar()
    expect(screen.getByRole('toolbar', { name: 'Text formatting' })).toBeInTheDocument()
  })

  it('calls exec("undo") when Undo button is pressed', () => {
    renderToolbar()
    const undoBtn = screen.getByRole('button', { name: /undo/i })
    fireEvent.mouseDown(undoBtn)
    expect(execMock).toHaveBeenCalledWith('undo')
  })

  it('calls exec("redo") when Redo button is pressed', () => {
    renderToolbar()
    const redoBtn = screen.getByRole('button', { name: /redo/i })
    fireEvent.mouseDown(redoBtn)
    expect(execMock).toHaveBeenCalledWith('redo')
  })

  it('calls exec("toggleCodeBlock") when Code Snippet button is pressed', () => {
    renderToolbar()
    const codeBtn = screen.getByRole('button', { name: 'Code snippet' })
    fireEvent.mouseDown(codeBtn)
    expect(execMock).toHaveBeenCalledWith('toggleCodeBlock')
  })

  it('does not render a disabled Image button (images are out of scope)', () => {
    renderToolbar()
    expect(screen.queryByRole('button', { name: /add image/i })).not.toBeInTheDocument()
  })

  it('TextStyleMenu trigger has aria-haspopup="menu"', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    expect(ttBtn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('TextStyleMenu opens on mousedown and shows heading options', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
    fireEvent.mouseDown(ttBtn)
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    expect(screen.getByText('Heading 2')).toBeInTheDocument()
    expect(screen.getAllByText('Normal text').length).toBeGreaterThan(0)
  })

  it('TextStyleMenu calls exec("formatBlock", "H1") when Heading 1 is selected', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    const h1Option = screen.getByText('Heading 1')
    fireEvent.mouseDown(h1Option)
    expect(execMock).toHaveBeenCalledWith('formatBlock', 'H1')
  })

  it('FormatMenu trigger has aria-haspopup="menu"', () => {
    renderToolbar()
    const bBtn = screen.getByRole('button', { name: 'Format text' })
    expect(bBtn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('FormatMenu (···) opens and shows Subscript but not Bold or Italic', () => {
    renderToolbar()
    const moreBtn = screen.getByRole('button', { name: 'Format text' })
    // Bold and Italic are now individual toolbar buttons, not in this dropdown
    fireEvent.mouseDown(moreBtn)
    expect(screen.getByText('Subscript')).toBeInTheDocument()
    expect(screen.queryByText('Bold')).not.toBeInTheDocument()
    expect(screen.queryByText('Italic')).not.toBeInTheDocument()
  })

  it('Bold button calls exec("bold") on mousedown', () => {
    renderToolbar()
    const boldBtn = screen.getByRole('button', { name: /^Bold/ })
    fireEvent.mouseDown(boldBtn)
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

  it('ColorMenu trigger has aria-haspopup="listbox" (uses listbox role)', () => {
    renderToolbar()
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    expect(colorBtn).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('ColorMenu opens on mousedown and shows color swatches', () => {
    renderToolbar()
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    fireEvent.mouseDown(colorBtn)
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
  })

  it('ColorMenu calls exec("foreColor", color) when a swatch is clicked', () => {
    renderToolbar()
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    fireEvent.mouseDown(colorBtn)
    const firstSwatch = screen.getAllByRole('option')[0]!
    const color = firstSwatch.getAttribute('title') ?? ''
    fireEvent.mouseDown(firstSwatch)
    expect(execMock).toHaveBeenCalledWith('foreColor', color)
  })

  it('ColorMenu "Remove color" calls exec("foreColor") with no argument to unset color', () => {
    renderToolbar()
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    fireEvent.mouseDown(colorBtn)
    const removeBtn = screen.getByText('Remove color')
    fireEvent.mouseDown(removeBtn)
    expect(execMock).toHaveBeenCalledWith('foreColor')
  })

  it('ListsMenu Task list calls exec("toggleTaskList")', () => {
    renderToolbar()
    // Open the lists dropdown (it uses IconListBullet — find by aria-haspopup=menu near it)
    const menuTriggers = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-haspopup') === 'menu')
    // ListsMenu is the 3rd menu trigger (TextStyle, Format, Lists)
    const listsBtn = menuTriggers[2]!
    fireEvent.mouseDown(listsBtn)
    const taskBtn = screen.getByText('Task list')
    fireEvent.mouseDown(taskBtn)
    expect(execMock).toHaveBeenCalledWith('toggleTaskList')
  })

  it('EmojiMenu opens on mousedown and shows a search input', () => {
    renderToolbar()
    const emojiBtn = screen.getByRole('button', { name: 'Emoji' })
    fireEvent.mouseDown(emojiBtn)
    expect(screen.getByPlaceholderText(/Search by category/)).toBeInTheDocument()
  })

  it('EmojiMenu calls exec("insertText", emoji) when an emoji is clicked', async () => {
    renderToolbar()
    const emojiBtn = screen.getByRole('button', { name: 'Emoji' })
    fireEvent.mouseDown(emojiBtn)
    // Scope to the dialog so we don't accidentally pick the trigger button (☺)
    const dialog = screen.getByRole('dialog')
    // Emoji data loads lazily — wait until buttons appear
    const emojiButtons = await waitFor(() => {
      const btns = within(dialog)
        .getAllByRole('button')
        .filter((btn) => btn.textContent && /\p{Emoji}/u.test(btn.textContent))
      if (btns.length === 0) throw new Error('no emoji buttons yet')
      return btns
    })
    const first = emojiButtons[0]!
    const emoji = first.textContent ?? ''
    fireEvent.mouseDown(first)
    expect(execMock).toHaveBeenCalledWith('insertText', emoji)
  })

  it('InsertMenu opens on mousedown and shows Table item', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    expect(screen.getByText('Table')).toBeInTheDocument()
  })

  it('InsertMenu Table item calls exec("insertTable")', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const tableItem = screen.getByText('Table')
    fireEvent.mouseDown(tableItem)
    expect(execMock).toHaveBeenCalledWith('insertTable')
  })

  it('InsertMenu Quote item calls exec("toggleBlockquote")', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const quoteItem = screen.getByText('Quote')
    fireEvent.mouseDown(quoteItem)
    expect(execMock).toHaveBeenCalledWith('toggleBlockquote')
  })

  it('InsertMenu Divider item calls exec("insertHorizontalRule")', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const dividerItem = screen.getByText('Divider')
    fireEvent.mouseDown(dividerItem)
    expect(execMock).toHaveBeenCalledWith('insertHorizontalRule')
  })

  it('Code Snippet button has aria-pressed="true" when activeBlock is "pre"', () => {
    renderToolbar(new Set(), 'pre')
    const codeBtn = screen.getByRole('button', { name: 'Code snippet' })
    expect(codeBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('Code Snippet button has aria-pressed="false" when activeBlock is "p"', () => {
    renderToolbar(new Set(), 'p')
    const codeBtn = screen.getByRole('button', { name: 'Code snippet' })
    expect(codeBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('Bold button has aria-pressed="true" when bold is in activeFormats', () => {
    renderToolbar(new Set(['bold']))
    const boldBtn = screen.getByRole('button', { name: /^Bold/ })
    expect(boldBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('Bold button has aria-pressed="false" when bold is not in activeFormats', () => {
    renderToolbar(new Set())
    const boldBtn = screen.getByRole('button', { name: /^Bold/ })
    expect(boldBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('ListsMenu Bullet list item has aria-checked="true" when bullet list is active', () => {
    renderToolbar(new Set(['insertUnorderedList']))
    const menuTriggers = screen
      .getAllByRole('button')
      .filter((btn) => btn.getAttribute('aria-haspopup') === 'menu')
    const listsBtn = menuTriggers[2]!
    fireEvent.mouseDown(listsBtn)
    const bulletItem = screen.getByText('Bullet list').closest('button')!
    expect(bulletItem).toHaveAttribute('aria-checked', 'true')
  })

  it('ColorMenu "Remove color" has aria-selected="true" when no color is active', () => {
    renderToolbar()
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    fireEvent.mouseDown(colorBtn)
    const removeBtn = screen.getByText('Remove color')
    expect(removeBtn).toHaveAttribute('aria-selected', 'true')
  })

  it('dropdown closes when focus leaves it (blur with external relatedTarget)', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    // Dropdown is open — Heading 1 should be in the document
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    // Simulate focus leaving the dropdown container to an external element
    const dropdownWrapper = ttBtn.closest('[data-toolbar]')!
    fireEvent.blur(dropdownWrapper, { relatedTarget: document.body })
    // Dropdown should be closed
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
  })

  it('TextStyleMenu returns focus to trigger button on Escape', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    // Fire Escape on the open menu panel (onKeyDown is on the menu div)
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'Escape' })
    // Dropdown should close
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
    // Trigger button should have received focus
    expect(document.activeElement).toBe(ttBtn)
  })

  it('TextStyleMenu returns focus to trigger button on Tab', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    const menus = screen.getAllByRole('menu')
    // First menu in the DOM belongs to TextStyleMenu
    fireEvent.keyDown(menus[0]!, { key: 'Tab' })
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(ttBtn)
  })

  it('InsertMenu Mention item calls insertHtml with <p>@</p>', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const mentionItem = screen.getByText('Mention')
    fireEvent.mouseDown(mentionItem)
    expect(insertHtmlMock).toHaveBeenCalledWith('<p>@</p>')
  })

  it('InsertMenu Info panel item calls insertHtml with INFO_PANEL_HTML', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const infoPanelItem = screen.getByText('Info panel')
    fireEvent.mouseDown(infoPanelItem)
    expect(insertHtmlMock).toHaveBeenCalledWith(expect.stringContaining('data-type="info-panel"'))
  })

  it('InsertMenu Decision item calls insertHtml with DECISION_PANEL_HTML', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const decisionItem = screen.getByText('Decision')
    fireEvent.mouseDown(decisionItem)
    expect(insertHtmlMock).toHaveBeenCalledWith(
      expect.stringContaining('data-type="decision-panel"')
    )
  })

  it('TextStyleMenu ArrowDown moves focus to the next menu item', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    const menu = screen.getAllByRole('menu')[0]!
    const items = Array.from(menu.querySelectorAll<HTMLElement>('button'))
    expect(items.length).toBeGreaterThan(1)
    // Focus the first item, then arrow down
    items[0]!.focus()
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1])
  })

  it('TextStyleMenu ArrowUp from the first item wraps to the last item', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    const menu = screen.getAllByRole('menu')[0]!
    const items = Array.from(menu.querySelectorAll<HTMLElement>('button'))
    // Focus the first item, then arrow up (should wrap to last)
    items[0]!.focus()
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items[items.length - 1])
  })
})
