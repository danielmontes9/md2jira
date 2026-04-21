import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { KeyboardEvent } from 'react'
import { useMarkdownShortcuts } from '../src/hooks/useMarkdownShortcuts.js'

describe('useMarkdownShortcuts', () => {
  let ta: HTMLTextAreaElement
  let handler: ReturnType<typeof useMarkdownShortcuts>
  let mockOnChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ta = document.createElement('textarea')
    document.body.appendChild(ta)
    ta.focus()
    mockOnChange = vi.fn()
    const { result } = renderHook(() => useMarkdownShortcuts(mockOnChange))
    handler = result.current
  })

  afterEach(() => {
    ta.remove()
    vi.restoreAllMocks()
  })

  /** Returns the first value passed to onChange, or null if not called. */
  function changedValue(): string | null {
    return (mockOnChange.mock.calls[0]?.[0] as string) ?? null
  }

  /** Fire a synthetic keyboard event directly on the handler. */
  function press(
    key: string,
    opts: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean } = {}
  ) {
    const e = {
      key,
      ctrlKey: opts.ctrl ?? false,
      metaKey: opts.meta ?? false,
      shiftKey: opts.shift ?? false,
      altKey: opts.alt ?? false,
      preventDefault: vi.fn(),
      currentTarget: ta,
    } as unknown as KeyboardEvent<HTMLTextAreaElement>
    handler(e)
    return e
  }

  // ── Tab ─────────────────────────────────────────────────────────────────────

  it('Tab inserts 2 spaces at cursor', () => {
    ta.value = 'hello'
    ta.selectionStart = ta.selectionEnd = 2
    const e = press('Tab')
    expect(e.preventDefault).toHaveBeenCalled()
    expect(changedValue()).toBe('he  llo')
  })

  // ── Shift+Tab — dedent ────────────────────────────────────────────────────────

  it('Shift+Tab removes 2 leading spaces from an indented line', () => {
    ta.value = '  list item'
    ta.selectionStart = ta.selectionEnd = 7
    const e = press('Tab', { shift: true })
    expect(e.preventDefault).toHaveBeenCalled()
    expect(changedValue()).toBe('list item')
  })

  it('Shift+Tab removes only 1 space when line has exactly 1 leading space', () => {
    ta.value = ' item'
    ta.selectionStart = ta.selectionEnd = 3
    press('Tab', { shift: true })
    expect(changedValue()).toBe('item')
  })

  it('Shift+Tab removes at most 2 spaces even when more are present', () => {
    ta.value = '    deeply indented'
    ta.selectionStart = ta.selectionEnd = 5
    press('Tab', { shift: true })
    expect(changedValue()).toBe('  deeply indented')
  })

  it('Shift+Tab does nothing when the line has no leading spaces', () => {
    ta.value = 'no indent'
    ta.selectionStart = ta.selectionEnd = 3
    press('Tab', { shift: true })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  // ── Ctrl+B / I / K / Shift+K / Shift+X ──────────────────────────────────────

  it('Ctrl+B wraps selected text in **', () => {
    ta.value = 'hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    press('b', { ctrl: true })
    expect(changedValue()).toBe('hello **world**')
  })

  it('Ctrl+B wraps empty selection in **', () => {
    ta.value = 'hi'
    ta.selectionStart = ta.selectionEnd = 2
    press('b', { ctrl: true })
    expect(changedValue()).toBe('hi****')
  })

  it('Ctrl+I wraps selection in _', () => {
    ta.value = 'hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    press('i', { ctrl: true })
    expect(changedValue()).toBe('hello _world_')
  })

  it('Ctrl+K wraps selection as [text]() and places cursor inside parens', () => {
    ta.value = 'click here for info'
    ta.selectionStart = 6
    ta.selectionEnd = 10
    press('k', { ctrl: true })
    expect(changedValue()).toBe('click [here]() for info')
  })

  it('Ctrl+K with no selection inserts []() at cursor', () => {
    ta.value = 'see  for details'
    ta.selectionStart = ta.selectionEnd = 4
    press('k', { ctrl: true })
    // value.slice(0, 4) = 'see ', ins = '[]()', value.slice(4) = ' for details'
    expect(changedValue()).toBe('see []() for details')
  })

  it('Ctrl+Shift+K wraps selection in backtick', () => {
    ta.value = 'run build'
    ta.selectionStart = 4
    ta.selectionEnd = 9
    press('k', { ctrl: true, shift: true })
    expect(changedValue()).toBe('run `build`')
  })

  it('Ctrl+Shift+X wraps selection in ~~', () => {
    ta.value = 'remove this'
    ta.selectionStart = 0
    ta.selectionEnd = 11
    press('x', { ctrl: true, shift: true })
    expect(changedValue()).toBe('~~remove this~~')
  })

  // ── Ctrl+Shift+H — heading cycle ────────────────────────────────────────────

  it('Ctrl+Shift+H adds h1 to plain line', () => {
    ta.value = 'My heading'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('# My heading')
  })

  it('Ctrl+Shift+H cycles h1 → h2', () => {
    ta.value = '# My heading'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('## My heading')
  })

  it('Ctrl+Shift+H cycles h2 → h3', () => {
    ta.value = '## Sub'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('### Sub')
  })

  it('Ctrl+Shift+H removes heading when level >= 3', () => {
    ta.value = '### Deep'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('Deep')
  })

  // ── Ctrl+Shift+L — bullet list toggle ───────────────────────────────────────

  it('Ctrl+Shift+L adds bullet to plain line', () => {
    ta.value = 'item one'
    ta.selectionStart = ta.selectionEnd = 0
    press('l', { ctrl: true, shift: true })
    expect(changedValue()).toBe('- item one')
  })

  it('Ctrl+Shift+L removes bullet from existing list item', () => {
    ta.value = '- item one'
    ta.selectionStart = ta.selectionEnd = 0
    press('l', { ctrl: true, shift: true })
    expect(changedValue()).toBe('item one')
  })

  // ── Ctrl+Shift+O — numbered list toggle ─────────────────────────────────────

  it('Ctrl+Shift+O adds numbered prefix to plain line', () => {
    ta.value = 'step'
    ta.selectionStart = ta.selectionEnd = 0
    press('o', { ctrl: true, shift: true })
    expect(changedValue()).toBe('1. step')
  })

  it('Ctrl+Shift+O removes numbered prefix', () => {
    ta.value = '1. step'
    ta.selectionStart = ta.selectionEnd = 0
    press('o', { ctrl: true, shift: true })
    expect(changedValue()).toBe('step')
  })

  // ── Ctrl+Shift+Q — blockquote toggle ────────────────────────────────────────

  it('Ctrl+Shift+Q adds blockquote prefix', () => {
    ta.value = 'note'
    ta.selectionStart = ta.selectionEnd = 0
    press('q', { ctrl: true, shift: true })
    expect(changedValue()).toBe('> note')
  })

  it('Ctrl+Shift+Q removes blockquote prefix', () => {
    ta.value = '> note'
    ta.selectionStart = ta.selectionEnd = 0
    press('q', { ctrl: true, shift: true })
    expect(changedValue()).toBe('note')
  })

  // ── Enter — auto-continue lists ─────────────────────────────────────────────

  it('Enter after bullet item continues the list', () => {
    ta.value = '- first'
    ta.selectionStart = ta.selectionEnd = 7 // end of line
    press('Enter')
    expect(changedValue()).toBe('- first\n- ')
  })

  it('Enter on empty bullet cancels the list', () => {
    ta.value = '- '
    ta.selectionStart = ta.selectionEnd = 2
    press('Enter')
    expect(changedValue()).toBe('')
  })

  it('Enter after numbered list item increments the number', () => {
    ta.value = '1. first'
    ta.selectionStart = ta.selectionEnd = 8
    press('Enter')
    expect(changedValue()).toBe('1. first\n2. ')
  })

  it('Enter on empty numbered list item cancels the list', () => {
    ta.value = '1. '
    ta.selectionStart = ta.selectionEnd = 3
    press('Enter')
    expect(changedValue()).toBe('')
  })

  it('Enter in the middle of a line does not trigger list continuation', () => {
    ta.value = '- hello'
    ta.selectionStart = ta.selectionEnd = 4 // mid-line, not at end
    press('Enter')
    // onChange must NOT have been called — native Enter is used
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  // ── Ctrl+Enter — blank line below ───────────────────────────────────────────

  it('Ctrl+Enter inserts blank line below current line', () => {
    ta.value = 'hello\nworld'
    ta.selectionStart = ta.selectionEnd = 3 // inside 'hello'
    press('Enter', { ctrl: true })
    expect(changedValue()).toBe('hello\n\nworld')
  })

  // ── Alt+ArrowUp / Alt+ArrowDown — move line ─────────────────────────────────

  it('Alt+ArrowUp swaps line with the one above', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 8 // inside 'line2'
    press('ArrowUp', { alt: true })
    expect(changedValue()).toBe('line2\nline1')
  })

  it('Alt+ArrowUp does nothing on the first line', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 2 // inside 'line1'
    press('ArrowUp', { alt: true })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('Alt+ArrowDown swaps line with the one below', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 2 // inside 'line1'
    press('ArrowDown', { alt: true })
    expect(changedValue()).toBe('line2\nline1')
  })

  it('Alt+ArrowDown does nothing on the last line', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 8 // inside 'line2'
    press('ArrowDown', { alt: true })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  // ── Ctrl+D — duplicate line ──────────────────────────────────────────────────

  it('Ctrl+D duplicates the current line', () => {
    ta.value = 'hello world'
    ta.selectionStart = ta.selectionEnd = 5
    press('d', { ctrl: true })
    expect(changedValue()).toBe('hello world\nhello world')
  })

  // ── Heading cycle via Ctrl+Shift+H ──────────────────────────────────────────

  it('Ctrl+Shift+H adds h1 prefix to plain text', () => {
    ta.value = 'plain text'
    ta.selectionStart = ta.selectionEnd = 5
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('# plain text')
  })

  it('Ctrl+Shift+H cycles h1 to h2', () => {
    ta.value = '# heading'
    ta.selectionStart = ta.selectionEnd = 5
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('## heading')
  })

  it('Ctrl+Shift+H on h3 removes heading prefix', () => {
    ta.value = '### heading'
    ta.selectionStart = ta.selectionEnd = 5
    press('h', { ctrl: true, shift: true })
    expect(changedValue()).toBe('heading')
  })

  // ── Enter — auto-continue edge cases ────────────────────────────────────────

  it('Enter after task list item continues with task list prefix', () => {
    ta.value = '- [x] done'
    ta.selectionStart = ta.selectionEnd = 10
    press('Enter')
    expect(changedValue()).toBe('- [x] done\n- [ ] ')
  })

  it('Enter after unchecked task item continues with empty task prefix', () => {
    ta.value = '- [ ] todo'
    ta.selectionStart = ta.selectionEnd = 10
    press('Enter')
    expect(changedValue()).toBe('- [ ] todo\n- [ ] ')
  })

  it('Enter on empty task item cancels the task list', () => {
    ta.value = '- [ ] '
    ta.selectionStart = ta.selectionEnd = 6
    press('Enter')
    expect(changedValue()).toBe('')
  })

  it('Enter on empty checked task item also cancels the task list', () => {
    ta.value = '- [x] '
    ta.selectionStart = ta.selectionEnd = 6
    press('Enter')
    expect(changedValue()).toBe('')
  })

  // ── Ctrl+Shift+C — insert fenced code block ──────────────────────────────────

  it('Ctrl+Shift+C inserts a fenced code block at cursor position', () => {
    ta.value = 'before'
    ta.selectionStart = ta.selectionEnd = 6
    const e = press('c', { ctrl: true, shift: true })
    expect(e.preventDefault).toHaveBeenCalled()
    expect(changedValue()).toBe('before```\n\n```')
  })

  it('Ctrl+Shift+C inserts code block in the middle of text', () => {
    ta.value = 'hello world'
    ta.selectionStart = ta.selectionEnd = 5
    press('c', { ctrl: true, shift: true })
    expect(changedValue()).toBe('hello```\n\n``` world')
  })

  it('Ctrl+Shift+C replaces selected text with code block', () => {
    ta.value = 'hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    press('c', { ctrl: true, shift: true })
    expect(changedValue()).toBe('hello ```\n\n```')
  })

  it('Ctrl+Shift+C at start of empty document inserts code block', () => {
    ta.value = ''
    ta.selectionStart = ta.selectionEnd = 0
    press('c', { ctrl: true, shift: true })
    expect(changedValue()).toBe('```\n\n```')
  })
})
