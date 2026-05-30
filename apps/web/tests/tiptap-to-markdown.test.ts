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
import Image from '@tiptap/extension-image'
import {
  tiptapDocToMarkdown,
  hasColorMarks,
  hasUnderlineMarks,
} from '../src/utils/tiptap-to-markdown.js'
import { AlignedTableCell, AlignedTableHeader } from '../src/hooks/useTiptapEditor.js'

/**
 * Base extensions shared between EXTENSIONS and ALIGNED_EXTENSIONS so adding
 * a new extension only requires one change rather than two.
 */
const BASE_EXTENSIONS = [
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
  TaskList,
  TaskItem.configure({ nested: true }),
  Image.configure({ inline: false }),
]

/** Extension set that mirrors useTiptapEditor so the PM schema is identical. */
const EXTENSIONS = [...BASE_EXTENSIONS, TableHeader, TableCell]

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

/**
 * Creates a ProseMirror document containing a single block-image node with
 * the given src/alt, bypassing TipTap's HTML parser which strips data: URIs.
 * Used to test the serializer's SAFE_SRC_RE logic directly.
 */
function makeImageDoc(src: string, alt: string) {
  const editor = new Editor({ extensions: EXTENSIONS, content: '' })
  const schema = editor.schema
  const imageNode = schema.nodes['image']!.create({ src, alt })
  const doc = schema.topNodeType.create(null, imageNode)
  editor.destroy()
  return doc
}

/**
 * Creates a ProseMirror document containing a paragraph with a single link-
 * marked text node, bypassing TipTap's HTML parser which strips unsafe hrefs.
 * Used to test the serializer's link-mark sanitization logic directly.
 */
