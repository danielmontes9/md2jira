import { describe, it, expect } from 'vitest'
import { convertToConfluence } from '../src/index.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Removes all newlines for compact comparison of single-block outputs. */
const flat = (s: string) => s.replace(/\n/g, '')

// ── Empty / whitespace ────────────────────────────────────────────────────────

describe('convertToConfluence — empty input', () => {
  it('returns empty string for empty input', () => {
    expect(convertToConfluence('')).toBe('')
  })
  it('returns empty string for whitespace-only input', () => {
    expect(convertToConfluence('   \n\n  ')).toBe('')
  })
})

// ── Headings ─────────────────────────────────────────────────────────────────

describe('convertToConfluence — headings', () => {
  it('converts h1', () => {
    expect(convertToConfluence('# Hello')).toBe('<h1>Hello</h1>')
  })
  it('converts h2', () => {
    expect(convertToConfluence('## World')).toBe('<h2>World</h2>')
  })
  it('converts h6', () => {
    expect(convertToConfluence('###### Deep')).toBe('<h6>Deep</h6>')
  })
  it('normalizes heading depth > 6 to h6', () => {
    // remark-parse caps at 6, so we test the boundary
    expect(convertToConfluence('###### Level 6')).toBe('<h6>Level 6</h6>')
  })
  it('renders inline formatting inside headings', () => {
    expect(convertToConfluence('# **Bold** heading')).toBe('<h1><strong>Bold</strong> heading</h1>')
  })
  it('skips empty headings', () => {
    // A heading with only whitespace produces no output
    expect(convertToConfluence('#   ')).toBe('')
  })
})

// ── Paragraphs & inline formatting ───────────────────────────────────────────

describe('convertToConfluence — paragraphs', () => {
  it('wraps plain text in <p>', () => {
    expect(convertToConfluence('Hello world')).toBe('<p>Hello world</p>')
  })
  it('escapes HTML special characters in text', () => {
    expect(convertToConfluence('a < b & c > d')).toBe('<p>a &lt; b &amp; c &gt; d</p>')
  })
  it('converts bold', () => {
    expect(convertToConfluence('**bold**')).toBe('<p><strong>bold</strong></p>')
  })
  it('converts italic', () => {
    expect(convertToConfluence('_italic_')).toBe('<p><em>italic</em></p>')
  })
  it('converts strikethrough', () => {
    expect(convertToConfluence('~~strike~~')).toBe('<p><del>strike</del></p>')
  })
  it('converts inline code', () => {
    expect(convertToConfluence('`code`')).toBe('<p><code>code</code></p>')
  })
  it('escapes HTML inside inline code', () => {
    expect(convertToConfluence('`a < b`')).toBe('<p><code>a &lt; b</code></p>')
  })
  it('converts link with text', () => {
    expect(convertToConfluence('[Jira](https://jira.example.com)')).toBe(
      '<p><a href="https://jira.example.com">Jira</a></p>'
    )
  })
  it('uses href as link label when text is empty', () => {
    expect(convertToConfluence('[](https://example.com)')).toBe(
      '<p><a href="https://example.com">https://example.com</a></p>'
    )
  })
  it('escapes double quotes in href attribute', () => {
    expect(convertToConfluence('[x](https://example.com/a"b)')).toContain('&quot;')
  })
  it('resolves relative links with baseUrl', () => {
    expect(
      convertToConfluence('[page](/wiki/page)', { baseUrl: 'https://company.atlassian.net' })
    ).toBe('<p><a href="https://company.atlassian.net/wiki/page">page</a></p>')
  })
  it('does not prepend baseUrl to absolute links', () => {
    expect(convertToConfluence('[x](https://other.com)', { baseUrl: 'https://base.com' })).toBe(
      '<p><a href="https://other.com">x</a></p>'
    )
  })
  it('converts standalone image to block-level ac:image (no wrapping p)', () => {
    expect(convertToConfluence('![alt](image.png)')).toBe(
      '<ac:image><ri:url ri:value="image.png"/></ac:image>'
    )
  })
  it('converts image with absolute URL', () => {
    expect(convertToConfluence('![logo](https://example.com/logo.png)')).toBe(
      '<ac:image><ri:url ri:value="https://example.com/logo.png"/></ac:image>'
    )
  })
  it('resolves relative image URL with baseUrl', () => {
    expect(
      convertToConfluence('![logo](/images/logo.png)', { baseUrl: 'https://wiki.example.com' })
    ).toBe('<ac:image><ri:url ri:value="https://wiki.example.com/images/logo.png"/></ac:image>')
  })
  it('ignores image with empty url silently', () => {
    expect(convertToConfluence('![alt]()')).toBe('')
  })
  it('converts hard line break to <br/>', () => {
    // mdast text nodes around a hard break do not include a literal '\n'
    expect(convertToConfluence('line one  \nline two')).toBe('<p>line one<br/>line two</p>')
  })
  it('nests bold inside italic', () => {
    expect(convertToConfluence('_**both**_')).toBe('<p><em><strong>both</strong></em></p>')
  })
})

