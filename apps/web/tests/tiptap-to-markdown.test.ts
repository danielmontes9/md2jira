/**
 * Unit tests for tiptapDocToMarkdown — the ProseMirror doc-tree serializer.
 *
 * Each test creates an Editor with the same extension set used by useTiptapEditor,
 * sets content via HTML (parsed by TipTap), then calls tiptapDocToMarkdown on the
 * resulting ProseMirror document and asserts the expected Markdown output.
 *
 * Using @tiptap/core directly (not useEditor) avoids React hook overhead and
 * lets us test the pure serializer function in isolation.
 */
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { tiptapDocToMarkdown } from '../src/utils/tiptap-to-markdown.js'

/** Extension set that mirrors useTiptapEditor so the PM schema is identical. */
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    underline: false,
  }),
  Underline,
  Subscript,
  Superscript,
  TextStyle,
  Color,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  TaskList,
  TaskItem.configure({ nested: true }),
]

/**
 * Creates a ProseMirror document by parsing HTML through a TipTap editor.
 * The editor is immediately destroyed to free DOM resources.
 */
function htmlToDoc(html: string) {
  const editor = new Editor({ extensions: EXTENSIONS, content: html })
  const doc = editor.state.doc
  editor.destroy()
  return doc
}

// ── Block nodes ───────────────────────────────────────────────────────────────

describe('tiptapDocToMarkdown — block nodes', () => {
  it('returns empty string for an empty document', () => {
    expect(tiptapDocToMarkdown(htmlToDoc(''))).toBe('')
  })

  it('serializes a paragraph', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p>Hello world</p>'))).toBe('Hello world')
  })

  it('serializes headings h1 through h6', () => {
    for (let level = 1; level <= 6; level++) {
      const doc = htmlToDoc(`<h${level}>Heading ${level}</h${level}>`)
      expect(tiptapDocToMarkdown(doc)).toBe(`${'#'.repeat(level)} Heading ${level}`)
    }
  })

  it('serializes a blockquote', () => {
    const doc = htmlToDoc('<blockquote><p>A quoted note</p></blockquote>')
    expect(tiptapDocToMarkdown(doc)).toContain('> A quoted note')
  })

  it('serializes a fenced code block with language', () => {
    const doc = htmlToDoc('<pre><code class="language-js">const x = 1</code></pre>')
    expect(tiptapDocToMarkdown(doc)).toBe('```js\nconst x = 1\n```')
  })

  it('serializes a fenced code block without language', () => {
    const doc = htmlToDoc('<pre><code>plain code</code></pre>')
    expect(tiptapDocToMarkdown(doc)).toBe('```\nplain code\n```')
  })

  it('serializes a horizontal rule', () => {
    const doc = htmlToDoc('<p>before</p><hr><p>after</p>')
    expect(tiptapDocToMarkdown(doc)).toContain('---')
  })

  it('serializes an unordered list', () => {
    const doc = htmlToDoc('<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('- Item 1')
    expect(md).toContain('- Item 2')
  })

  it('serializes a nested unordered list with correct indentation', () => {
    const doc = htmlToDoc('<ul><li><p>Parent</p><ul><li><p>Child</p></li></ul></li></ul>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('- Parent')
    expect(md).toContain('  - Child')
  })

  it('serializes an ordered list', () => {
    const doc = htmlToDoc('<ol><li><p>First</p></li><li><p>Second</p></li></ol>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('1. First')
    expect(md).toContain('1. Second')
  })

  it('serializes a task list with checked and unchecked items', () => {
    const doc = htmlToDoc(
      '<ul data-type="taskList">' +
        '<li data-type="taskItem" data-checked="true"><p>Done</p></li>' +
        '<li data-type="taskItem" data-checked="false"><p>Todo</p></li>' +
        '</ul>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('- [x] Done')
    expect(md).toContain('- [ ] Todo')
  })
})

// ── Inline marks ──────────────────────────────────────────────────────────────

describe('tiptapDocToMarkdown — inline marks', () => {
  it('serializes bold', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><strong>bold</strong></p>'))).toBe('**bold**')
  })

  it('serializes italic', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><em>italic</em></p>'))).toBe('_italic_')
  })

  it('serializes strikethrough', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><s>struck</s></p>'))).toBe('~~struck~~')
  })

  it('serializes underline as HTML <u>', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><u>under</u></p>'))).toBe('<u>under</u>')
  })

  it('serializes inline code', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><code>snippet</code></p>'))).toBe('`snippet`')
  })

  it('serializes a hyperlink', () => {
    const doc = htmlToDoc('<p><a href="https://example.com">Example</a></p>')
    expect(tiptapDocToMarkdown(doc)).toBe('[Example](https://example.com)')
  })

  it('serializes subscript as HTML <sub>', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><sub>sub</sub></p>'))).toBe('<sub>sub</sub>')
  })

  it('serializes superscript as HTML <sup>', () => {
    expect(tiptapDocToMarkdown(htmlToDoc('<p><sup>sup</sup></p>'))).toBe('<sup>sup</sup>')
  })

  it('serializes combined bold + italic', () => {
    const md = tiptapDocToMarkdown(htmlToDoc('<p><strong><em>both</em></strong></p>'))
    expect(md).toContain('both')
    expect(md).toContain('**')
    expect(md).toContain('_')
  })

  it('does not produce redundant delimiters for adjacent same-mark runs', () => {
    // Two adjacent <strong> spans should merge into one **...** run.
    const md = tiptapDocToMarkdown(
      htmlToDoc('<p><strong>hello</strong><strong> world</strong></p>')
    )
    // Would be "**hello** **world**" (broken) if merging is absent.
    expect(md).not.toContain('****')
    expect(md).toContain('hello')
    expect(md).toContain('world')
  })

  it('escapes Markdown-special characters in plain text nodes', () => {
    // Text typed literally — should NOT become bold/italic when re-parsed.
    const doc = htmlToDoc('<p>not **bold** and _italic_</p>')
    expect(tiptapDocToMarkdown(doc)).toBe('not \\*\\*bold\\*\\* and \\_italic\\_')
  })
})

// ── Tables ────────────────────────────────────────────────────────────────────

describe('tiptapDocToMarkdown — tables', () => {
  it('serializes a table with a header row and a body row', () => {
    const doc = htmlToDoc(
      '<table><tbody>' +
        '<tr><th><p>Name</p></th><th><p>Age</p></th></tr>' +
        '<tr><td><p>Alice</p></td><td><p>30</p></td></tr>' +
        '</tbody></table>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('| Name | Age |')
    expect(md).toContain('| --- | --- |')
    expect(md).toContain('| Alice | 30 |')
  })

  it('escapes pipe characters inside table cells', () => {
    const doc = htmlToDoc(
      '<table><tbody>' +
        '<tr><th><p>Expr</p></th></tr>' +
        '<tr><td><p>a|b</p></td></tr>' +
        '</tbody></table>'
    )
    expect(tiptapDocToMarkdown(doc)).toContain('\\|')
  })
})
