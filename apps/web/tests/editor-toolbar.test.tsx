import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
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
    const bBtn = screen.getByRole('button', { name: 'More formatting' })
    expect(bBtn).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('FormatMenu (···) opens and shows Subscript but not Bold or Italic', () => {
    renderToolbar()
    const moreBtn = screen.getByRole('button', { name: 'More formatting' })
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

  it('EmojiMenu calls exec("insertText") when a searched emoji is clicked', async () => {
    renderToolbar()
    const emojiBtn = screen.getByRole('button', { name: 'Emoji' })
    fireEvent.mouseDown(emojiBtn)
    const dialog = screen.getByRole('dialog')

    // Wait for emoji data to load first
    await waitFor(() => {
      const btns = within(dialog)
        .getAllByRole('button')
        .filter((btn) => btn.textContent && /\p{Emoji}/u.test(btn.textContent))
      if (btns.length === 0) throw new Error('emoji data not loaded yet')
      return btns
    })

    // Search for a category to get filtered results
    const searchInput = screen.getByRole('textbox', { name: /search emojis/i })
    fireEvent.change(searchInput, { target: { value: 'people' } })

    // Click one of the filtered emoji buttons
    const filteredBtns = await waitFor(() => {
      const btns = within(dialog)
        .getAllByRole('button')
        .filter((btn) => btn.textContent && /\p{Emoji}/u.test(btn.textContent))
      if (btns.length === 0) throw new Error('no filtered emojis yet')
      return btns
    })
    const emoji = filteredBtns[0]!.textContent ?? ''
    fireEvent.mouseDown(filteredBtns[0]!)
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

  it('InsertMenu Action item calls exec("toggleTaskList")', () => {
    renderToolbar()
    const insertBtn = screen.getByRole('button', { name: 'Insert elements' })
    fireEvent.mouseDown(insertBtn)
    const actionItem = screen.getByText('Action item')
    fireEvent.mouseDown(actionItem)
    expect(execMock).toHaveBeenCalledWith('toggleTaskList')
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

  it('dropdown closes when focus leaves the browser (blur with null relatedTarget)', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn)
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    // relatedTarget is null when the window loses focus (e.g. alt-tab).
    // This exercises the !(related instanceof Node) → true branch in shared.tsx.
    const dropdownWrapper = ttBtn.closest('[data-toolbar]')!
    fireEvent.blur(dropdownWrapper)
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

  // ── hasLossyMarks badge ───────────────────────────────────────────────────

  it('does not render the "Lost in Jira" badge when hasLossyMarks is false', () => {
    renderToolbar()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('Lost in Jira')).not.toBeInTheDocument()
  })

  it('renders the "Lost in Jira" status badge when hasLossyMarks is true', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor={undefined}
        hasLossyMarks={true}
      />
    )
    const badge = screen.getByRole('status')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Lost in Jira')).toBeInTheDocument()
  })

  it('badge is rendered outside the scrollable button area', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor={undefined}
        hasLossyMarks={true}
      />
    )
    const toolbar = screen.getByRole('toolbar')
    const badge = screen.getByRole('status')
    // The badge must be a direct child of the toolbar wrapper, not inside
    // the scrollable flex div (first child of toolbar).
    const scrollableDiv = toolbar.firstElementChild
    expect(scrollableDiv?.contains(badge)).toBe(false)
    expect(toolbar.contains(badge)).toBe(true)
  })

  // ── TableMenu ─────────────────────────────────────────────────────────────

  it('does not render the Table options button when isInTable is false', () => {
    renderToolbar()
    expect(screen.queryByRole('button', { name: 'Table options' })).not.toBeInTheDocument()
  })

  it('renders the Table options button when isInTable is true', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor={undefined}
        isInTable={true}
      />
    )
    expect(screen.getByRole('button', { name: 'Table options' })).toBeInTheDocument()
  })

  it('TableMenu opens and shows row/column/table operations', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor={undefined}
        isInTable={true}
      />
    )
    const tableBtn = screen.getByRole('button', { name: 'Table options' })
    fireEvent.mouseDown(tableBtn)
    expect(screen.getByText('Add row below')).toBeInTheDocument()
    expect(screen.getByText('Add row above')).toBeInTheDocument()
    expect(screen.getByText('Add column right')).toBeInTheDocument()
    expect(screen.getByText('Add column left')).toBeInTheDocument()
    expect(screen.getByText('Delete row')).toBeInTheDocument()
    expect(screen.getByText('Delete column')).toBeInTheDocument()
    expect(screen.getByText('Delete table')).toBeInTheDocument()
  })

  it('TableMenu "Add row below" calls exec("addRowAfter")', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor={undefined}
        isInTable={true}
      />
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Add row below'))
    expect(execMock).toHaveBeenCalledWith('addRowAfter')
  })

  it('TableMenu "Delete table" calls exec("deleteTable")', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor={undefined}
        isInTable={true}
      />
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Delete table'))
    expect(execMock).toHaveBeenCalledWith('deleteTable')
  })

  it('ColorMenu swatch for the activeColor has aria-selected="true"', () => {
    // '#091E42' is the first color in TEXT_COLORS
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor="#091E42"
      />
    )
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    fireEvent.mouseDown(colorBtn)
    const activeSwatch = screen.getByRole('option', { name: '#091E42' })
    expect(activeSwatch).toHaveAttribute('aria-selected', 'true')
  })

  it('ColorMenu "Remove color" has aria-selected="false" when a color is active', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set()}
        activeColor="#091E42"
      />
    )
    const colorBtn = screen.getByRole('button', { name: 'Text color' })
    fireEvent.mouseDown(colorBtn)
    const removeBtn = screen.getByText('Remove color')
    expect(removeBtn).toHaveAttribute('aria-selected', 'false')
  })

  it('EmojiMenu search input filters emojis by category name', async () => {
    renderToolbar()
    const emojiBtn = screen.getByRole('button', { name: 'Emoji' })
    fireEvent.mouseDown(emojiBtn)
    const dialog = screen.getByRole('dialog')

    // Wait for emoji data to load (lazy import)
    await waitFor(() => {
      const btns = within(dialog)
        .getAllByRole('button')
        .filter((btn) => btn.textContent && /\p{Emoji}/u.test(btn.textContent))
      if (btns.length === 0) throw new Error('emoji data not loaded yet')
      return btns
    })

    // Type a category name into the search input
    const searchInput = screen.getByRole('textbox', { name: /search emojis/i })
    fireEvent.change(searchInput, { target: { value: 'people' } })

    // After search, only the "People" category emojis should be shown,
    // all as individual buttons in a flat list.
    await waitFor(() => {
      const filteredBtns = within(dialog)
        .getAllByRole('button')
        .filter((btn) => btn.textContent && /\p{Emoji}/u.test(btn.textContent))
      expect(filteredBtns.length).toBeGreaterThan(0)
      // Category headers should no longer appear
      expect(screen.queryByText('Frequent')).not.toBeInTheDocument()
    })
  })

  it('EmojiMenu search shows "No emojis found" when search matches nothing', async () => {
    renderToolbar()
    const emojiBtn = screen.getByRole('button', { name: 'Emoji' })
    fireEvent.mouseDown(emojiBtn)

    // Wait for emoji data to load before searching
    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      const btns = within(dialog)
        .getAllByRole('button')
        .filter((btn) => btn.textContent && /\p{Emoji}/u.test(btn.textContent))
      if (btns.length === 0) throw new Error('emoji data not loaded yet')
    })

    const searchInput = screen.getByRole('textbox', { name: /search emojis/i })
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } })

    await waitFor(() => {
      expect(screen.getByText(/no emojis/i)).toBeInTheDocument()
    })
  })

  // ── FormatMenu — active format branch ─────────────────────────────────────

  it('FormatMenu shows Subscript as active (aria-checked="true") when subscript is in activeFormats', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set(['subscript'])}
        activeColor={undefined}
      />
    )
    const moreBtn = screen.getByRole('button', { name: 'More formatting' })
    fireEvent.mouseDown(moreBtn)
    const subscriptBtn = screen.getByText('Subscript').closest('button')!
    expect(subscriptBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('FormatMenu applies active highlight class when a format is active', () => {
    renderWithSettings(
      <EditorToolbar
        exec={execMock}
        insertHtml={insertHtmlMock}
        activeBlock="p"
        activeFormats={new Set(['superscript'])}
        activeColor={undefined}
      />
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'More formatting' }))
    const superscriptBtn = screen.getByText('Superscript').closest('button')!
    expect(superscriptBtn.className).toContain('bg-blue-50')
  })

  // ── ToolbarDropdown trigger — keyboard navigation ──────────────────────────

  it('TextStyleMenu opens via Enter key on the trigger button', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
    fireEvent.keyDown(ttBtn, { key: 'Enter' })
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
  })

  it('TextStyleMenu opens via Space key on the trigger button', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.keyDown(ttBtn, { key: ' ' })
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
  })

  it('TextStyleMenu closes via Enter when the dropdown is already open', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn) // open via mouse
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    fireEvent.keyDown(ttBtn, { key: 'Enter' }) // close via keyboard
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
  })

  it('TextStyleMenu closes via Escape key pressed on the trigger button', () => {
    renderToolbar()
    const ttBtn = screen.getByRole('button', { name: 'Text styles' })
    fireEvent.mouseDown(ttBtn) // open
    expect(screen.getByText('Heading 1')).toBeInTheDocument()
    fireEvent.keyDown(ttBtn, { key: 'Escape' })
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument()
  })

  it('calls exec("toggleCode") when inline-code button is mouse-downed', () => {
    renderToolbar()
    const codeBtn = screen.getByRole('button', { name: /wysiwygInlineCode|Inline code/i })
    fireEvent.mouseDown(codeBtn)
    expect(execMock).toHaveBeenCalledWith('toggleCode')
  })

  // ── Toolbar ArrowLeft / ArrowRight keyboard navigation ────────────────────

  it('ArrowRight on the toolbar moves focus to the next focusable button', () => {
    renderToolbar()
    const toolbar = screen.getByRole('toolbar')
    const buttons = Array.from(toolbar.querySelectorAll<HTMLElement>('button:not([disabled])'))
    expect(buttons.length).toBeGreaterThan(1)
    buttons[0]!.focus()
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[1])
  })

  it('ArrowLeft on the toolbar moves focus to the previous focusable button', () => {
    renderToolbar()
    const toolbar = screen.getByRole('toolbar')
    const buttons = Array.from(toolbar.querySelectorAll<HTMLElement>('button:not([disabled])'))
    expect(buttons.length).toBeGreaterThan(1)
    buttons[1]!.focus()
    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(buttons[0])
  })

  it('ArrowRight on the last toolbar button wraps to the first button', () => {
    renderToolbar()
    const toolbar = screen.getByRole('toolbar')
    const buttons = Array.from(toolbar.querySelectorAll<HTMLElement>('button:not([disabled])'))
    buttons[buttons.length - 1]!.focus()
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[0])
  })
})