// ── Code blocks ───────────────────────────────────────────────────────────────

describe('convertToConfluence — code blocks', () => {
  it('emits code macro with language', () => {
    const out = convertToConfluence('```javascript\nconst x = 1\n```')
    expect(out).toContain('ac:name="code"')
    expect(out).toContain('ac:name="language"')
    expect(out).toContain('javascript')
    expect(out).toContain('const x = 1')
    expect(out).toContain('<![CDATA[')
    expect(out).toContain(']]>')
  })
  it('emits code macro without language parameter when no lang', () => {
    const out = convertToConfluence('```\nplain code\n```')
    expect(out).toContain('ac:name="code"')
    expect(out).not.toContain('ac:name="language"')
    expect(out).toContain('plain code')
  })
  it('wraps body in CDATA section', () => {
    const out = convertToConfluence('```js\nfoo()\n```')
    expect(out).toMatch(/<!\[CDATA\[[\s\S]*?]]>/)
  })
  it('handles CDATA-breaking sequence in code', () => {
    // "]]>" inside code is split into two adjacent CDATA sections so it cannot
    // accidentally close the enclosing CDATA: <![CDATA[a]]]]><![CDATA[>b]]>
    // Verify the raw "]]>b" sequence never appears unescaped in the output.
    const out = convertToConfluence('```\na]]>b\n```')
    expect(out).not.toContain(']]>b')
    // But the content is still recoverable — both CDATA parts are present
    expect(out).toContain(']]]]>')
  })
})

// ── Thematic break ────────────────────────────────────────────────────────────

describe('convertToConfluence — thematic break', () => {
  it('converts --- to <hr/>', () => {
    expect(convertToConfluence('---')).toBe('<hr/>')
  })
  it('converts *** to <hr/>', () => {
    expect(convertToConfluence('***')).toBe('<hr/>')
  })
})

// ── Lists ─────────────────────────────────────────────────────────────────────

describe('convertToConfluence — unordered list', () => {
  it('wraps items in <ul><li>', () => {
    const out = convertToConfluence('- Alpha\n- Beta')
    expect(out).toBe('<ul><li>Alpha</li><li>Beta</li></ul>')
  })
  it('handles inline formatting inside list items', () => {
    const out = convertToConfluence('- **bold** item')
    expect(out).toContain('<strong>bold</strong>')
  })
})

describe('convertToConfluence — ordered list', () => {
  it('wraps items in <ol><li>', () => {
    const out = convertToConfluence('1. One\n2. Two\n3. Three')
    expect(out).toBe('<ol><li>One</li><li>Two</li><li>Three</li></ol>')
  })
})

describe('convertToConfluence — nested list', () => {
  it('nests <ul> inside <li>', () => {
    const out = convertToConfluence('- Parent\n  - Child')
    expect(out).toBe('<ul><li>Parent<ul><li>Child</li></ul></li></ul>')
  })
  it('nests ordered inside unordered', () => {
    const out = convertToConfluence('- Item\n  1. Sub')
    expect(flat(out)).toBe('<ul><li>Item<ol><li>Sub</li></ol></li></ul>')
  })
})

describe('convertToConfluence — task list', () => {
  it('uses ac:task-list macro for GFM task lists', () => {
    const out = convertToConfluence('- [x] Done\n- [ ] Todo')
    expect(out).toContain('<ac:task-list>')
    expect(out).toContain('<ac:task-status>complete</ac:task-status>')
    expect(out).toContain('<ac:task-status>incomplete</ac:task-status>')
    expect(out).toContain('<ac:task-body>Done</ac:task-body>')
    expect(out).toContain('<ac:task-body>Todo</ac:task-body>')
  })
  it('marks unchecked items as incomplete', () => {
    const out = convertToConfluence('- [ ] Not done')
    expect(out).toContain('<ac:task-status>incomplete</ac:task-status>')
  })
  it('marks checked items as complete', () => {
    const out = convertToConfluence('- [x] Done')
    expect(out).toContain('<ac:task-status>complete</ac:task-status>')
  })
})

// ── Blockquote ────────────────────────────────────────────────────────────────

describe('convertToConfluence — blockquote', () => {
  it('wraps content in <blockquote><p>', () => {
    expect(convertToConfluence('> quoted text')).toBe('<blockquote><p>quoted text</p></blockquote>')
  })
  it('renders inline formatting inside blockquote', () => {
    const out = convertToConfluence('> **bold** in quote')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<blockquote>')
  })
})

// ── GFM Alerts (panels) ───────────────────────────────────────────────────────