function makeLinkDoc(href: string, text: string) {
  const editor = new Editor({ extensions: EXTENSIONS, content: '' })
  const schema = editor.schema
  const linkMark = schema.marks['link']!.create({ href })
  const textNode = schema.text(text, [linkMark])
  const para = schema.nodes['paragraph']!.create(null, textNode)
  const doc = schema.topNodeType.create(null, para)
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

describe('tiptapDocToMarkdown — images', () => {
  it('serializes a standalone image', () => {
    const doc = htmlToDoc('<img src="https://example.com/img.png" alt="Alt text">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Alt text](https://example.com/img.png)')
  })

  it('serializes an image with a title', () => {
    const doc = htmlToDoc('<img src="https://example.com/img.png" alt="Photo" title="My title">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Photo](https://example.com/img.png "My title")')
  })

  it('serializes an image with empty alt', () => {
    const doc = htmlToDoc('<img src="https://example.com/img.png" alt="">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![](https://example.com/img.png)')
  })

  it('produces empty src for an image with no src attribute', () => {
    // src='' is valid — ![alt]() — and must not become ![alt](#).
    const doc = htmlToDoc('<img src="" alt="no src">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![no src]()')
  })

  it('serializes an image inside a figure wrapper (ADF mediaSingle pattern)', () => {
    const doc = htmlToDoc(
      '<figure class="adf-media-single"><img src="https://example.com/banner.jpg" alt="Banner"></figure>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Banner](https://example.com/banner.jpg)')
  })

  it('escapes double quotes inside image title', () => {
    // A title containing " must be escaped to prevent malformed Markdown output.
    const doc = htmlToDoc(
      '<img src="https://example.com/img.png" alt="Photo" title="say &quot;hello&quot;">'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Photo](https://example.com/img.png "say \\"hello\\"")')
  })

  it('escapes ] inside image alt to prevent broken Markdown link syntax', () => {
    // An unescaped ] would close the ![...] span prematurely.
    const doc = htmlToDoc('<img src="https://example.com/img.png" alt="click]here">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![click\\]here](https://example.com/img.png)')
  })

  it('replaces unsafe src scheme with # in serialized Markdown', () => {
    // javascript: URLs must not be propagated into the exported Markdown.
    // TipTap normalises javascript:alert(1) to about:blank on some builds;
    // we check both: either it was replaced with # or it is no longer javascript:
    const doc = htmlToDoc('<img src="javascript:alert(1)" alt="xss">')
    const md = tiptapDocToMarkdown(doc)
    const srcMatch = md.match(/!\[xss\]\(([^)]+)\)/)
    expect(srcMatch).not.toBeNull()
    const serializedSrc = srcMatch![1]
    expect(serializedSrc).not.toMatch(/^javascript:/i)
  })

  it('preserves root-relative src paths unchanged', () => {
    // /images/banner.jpg is a valid relative URL with no scheme risk.
    const doc = htmlToDoc('<img src="/images/banner.jpg" alt="Banner">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Banner](/images/banner.jpg)')
  })

  it('preserves ./-relative src paths unchanged', () => {
    const doc = htmlToDoc('<img src="./assets/photo.png" alt="Photo">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Photo](./assets/photo.png)')
  })

  it('preserves ../-relative src paths unchanged', () => {
    const doc = htmlToDoc('<img src="../images/photo.png" alt="Photo">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('![Photo](../images/photo.png)')
  })

  it('preserves uppercase-scheme https URLs unchanged', () => {
    // RFC 3986 allows scheme in any case; HTTPS:// must not be sanitized to #.
    // TipTap's HTML parser may normalize the scheme to lowercase — both outcomes
    // are acceptable as long as the URL is not replaced with '#'.
    const doc = htmlToDoc('<img src="HTTPS://example.com/img.png" alt="Alt">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toMatch(/!\[Alt\]\(https?:\/\/example\.com\/img\.png\)/i)
  })

  it('blocks a protocol-relative src (//host)', () => {
    // //evil.com inherits the page protocol — cannot be validated statically.
    // TipTap may normalize //host to https://host during HTML parsing; either
    // way the URL must not appear verbatim as //evil.com in the output.
    const doc = htmlToDoc('<img src="//evil.com/img.png" alt="evil">')
    const md = tiptapDocToMarkdown(doc)
    expect(md).not.toMatch(/!\[evil\]\(\/\//)
  })

  it('preserves a safe data:image/png URI unchanged', () => {
    // htmlToDoc strips data: URIs during HTML parsing; create the node directly
    // so we can test the serializer's SAFE_SRC_RE allowlist for raster subtypes.
    const doc = makeImageDoc('data:image/png;base64,abc', 'inline')
    const md = tiptapDocToMarkdown(doc)
    // The full URI must be preserved — not just the MIME type prefix.
    expect(md).toContain('data:image/png;base64,abc')
    expect(md).not.toContain('![inline](#)')
  })

  it('blocks data:image/svg+xml URI (SVG can embed scripts)', () => {
    // SVG can contain <script> — only raster subtypes are permitted.
    // Create the node directly because htmlToDoc strips data: URIs.
    const doc = makeImageDoc('data:image/svg+xml;base64,PHN2Zyc+', 'svg')
    const md = tiptapDocToMarkdown(doc)
    expect(md).not.toMatch(/data:image\/svg/i)
    // The src must have been replaced with '#' (unsafe scheme, non-empty src).
    expect(md).toMatch(/!\[svg\]\(#\)/)
  })

  it('blocks a data: URI whose subtype shares a prefix with a safe subtype (prefix bypass regression)', () => {
    // SAFE_SRC_RE uses (?=[;,]) after the subtype group to prevent "pngEVIL"
    // from matching via the "png" prefix. This test guards against accidentally
    // removing that lookahead during future regex edits.
    // Create the node directly because htmlToDoc strips data: URIs.
    const doc = makeImageDoc('data:image/pngEVIL;base64,abc', 'bypass')
    const md = tiptapDocToMarkdown(doc)
    expect(md).not.toMatch(/data:image\/pngEVIL/i)
    // The malicious src must have been replaced with '#' (unsafe, non-empty src).
    expect(md).toMatch(/!\[bypass\]\(#\)/)
  })
})

// ── Link mark — sanitization ─────────────────────────────────────────────────

describe('tiptapDocToMarkdown — link sanitization', () => {
  it('serializes a standard https link', () => {
    const doc = htmlToDoc('<p><a href="https://example.com">Example</a></p>')
    expect(tiptapDocToMarkdown(doc)).toBe('[Example](https://example.com)')
  })

  it('replaces a javascript: href with #', () => {
    // OWASP A03: javascript: links must not appear in the exported Markdown.
    // TipTap's HTML parser strips the link mark for unsafe hrefs; create the
    // node directly so the serializer's SAFE_SRC_RE guard is exercised.
    const doc = makeLinkDoc('javascript:alert(1)', 'click')
    const md = tiptapDocToMarkdown(doc)
    expect(md).not.toMatch(/javascript:/i)
    expect(md).toContain('[click]')
  })

  it('preserves a root-relative href unchanged', () => {
    const doc = htmlToDoc('<p><a href="/docs/page">/docs/page</a></p>')
    expect(tiptapDocToMarkdown(doc)).toContain('[/docs/page](/docs/page)')
  })

  it('preserves a fragment-only href (#anchor) unchanged', () => {
    // #section is a common in-page anchor — must not be replaced with a bare #.
    const doc = htmlToDoc('<p><a href="#section">Back to top</a></p>')
    expect(tiptapDocToMarkdown(doc)).toContain('[Back to top](#section)')
  })

  it('preserves a mailto: href unchanged', () => {
    const doc = htmlToDoc('<p><a href="mailto:team@example.com">Contact</a></p>')
    expect(tiptapDocToMarkdown(doc)).toContain('[Contact](mailto:team@example.com)')
  })

  it('escapes double quotes inside a link title', () => {
    const doc = htmlToDoc(
      '<p><a href="https://example.com" title="say &quot;hi&quot;">link</a></p>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('[link](https://example.com "say \\"hi\\"")')
  })

  it('preserves a tel: href unchanged', () => {
    const doc = htmlToDoc('<p><a href="tel:+34600000000">Call us</a></p>')
    expect(tiptapDocToMarkdown(doc)).toContain('[Call us](tel:+34600000000)')
  })

  it('produces an empty href for a link with no href attribute', () => {
    // href='' is valid CommonMark — [text]() — and must not become [text](#).
    // TipTap's HTML parser strips empty-href link marks; create the node
    // directly so the serializer's falsy-href path is exercised.
    const doc = makeLinkDoc('', 'empty')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('[empty]()')
  })

  it('blocks a protocol-relative href (//host) by replacing with #', () => {
    // //evil.com inherits the page protocol — cannot be validated statically.
    const doc = htmlToDoc('<p><a href="//evil.com/page">evil</a></p>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).not.toContain('//evil.com')
    expect(md).toContain('[evil]')
  })
})

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

  it('joins multiple paragraphs inside a cell with <br>', () => {
    const doc = htmlToDoc(
      '<table><tbody>' +
        '<tr><th><p>Notes</p></th></tr>' +
        '<tr><td><p>Line one</p><p>Line two</p></td></tr>' +
        '</tbody></table>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('Line one<br>Line two')
    // Must remain on a single Markdown table row (no unescaped newline)
    const lines = md.split('\n').filter((l) => l.startsWith('|'))
    expect(lines).toHaveLength(3) // header | separator | body
  })

  it('preserves inline formatting inside table cells', () => {
    const doc = htmlToDoc(
      '<table><tbody>' +
        '<tr><th><p>Col</p></th></tr>' +
        '<tr><td><p><strong>bold</strong> and <em>italic</em></p></td></tr>' +
        '</tbody></table>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('**bold**')
    expect(md).toContain('_italic_')
  })

  it('pads rows with fewer cells than the header row', () => {
    const doc = htmlToDoc(
      '<table><tbody>' +
        '<tr><th><p>A</p></th><th><p>B</p></th><th><p>C</p></th></tr>' +
        '<tr><td><p>1</p></td></tr>' +
        '</tbody></table>'
    )
    const md = tiptapDocToMarkdown(doc)
    // Body row must be padded to 3 columns
    const bodyLine = md.split('\n').find((l) => l.includes('| 1 |'))
    expect(bodyLine).toBeDefined()
    expect(bodyLine!.match(/\|/g)?.length).toBe(4) // 3 cells = 4 pipes
  })
})

// ── Code block escape regression ──────────────────────────────────────────────

describe('tiptapDocToMarkdown — code block escape safety', () => {
  it('does not escape Markdown-special characters inside code blocks', () => {
    // Content inside ```...``` must come through verbatim — no backslash escaping.
    const doc = htmlToDoc(
      '<pre><code class="language-js">if (a *b* && _c_) { return `x` }</code></pre>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('if (a *b* && _c_) { return `x` }')
    expect(md).not.toContain('\\*')
    expect(md).not.toContain('\\_')
    // backtick inside a fenced code block is safe — no escaping needed
    expect(md).not.toContain('\\`')
  })

  it('serializes multiple lines inside a code block without modification', () => {
    const doc = htmlToDoc(
      '<pre><code class="language-ts">const x: string = "hello"\nreturn x</code></pre>'
    )
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('const x: string = "hello"')
    expect(md).toContain('return x')
    expect(md).not.toContain('\\"')
  })
})

// ── Mark escaping roundtrip ───────────────────────────────────────────────────

describe('tiptapDocToMarkdown — special chars inside marks', () => {
  it('escapes underscore inside bold text so it does not create bold+italic on round-trip', () => {
    // Bold text that contains an underscore: **foo_bar** would re-parse as bold+italic.
    // Expected: **foo\_bar**
    const doc = htmlToDoc('<p><strong>foo_bar</strong></p>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toBe('**foo\\_bar**')
  })

  it('escapes asterisk inside italic text so it does not create unexpected bold on round-trip', () => {
    const doc = htmlToDoc('<p><em>hello * world</em></p>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toBe('_hello \\* world_')
  })

  it('does NOT escape special chars inside inline code (raw content)', () => {
    // Inside `...` backtick spans the text is raw — no backslash escaping.
    const doc = htmlToDoc('<p><code>*raw* _text_</code></p>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toBe('`*raw* _text_`')
    expect(md).not.toContain('\\*')
    expect(md).not.toContain('\\_')
  })

  it('escapes backtick inside bold text', () => {
    const doc = htmlToDoc('<p><strong>use `backtick`</strong></p>')
    const md = tiptapDocToMarkdown(doc)
    expect(md).toContain('\\`')
  })
})

// ── Table column alignment ──────────────────────────────────────────────────
// AlignedTableCell and AlignedTableHeader are imported from useTiptapEditor so
// the test schema is guaranteed to match production — no local copy to drift.

const ALIGNED_EXTENSIONS = [...BASE_EXTENSIONS, AlignedTableHeader, AlignedTableCell]

function htmlToAlignedDoc(html: string) {
  const editor = new Editor({ extensions: ALIGNED_EXTENSIONS, content: html })
  const doc = editor.state.doc
  editor.destroy()
  return doc
}

describe('tiptapDocToMarkdown — table column alignment', () => {
  it('outputs :---: separator for a center-aligned column', () => {
    const doc = htmlToAlignedDoc(
      '<table><tbody>' +
        '<tr><th style="text-align: center"><p>Center</p></th><th><p>Left</p></th></tr>' +
        '<tr><td><p>a</p></td><td><p>b</p></td></tr>' +
        '</tbody></table>'
    )
    expect(tiptapDocToMarkdown(doc)).toContain('| :---: | --- |')
  })

  it('outputs ---: separator for a right-aligned column', () => {
    const doc = htmlToAlignedDoc(
      '<table><tbody>' +
        '<tr><th style="text-align: right"><p>Right</p></th></tr>' +
        '<tr><td><p>val</p></td></tr>' +
        '</tbody></table>'
    )
    expect(tiptapDocToMarkdown(doc)).toContain('| ---: |')
  })

  it('outputs --- for columns with no alignment (default)', () => {
    const doc = htmlToAlignedDoc(
      '<table><tbody>' +
        '<tr><th><p>None</p></th></tr>' +
        '<tr><td><p>val</p></td></tr>' +
        '</tbody></table>'
    )
    expect(tiptapDocToMarkdown(doc)).toContain('| --- |')
  })

  it('handles a mix of center, right, and unaligned columns', () => {
    const doc = htmlToAlignedDoc(
      '<table><tbody>' +
        '<tr>' +
        '<th style="text-align: center"><p>C</p></th>' +
        '<th style="text-align: right"><p>R</p></th>' +
        '<th><p>L</p></th>' +
        '</tr>' +
        '<tr><td><p>1</p></td><td><p>2</p></td><td><p>3</p></td></tr>' +
        '</tbody></table>'
    )
    expect(tiptapDocToMarkdown(doc)).toContain('| :---: | ---: | --- |')
  })
})

// ── hasColorMarks ─────────────────────────────────────────────────────────────

describe('hasColorMarks', () => {
  it('returns false for a plain paragraph without any color', () => {
    expect(hasColorMarks(htmlToDoc('<p>Plain text</p>'))).toBe(false)
  })

  it('returns false for bold/italic text with no color mark', () => {
    expect(hasColorMarks(htmlToDoc('<p><strong>bold</strong> <em>italic</em></p>'))).toBe(false)
  })

  it('returns true when text has a textStyle color mark', () => {
    expect(hasColorMarks(htmlToDoc('<p><span style="color: #ff0000">red text</span></p>'))).toBe(
      true
    )
  })

  it('returns true when color appears only in part of the paragraph', () => {
    expect(
      hasColorMarks(htmlToDoc('<p>normal <span style="color: #0000ff">blue</span> normal</p>'))
    ).toBe(true)
  })

  it('returns false for an empty document', () => {
    expect(hasColorMarks(htmlToDoc(''))).toBe(false)
  })
})

// ── hasUnderlineMarks ────────────────────────────────────────────────────────────

describe('hasUnderlineMarks', () => {
  it('returns false for a plain paragraph without any underline', () => {
    expect(hasUnderlineMarks(htmlToDoc('<p>Plain text</p>'))).toBe(false)
  })

  it('returns false for bold and italic text with no underline mark', () => {
    expect(hasUnderlineMarks(htmlToDoc('<p><strong>bold</strong> <em>italic</em></p>'))).toBe(false)
  })

  it('returns true when text has an underline mark', () => {
    expect(hasUnderlineMarks(htmlToDoc('<p><u>underlined</u></p>'))).toBe(true)
  })

  it('returns true when underline appears only in part of the paragraph', () => {
    expect(hasUnderlineMarks(htmlToDoc('<p>normal <u>underlined</u> normal</p>'))).toBe(true)
  })

  it('returns false for an empty document', () => {
    expect(hasUnderlineMarks(htmlToDoc(''))).toBe(false)
  })

  it('returns false when only a textStyle color mark is present (no underline)', () => {
    expect(hasUnderlineMarks(htmlToDoc('<p><span style="color: red">colored</span></p>'))).toBe(
      false
    )
  })
})

// ── applyMark — CSS injection guard (textStyle color) ────────────────────────
// The applyMark 'textStyle' branch validates the color string with a
// safe-characters regex before injecting it into `<span style="color:...">`.
// These tests construct ProseMirror documents directly via the schema so that
// arbitrary color strings (including malicious ones) can be placed in mark
// attrs without going through HTML/CSS parsing, which would normalise them.

function buildDocWithColor(color: string) {
  const editor = new Editor({ extensions: EXTENSIONS, content: '' })
  const schema = editor.state.schema
  const textStyleMark = schema.marks['textStyle']!
  const coloredText = schema.text('hello', [textStyleMark.create({ color })])
  const para = schema.nodes['paragraph']!.create(null, coloredText)
  const doc = schema.nodes['doc']!.create(null, para)
  editor.destroy()
  return doc
}

describe('applyMark — CSS injection guard (textStyle color)', () => {
  it('renders a valid hex color as a <span style="color:..."> element', () => {
    const md = tiptapDocToMarkdown(buildDocWithColor('#ff0000'))
    expect(md).toContain('<span style="color:#ff0000">')
    expect(md).toContain('hello')
  })

  it('renders a valid rgb() color as a <span style="color:..."> element', () => {
    const md = tiptapDocToMarkdown(buildDocWithColor('rgb(255, 0, 0)'))
    expect(md).toContain('<span style="color:rgb(255, 0, 0)">')
  })

  it('renders a named CSS color as a <span style="color:..."> element', () => {
    const md = tiptapDocToMarkdown(buildDocWithColor('red'))
    expect(md).toContain('<span style="color:red">')
  })

  it('strips script-tag injection in color — OWASP A03 CSS injection prevention', () => {
    // "</style><script>" contains "<", "/" and ">" which are outside the safe charset.
    const md = tiptapDocToMarkdown(buildDocWithColor('</style><script>alert(1)</script>'))
    expect(md).not.toContain('<span')
    expect(md).not.toContain('<script>')
    expect(md).toBe('hello')
  })

  it('strips semicolon-separated property injection in color', () => {
    // "red; background: url(x)" — ";" and ":" are outside the safe charset.
    const md = tiptapDocToMarkdown(buildDocWithColor('red; background: url(x)'))
    expect(md).not.toContain('<span')
    expect(md).toBe('hello')
  })

  it('strips newline injection in color', () => {
    // A newline character is outside the safe charset.
    const md = tiptapDocToMarkdown(buildDocWithColor('red\nContent-Type: text/html'))
    expect(md).not.toContain('<span')
    expect(md).toBe('hello')
  })

  it('returns plain text when color is empty string', () => {
    // Empty color → early "if (!color) return text" guard in applyMark.
    const md = tiptapDocToMarkdown(buildDocWithColor(''))
    expect(md).not.toContain('<span')
    expect(md).toBe('hello')
  })
})