// ── EditorToolbar — i18n locale switching ─────────────────────────────────────

describe('EditorToolbar — i18n', () => {
  const LS_KEY = 'md2jira-settings'

  function renderToolbarWithLocale(locale: 'en' | 'es' | 'pt' | 'fr') {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale })
    )
    return render(
      <SettingsProvider>
        <EditorToolbar
          exec={vi.fn()}
          insertHtml={vi.fn()}
          activeBlock="p"
          activeFormats={new Set()}
          activeColor={undefined}
        />
      </SettingsProvider>
    )
  }

  afterEach(() => {
    localStorage.clear()
  })

  // ── French ──────────────────────────────────────────────────────────────────

  it('renders the toolbar aria-label in French', () => {
    renderToolbarWithLocale('fr')
    expect(screen.getByRole('toolbar', { name: 'Mise en forme du texte' })).toBeInTheDocument()
  })

  it('renders the Bold button label in French as "Gras"', () => {
    renderToolbarWithLocale('fr')
    expect(screen.getByRole('button', { name: /^Gras/ })).toBeInTheDocument()
  })

  it('renders the Text Styles menu trigger in French', () => {
    renderToolbarWithLocale('fr')
    expect(screen.getByRole('button', { name: 'Styles de texte' })).toBeInTheDocument()
  })

  it('TextStyleMenu shows "Texte normal" in French when opened', () => {
    renderToolbarWithLocale('fr')
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Styles de texte' }))
    expect(screen.getAllByText('Texte normal').length).toBeGreaterThan(0)
  })

  it('renders the More formatting menu trigger in French', () => {
    renderToolbarWithLocale('fr')
    expect(screen.getByRole('button', { name: 'Plus de mise en forme' })).toBeInTheDocument()
  })

  it('renders the Insert elements menu trigger in French', () => {
    renderToolbarWithLocale('fr')
    expect(
      screen.getByRole('button', { name: 'Ins\u00e9rer des \u00e9l\u00e9ments' })
    ).toBeInTheDocument()
  })

  // ── Spanish ─────────────────────────────────────────────────────────────────

  it('renders the toolbar aria-label in Spanish', () => {
    renderToolbarWithLocale('es')
    expect(screen.getByRole('toolbar', { name: 'Formato de texto' })).toBeInTheDocument()
  })

  it('renders the Bold button label in Spanish as "Negrita"', () => {
    renderToolbarWithLocale('es')
    expect(screen.getByRole('button', { name: /^Negrita/ })).toBeInTheDocument()
  })

  it('renders the Insert elements menu trigger in Spanish', () => {
    renderToolbarWithLocale('es')
    expect(screen.getByRole('button', { name: 'Insertar elementos' })).toBeInTheDocument()
  })

  it('renders the More formatting menu trigger in Spanish', () => {
    renderToolbarWithLocale('es')
    expect(screen.getByRole('button', { name: 'M\u00e1s formato' })).toBeInTheDocument()
  })
})

