import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { KeyboardEvent } from 'react'
import { useMarkdownShortcuts } from '../src/hooks/useMarkdownShortcuts.js'

/**
 * Stub document.execCommand('insertText') because jsdom doesn't implement it.
 * The closure captures `ta` so it always targets the textarea created per test.
 */
function makeExecCommandStub(getTa: () => HTMLTextAreaElement) {
  return vi.spyOn(document, 'execCommand').mockImplementation((cmd, _showUI, val = '') => {
    if (cmd !== 'insertText') return true
    const ta = getTa()
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    ta.value = ta.value.slice(0, start) + val + ta.value.slice(end)
    ta.selectionStart = ta.selectionEnd = start + val.length
    return true
  })
}

describe('useMarkdownShortcuts', () => {
  let ta: HTMLTextAreaElement
  let handler: ReturnType<typeof useMarkdownShortcuts>

  beforeEach(() => {
    ta = document.createElement('textarea')
    document.body.appendChild(ta)
    ta.focus()
    makeExecCommandStub(() => ta)
    const { result } = renderHook(() => useMarkdownShortcuts())
    handler = result.current
  })

  afterEach(() => {
    ta.remove()
    vi.restoreAllMocks()
  })

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
    expect(ta.value).toBe('he  llo')
    expect(ta.selectionStart).toBe(4)
  })

  // ── Ctrl+B / I / Shift+K / Shift+X ─────────────────────────────────────────

  it('Ctrl+B wraps selected text in **', () => {
    ta.value = 'hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    press('b', { ctrl: true })
    expect(ta.value).toBe('hello **world**')
  })

  it('Ctrl+B wraps empty selection in **', () => {
    ta.value = 'hi'
    ta.selectionStart = ta.selectionEnd = 2
    press('b', { ctrl: true })
    expect(ta.value).toBe('hi****')
  })

  it('Ctrl+I wraps selection in _', () => {
    ta.value = 'hello world'
    ta.selectionStart = 6
    ta.selectionEnd = 11
    press('i', { ctrl: true })
    expect(ta.value).toBe('hello _world_')
  })

  it('Ctrl+Shift+K wraps selection in backtick', () => {
    ta.value = 'run build'
    ta.selectionStart = 4
    ta.selectionEnd = 9
    press('k', { ctrl: true, shift: true })
    expect(ta.value).toBe('run `build`')
  })

  it('Ctrl+Shift+X wraps selection in ~~', () => {
    ta.value = 'remove this'
    ta.selectionStart = 0
    ta.selectionEnd = 11
    press('x', { ctrl: true, shift: true })
    expect(ta.value).toBe('~~remove this~~')
  })

  // ── Ctrl+Shift+H — heading cycle ────────────────────────────────────────────

  it('Ctrl+Shift+H adds h1 to plain line', () => {
    ta.value = 'My heading'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(ta.value).toBe('# My heading')
  })

  it('Ctrl+Shift+H cycles h1 → h2', () => {
    ta.value = '# My heading'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(ta.value).toBe('## My heading')
  })

  it('Ctrl+Shift+H cycles h2 → h3', () => {
    ta.value = '## Sub'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(ta.value).toBe('### Sub')
  })

  it('Ctrl+Shift+H removes heading when level >= 3', () => {
    ta.value = '### Deep'
    ta.selectionStart = ta.selectionEnd = 0
    press('h', { ctrl: true, shift: true })
    expect(ta.value).toBe('Deep')
  })

  // ── Ctrl+Shift+L — bullet list toggle ───────────────────────────────────────

  it('Ctrl+Shift+L adds bullet to plain line', () => {
    ta.value = 'item one'
    ta.selectionStart = ta.selectionEnd = 0
    press('l', { ctrl: true, shift: true })
    expect(ta.value).toBe('- item one')
  })

  it('Ctrl+Shift+L removes bullet from existing list item', () => {
    ta.value = '- item one'
    ta.selectionStart = ta.selectionEnd = 0
    press('l', { ctrl: true, shift: true })
    expect(ta.value).toBe('item one')
  })

  // ── Ctrl+Shift+O — numbered list toggle ─────────────────────────────────────

  it('Ctrl+Shift+O adds numbered prefix to plain line', () => {
    ta.value = 'step'
    ta.selectionStart = ta.selectionEnd = 0
    press('o', { ctrl: true, shift: true })
    expect(ta.value).toBe('1. step')
  })

  it('Ctrl+Shift+O removes numbered prefix', () => {
    ta.value = '1. step'
    ta.selectionStart = ta.selectionEnd = 0
    press('o', { ctrl: true, shift: true })
    expect(ta.value).toBe('step')
  })

  // ── Ctrl+Shift+Q — blockquote toggle ────────────────────────────────────────

  it('Ctrl+Shift+Q adds blockquote prefix', () => {
    ta.value = 'note'
    ta.selectionStart = ta.selectionEnd = 0
    press('q', { ctrl: true, shift: true })
    expect(ta.value).toBe('> note')
  })

  it('Ctrl+Shift+Q removes blockquote prefix', () => {
    ta.value = '> note'
    ta.selectionStart = ta.selectionEnd = 0
    press('q', { ctrl: true, shift: true })
    expect(ta.value).toBe('note')
  })

  // ── Enter — auto-continue lists ─────────────────────────────────────────────

  it('Enter after bullet item continues the list', () => {
    ta.value = '- first'
    ta.selectionStart = ta.selectionEnd = 7 // end of line
    press('Enter')
    expect(ta.value).toBe('- first\n- ')
  })

  it('Enter on empty bullet cancels the list', () => {
    ta.value = '- '
    ta.selectionStart = ta.selectionEnd = 2
    press('Enter')
    expect(ta.value).toBe('')
  })

  it('Enter after numbered list item increments the number', () => {
    ta.value = '1. first'
    ta.selectionStart = ta.selectionEnd = 8
    press('Enter')
    expect(ta.value).toBe('1. first\n2. ')
  })

  it('Enter on empty numbered list item cancels the list', () => {
    ta.value = '1. '
    ta.selectionStart = ta.selectionEnd = 3
    press('Enter')
    expect(ta.value).toBe('')
  })

  it('Enter in the middle of a line does not trigger list continuation', () => {
    ta.value = '- hello'
    ta.selectionStart = ta.selectionEnd = 4 // mid-line, not at end
    press('Enter')
    // No preventDefault called — native Enter behaviour
    expect(ta.value).toBe('- hello')
  })

  // ── Ctrl+Enter — blank line below ───────────────────────────────────────────

  it('Ctrl+Enter inserts blank line below current line', () => {
    ta.value = 'hello\nworld'
    ta.selectionStart = ta.selectionEnd = 3 // inside 'hello'
    press('Enter', { ctrl: true })
    expect(ta.value).toBe('hello\n\nworld')
  })

  // ── Alt+ArrowUp / Alt+ArrowDown — move line ─────────────────────────────────

  it('Alt+ArrowUp swaps line with the one above', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 8 // inside 'line2'
    press('ArrowUp', { alt: true })
    expect(ta.value).toBe('line2\nline1')
  })

  it('Alt+ArrowUp does nothing on the first line', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 2 // inside 'line1'
    press('ArrowUp', { alt: true })
    expect(ta.value).toBe('line1\nline2')
  })

  it('Alt+ArrowDown swaps line with the one below', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 2 // inside 'line1'
    press('ArrowDown', { alt: true })
    expect(ta.value).toBe('line2\nline1')
  })

  it('Alt+ArrowDown does nothing on the last line', () => {
    ta.value = 'line1\nline2'
    ta.selectionStart = ta.selectionEnd = 8 // inside 'line2'
    press('ArrowDown', { alt: true })
    expect(ta.value).toBe('line1\nline2')
  })

  // ── Ctrl+D — duplicate line ──────────────────────────────────────────────────

  it('Ctrl+D duplicates the current line', () => {
    ta.value = 'hello world'
    ta.selectionStart = ta.selectionEnd = 5
    press('d', { ctrl: true })
    expect(ta.value).toBe('hello world\nhello world')
  })
})
