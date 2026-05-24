import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  EMPTY_FORMATS,
  execTiptapCommand,
  getActiveBlock,
  getActiveFormats,
} from '../src/utils/tiptap-commands.js'
import { useTiptapEditor } from '../src/hooks/useTiptapEditor.js'

// ─── EMPTY_FORMATS ────────────────────────────────────────────────────────────

describe('EMPTY_FORMATS', () => {
  it('is an empty Set', () => {
    expect(EMPTY_FORMATS).toBeInstanceOf(Set)
    expect(EMPTY_FORMATS.size).toBe(0)
  })

  it('is the same reference across imports (stable identity)', async () => {
    const { EMPTY_FORMATS: ef2 } = await import('../src/utils/tiptap-commands.js')
    expect(EMPTY_FORMATS).toBe(ef2)
  })
})

// ─── execTiptapCommand ────────────────────────────────────────────────────────

describe('execTiptapCommand', () => {
  function makeEditor() {
    const { result } = renderHook(() =>
      useTiptapEditor({ previewHtml: '<p>test</p>', onMarkdownChange: undefined })
    )
    return result
  }

  it('does not throw for all documented command names', () => {
    const result = makeEditor()
    const commands: [string, string?][] = [
      ['bold'],
      ['italic'],
      ['underline'],
      ['strikeThrough'],
      ['subscript'],
      ['superscript'],
      ['insertUnorderedList'],
      ['insertOrderedList'],
      ['insertHorizontalRule'],
      ['toggleTaskList'],
      ['insertTable'],
      ['toggleBlockquote'],
      ['toggleCode'],
      ['toggleCodeBlock'],
      ['undo'],
      ['redo'],
      ['removeFormat'],
      ['foreColor', '#0052CC'],
      ['foreColor'],
      ['formatBlock', 'h2'],
      ['formatBlock', 'p'],
      ['insertText', 'hello'],
    ]
    for (const [cmd, arg] of commands) {
      expect(() =>
        act(() => {
          if (result.current.editor) {
            execTiptapCommand(result.current.editor, cmd, arg)
          }
        })
      ).not.toThrow()
    }
  })

  it('silently ignores unknown commands', () => {
    const result = makeEditor()
    expect(() =>
      act(() => {
        if (result.current.editor) {
          execTiptapCommand(result.current.editor, 'unknownCommand')
        }
      })
    ).not.toThrow()
  })

  it('handles table-scoped commands without throwing', () => {
    const result = makeEditor()
    const tableCmds = [
      'addRowAfter',
      'addRowBefore',
      'addColumnAfter',
      'addColumnBefore',
      'deleteRow',
      'deleteColumn',
      'deleteTable',
    ]
    for (const cmd of tableCmds) {
      expect(() =>
        act(() => {
          if (result.current.editor) execTiptapCommand(result.current.editor, cmd)
        })
      ).not.toThrow()
    }
  })

  it('formatBlock without arg does nothing', () => {
    const result = makeEditor()
    expect(() =>
      act(() => {
        if (result.current.editor) execTiptapCommand(result.current.editor, 'formatBlock')
      })
    ).not.toThrow()
  })

  it('formatBlock with unrecognized tag does nothing', () => {
    const result = makeEditor()
    expect(() =>
      act(() => {
        if (result.current.editor) execTiptapCommand(result.current.editor, 'formatBlock', 'div')
      })
    ).not.toThrow()
  })

  it('insertText without arg does nothing', () => {
    const result = makeEditor()
    expect(() =>
      act(() => {
        if (result.current.editor) execTiptapCommand(result.current.editor, 'insertText')
      })
    ).not.toThrow()
  })
})

// ─── getActiveBlock ───────────────────────────────────────────────────────────

describe('getActiveBlock', () => {
  it('returns "p" for a plain paragraph editor', () => {
    const { result } = renderHook(() =>
      useTiptapEditor({ previewHtml: '<p>hello</p>', onMarkdownChange: undefined })
    )
    const editor = result.current.editor
    if (editor) {
      expect(getActiveBlock(editor)).toBe('p')
    }
  })

  it('returns "pre" for a code block', () => {
    const { result } = renderHook(() =>
      useTiptapEditor({
        previewHtml: '<pre><code>const x = 1</code></pre>',
        onMarkdownChange: undefined,
      })
    )
    const editor = result.current.editor
    if (editor) {
      expect(getActiveBlock(editor)).toBe('pre')
    }
  })
})

// ─── getActiveFormats ─────────────────────────────────────────────────────────

describe('getActiveFormats', () => {
  it('returns an empty Set for plain text', () => {
    const { result } = renderHook(() =>
      useTiptapEditor({ previewHtml: '<p>plain</p>', onMarkdownChange: undefined })
    )
    const editor = result.current.editor
    if (editor) {
      expect(getActiveFormats(editor).size).toBe(0)
    }
  })

  it('returns a Set instance', () => {
    const { result } = renderHook(() =>
      useTiptapEditor({ previewHtml: '<p>hello</p>', onMarkdownChange: undefined })
    )
    const editor = result.current.editor
    if (editor) {
      expect(getActiveFormats(editor)).toBeInstanceOf(Set)
    }
  })
})