// ── FormatMenu button handlers ─────────────────────────────────────────────────

describe('EditorToolbar — FormatMenu button mouseDown handlers', () => {
  let execMock: ReturnType<typeof vi.fn>
  let insertHtmlMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    execMock = vi.fn()
    insertHtmlMock = vi.fn()
  })

  it('clicking Subscript calls exec("toggleSubscript")', () => {
    render(
      <SettingsProvider>
        <EditorToolbar
          exec={execMock}
          insertHtml={insertHtmlMock}
          activeBlock="p"
          activeFormats={new Set()}
          activeColor={undefined}
        />
      </SettingsProvider>
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'More formatting' }))
    fireEvent.mouseDown(screen.getByText('Subscript').closest('button')!)
    expect(execMock).toHaveBeenCalledWith('subscript')
  })

  it('clicking Superscript calls exec("toggleSuperscript")', () => {
    render(
      <SettingsProvider>
        <EditorToolbar
          exec={execMock}
          insertHtml={insertHtmlMock}
          activeBlock="p"
          activeFormats={new Set()}
          activeColor={undefined}
        />
      </SettingsProvider>
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'More formatting' }))
    fireEvent.mouseDown(screen.getByText('Superscript').closest('button')!)
    expect(execMock).toHaveBeenCalledWith('superscript')
  })

  it('clicking Remove formatting calls exec("unsetAllMarks")', () => {
    render(
      <SettingsProvider>
        <EditorToolbar
          exec={execMock}
          insertHtml={insertHtmlMock}
          activeBlock="p"
          activeFormats={new Set()}
          activeColor={undefined}
        />
      </SettingsProvider>
    )
    fireEvent.mouseDown(screen.getByRole('button', { name: 'More formatting' }))
    fireEvent.mouseDown(screen.getByText('Clear formatting').closest('button')!)
    expect(execMock).toHaveBeenCalledWith('removeFormat')
  })
})