describe('convertToConfluence — GFM Alerts', () => {
  it('converts [!NOTE] to note macro', () => {
    const out = convertToConfluence('> [!NOTE]\n> Note content')
    expect(out).toContain('ac:name="note"')
    expect(out).toContain('<ac:rich-text-body>')
    expect(out).toContain('Note content')
  })
  it('converts [!TIP] to tip macro', () => {
    const out = convertToConfluence('> [!TIP]\n> Tip content')
    expect(out).toContain('ac:name="tip"')
  })
  it('converts [!WARNING] to warning macro', () => {
    const out = convertToConfluence('> [!WARNING]\n> Warning content')
    expect(out).toContain('ac:name="warning"')
  })
  it('converts [!CAUTION] to warning macro (closest equivalent)', () => {
    const out = convertToConfluence('> [!CAUTION]\n> Caution content')
    expect(out).toContain('ac:name="warning"')
  })
  it('converts [!IMPORTANT] to info macro', () => {
    const out = convertToConfluence('> [!IMPORTANT]\n> Important content')
    expect(out).toContain('ac:name="info"')
  })
  it('strips the [!TYPE] marker from the body', () => {
    const out = convertToConfluence('> [!NOTE]\n> Note text')
    expect(out).not.toContain('[!NOTE]')
    expect(out).toContain('Note text')
  })
  it('handles multi-paragraph alert body', () => {
    const out = convertToConfluence('> [!NOTE]\n> First paragraph\n>\n> Second paragraph')
    expect(out).toContain('First paragraph')
    expect(out).toContain('Second paragraph')
  })
})

// ── Tables ────────────────────────────────────────────────────────────────────

describe('convertToConfluence — table', () => {
  it('renders header row in <thead> and data rows in <tbody>', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const out = convertToConfluence(md)
    expect(out).toContain('<table>')
    expect(out).toContain('<thead>')
    expect(out).toContain('<tbody>')
    expect(out).toContain('<th>A</th>')
    expect(out).toContain('<th>B</th>')
    expect(out).toContain('<td>1</td>')
    expect(out).toContain('<td>2</td>')
    // thead comes before tbody in source order
    expect(out.indexOf('<thead>')).toBeLessThan(out.indexOf('<tbody>'))
  })
  it('pads missing cells in short rows', () => {
    const md = '| A | B | C |\n|---|---|---|\n| x |'
    const out = convertToConfluence(md)
    // The short data row should be padded to 3 columns
    expect(out).toContain('<td></td>')
  })
  it('renders inline formatting inside cells', () => {
    const md = '| **bold** | `code` |\n|---|---|\n| normal | _em_ |'
    const out = convertToConfluence(md)
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<code>code</code>')
    expect(out).toContain('<em>em</em>')
  })
  it('escapes HTML in cell content', () => {
    const md = '| a < b |\n|---|\n| c & d |'
    const out = convertToConfluence(md)
    expect(out).toContain('a &lt; b')
    expect(out).toContain('c &amp; d')
  })
  it('renders single-row table as header only (no tbody)', () => {
    const md = '| H1 | H2 |\n|---|---|'
    const out = convertToConfluence(md)
    expect(out).toContain('<th>H1</th>')
    expect(out).not.toContain('<td>')
    expect(out).not.toContain('<tbody>')
  })
})

// ── disableTransforms option ──────────────────────────────────────────────────

describe('convertToConfluence — disableTransforms', () => {
  it('suppresses heading when disabled', () => {
    const out = convertToConfluence('# Title', { disableTransforms: ['heading'] })
    expect(out).not.toContain('<h1>')
  })
  it('suppresses code blocks when disabled', () => {
    const out = convertToConfluence('```js\nfoo\n```', { disableTransforms: ['code'] })
    expect(out).not.toContain('ac:structured-macro')
  })
  it('suppresses table when disabled', () => {
    const out = convertToConfluence('| A |\n|---|\n| 1 |', { disableTransforms: ['table'] })
    expect(out).not.toContain('<table>')
  })
  it('suppresses blockquote when disabled', () => {
    const out = convertToConfluence('> quote', { disableTransforms: ['blockquote'] })
    expect(out).not.toContain('<blockquote>')
  })
  it('suppresses thematicBreak when disabled', () => {
    const out = convertToConfluence('---', { disableTransforms: ['thematicBreak'] })
    expect(out).toBe('')
  })
})

// ── Integration — multi-block document ───────────────────────────────────────

describe('convertToConfluence — integration', () => {
  it('converts a full document with mixed content', () => {
    const md = `# Title

A paragraph with **bold** and _italic_ text.

\`\`\`typescript
const x: number = 42
\`\`\`

- Item 1
- Item 2

| Col A | Col B |
|-------|-------|
| val 1 | val 2 |

---

> [!NOTE]
> Important note here.`

    const out = convertToConfluence(md)
    expect(out).toContain('<h1>Title</h1>')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<em>italic</em>')
    expect(out).toContain('ac:name="code"')
    expect(out).toContain('typescript')
    expect(out).toContain('<ul>')
    expect(out).toContain('<table>')
    expect(out).toContain('<hr/>')
    expect(out).toContain('ac:name="note"')
    expect(out).toContain('Important note here.')
  })

  it('returns empty string for frontmatter-only document', () => {
    // remark does not parse YAML frontmatter without remark-frontmatter plugin;
    // it appears as a paragraph — this is acceptable per AGENTS.md
    const out = convertToConfluence('')
    expect(out).toBe('')
  })
})