// ── ContentMenus TableMenu — additional handlers ───────────────────────────────

describe('EditorToolbar — TableMenu additional handlers', () => {
  let execMock: ReturnType<typeof vi.fn>
  let insertHtmlMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    execMock = vi.fn()
    insertHtmlMock = vi.fn()
  })

  function renderInTable() {
    render(
      <SettingsProvider>
        <EditorToolbar
          exec={execMock}
          insertHtml={insertHtmlMock}
          activeBlock="p"
          activeFormats={new Set()}
          activeColor={undefined}
          isInTable={true}
        />
      </SettingsProvider>
    )
  }

  it('TableMenu "Add row above" calls exec("addRowBefore")', () => {
    renderInTable()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Add row above'))
    expect(execMock).toHaveBeenCalledWith('addRowBefore')
  })

  it('TableMenu "Add column right" calls exec("addColumnAfter")', () => {
    renderInTable()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Add column right'))
    expect(execMock).toHaveBeenCalledWith('addColumnAfter')
  })

  it('TableMenu "Add column left" calls exec("addColumnBefore")', () => {
    renderInTable()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Add column left'))
    expect(execMock).toHaveBeenCalledWith('addColumnBefore')
  })

  it('TableMenu "Delete row" calls exec("deleteRow")', () => {
    renderInTable()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Delete row'))
    expect(execMock).toHaveBeenCalledWith('deleteRow')
  })

  it('TableMenu "Delete column" calls exec("deleteColumn")', () => {
    renderInTable()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Table options' }))
    fireEvent.mouseDown(screen.getByText('Delete column'))
    expect(execMock).toHaveBeenCalledWith('deleteColumn')
  })
})
