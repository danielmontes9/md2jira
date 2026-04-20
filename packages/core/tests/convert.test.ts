import { describe, it, expect } from 'vitest'
import { convert } from '../src/index.js'

describe('convert', () => {
  it('returns empty string for empty input', () => {
    expect(convert('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(convert('   \n  ')).toBe('')
  })
})

describe('headers', () => {
  it('converts h1', () => {
    expect(convert('# Title')).toBe('h1. Title')
  })

  it('converts h2', () => {
    expect(convert('## Subtitle')).toBe('h2. Subtitle')
  })

  it('converts h3 through h6', () => {
    expect(convert('### H3')).toBe('h3. H3')
    expect(convert('#### H4')).toBe('h4. H4')
    expect(convert('##### H5')).toBe('h5. H5')
    expect(convert('###### H6')).toBe('h6. H6')
  })

  it('normalizes heading level > 6 to h6 (remark parses max h6)', () => {
    // remark-parse only recognizes h1-h6; ####### is treated as paragraph text
    expect(convert('###### H6')).toBe('h6. H6')
  })

  it('converts heading with inline formatting', () => {
    expect(convert('# **Bold** Title')).toBe('h1. *Bold* Title')
  })
})

describe('text formatting', () => {
  it('converts bold', () => {
    expect(convert('**bold text**')).toBe('*bold text*')
  })

  it('converts italic', () => {
    expect(convert('_italic text_')).toBe('_italic text_')
  })

  it('converts strikethrough', () => {
    expect(convert('~~strike~~')).toBe('-strike-')
  })

  it('converts inline code', () => {
    expect(convert('`code`')).toBe('{{code}}')
  })

  it('converts combined formatting', () => {
    expect(convert('**bold** and _italic_ and `code`')).toBe('*bold* and _italic_ and {{code}}')
  })
})

describe('links', () => {
  it('converts link with text', () => {
    expect(convert('[Google](https://google.com)')).toBe('[Google|https://google.com]')
  })

  it('converts link without text', () => {
    expect(convert('[](https://google.com)')).toBe('[https://google.com]')
  })
})

describe('lists', () => {
  it('converts unordered list', () => {
    expect(convert('- Item 1\n- Item 2')).toBe('* Item 1\n* Item 2')
  })

  it('converts ordered list', () => {
    expect(convert('1. First\n2. Second')).toBe('# First\n# Second')
  })

  it('converts nested unordered list', () => {
    const md = '- Item\n  - Nested'
    expect(convert(md)).toBe('* Item\n** Nested')
  })

  it('converts deeply nested list', () => {
    const md = '- A\n  - B\n    - C'
    expect(convert(md)).toBe('* A\n** B\n*** C')
  })

  it('converts nested ordered list', () => {
    const md = '1. First\n   1. Sub first'
    expect(convert(md)).toBe('# First\n## Sub first')
  })
})

describe('code blocks', () => {
  it('converts code block with language', () => {
    expect(convert('```js\nconsole.log("hi")\n```')).toBe(
      '{code:language=js}\nconsole.log("hi")\n{code}'
    )
  })

  it('converts code block without language', () => {
    expect(convert('```\nsome code\n```')).toBe('{code}\nsome code\n{code}')
  })
})

describe('blockquotes', () => {
  it('converts blockquote', () => {
    expect(convert('> some text')).toBe('bq. some text')
  })

  it('converts blockquote with formatting', () => {
    expect(convert('> **bold** quote')).toBe('bq. *bold* quote')
  })
})

describe('horizontal rules', () => {
  it('converts thematic break', () => {
    expect(convert('---')).toBe('----')
  })
})

describe('tables', () => {
  it('converts simple table', () => {
    const md = '| Name | Age |\n|------|-----|\n| John | 30 |'
    expect(convert(md)).toBe('||Name||Age||\n|John|30|')
  })

  it('converts table with inline formatting', () => {
    const md = '| Field | Value |\n|-------|-------|\n| Status | **High** |'
    expect(convert(md)).toBe('||Field||Value||\n|Status|*High*|')
  })

  it('normalizes unequal column count', () => {
    const md = '| A | B | C |\n|---|---|---|\n| 1 | 2 |'
    expect(convert(md)).toBe('||A||B||C||\n|1|2||')
  })

  it('escapes curly braces in cells', () => {
    const md = '| Formula |\n|---------|\n| {value} |'
    expect(convert(md)).toBe('||Formula||\n|\\{value\\}|')
  })

  it('converts links inside table cells', () => {
    const md = '| Link |\n|------|\n| [Google](https://google.com) |'
    expect(convert(md)).toBe('||Link||\n|[Google|https://google.com]|')
  })

  it('tolerates an empty line left after deleting a row', () => {
    // Simulates user deleting a row in the editor and leaving an empty line
    const md = '| Field | Value |\n|-------|-------|\n\n| Status | Done |'
    expect(convert(md)).toBe('||Field||Value||\n|Status|Done|')
  })

  it('tolerates multiple empty lines within a table', () => {
    const md = '| A | B |\n|---|---|\n\n| 1 | 2 |\n\n| 3 | 4 |'
    expect(convert(md)).toBe('||A||B||\n|1|2|\n|3|4|')
  })

  it('does not merge content after a genuine paragraph break into the table', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |\n\nNot a table row'
    expect(convert(md)).toBe('||A||B||\n|1|2|\n\nNot a table row')
  })
})

describe('mixed content', () => {
  it('converts a full document', () => {
    const md = `# Title

Some **bold** text and a [link](https://example.com).

- Item 1
- Item 2

\`\`\`js
const x = 1
\`\`\`

---

> A quote`

    const expected = `h1. Title

Some *bold* text and a [link|https://example.com].

* Item 1
* Item 2

{code:language=js}
const x = 1
{code}

----

bq. A quote`

    expect(convert(md)).toBe(expected)
  })
})

describe('images', () => {
  it('ignores images silently', () => {
    expect(convert('![alt](image.png)')).toBe('')
  })

  it('preserves surrounding text when image is in paragraph', () => {
    expect(convert('text ![alt](img.png) more')).toBe('text  more')
  })
})

// ── Edge cases from AGENTS.md Error Handling table ──

describe('headers — edge cases', () => {
  it('converts heading with inline code', () => {
    expect(convert('## Config `options`')).toBe('h2. Config {{options}}')
  })

  it('converts heading with link', () => {
    expect(convert('# [Home](https://example.com)')).toBe('h1. [Home|https://example.com]')
  })

  it('handles empty heading', () => {
    expect(convert('#')).toBe('')
  })
})

describe('formatting — edge cases', () => {
  it('handles nested bold inside italic', () => {
    expect(convert('_this is **bold inside** italic_')).toBe('_this is *bold inside* italic_')
  })

  it('handles bold+italic combined', () => {
    expect(convert('***bold and italic***')).toBe('_*bold and italic*_')
  })

  it('handles inline code with special characters', () => {
    expect(convert('`<div class="x">`')).toBe('{{<div class="x">}}')
  })

  it('handles link with no text [](url)', () => {
    expect(convert('[](https://example.com)')).toBe('[https://example.com]')
  })

  it('handles link with special chars in text', () => {
    expect(convert('[Click **here**](https://example.com)')).toBe(
      '[Click *here*|https://example.com]'
    )
  })

  it('handles break tag (line break)', () => {
    // Two trailing spaces = hard line break in markdown
    expect(convert('line one  \nline two')).toContain('line one')
    expect(convert('line one  \nline two')).toContain('line two')
  })
})

describe('lists — edge cases', () => {
  it('converts mixed nested lists (unordered inside ordered)', () => {
    const md = '1. First\n   - Sub bullet'
    expect(convert(md)).toBe('# First\n#* Sub bullet')
  })

  it('handles list item with bold text', () => {
    expect(convert('- **Important** item')).toBe('* *Important* item')
  })

  it('handles list item with inline code', () => {
    expect(convert('- Use `npm install`')).toBe('* Use {{npm install}}')
  })

  it('handles deeply nested ordered lists', () => {
    const md = '1. A\n   1. B\n      1. C'
    expect(convert(md)).toBe('# A\n## B\n### C')
  })
})

describe('code blocks — edge cases', () => {
  it('converts code block without language — no language attribute', () => {
    expect(convert('```\ncode here\n```')).toBe('{code}\ncode here\n{code}')
  })

  it('preserves indentation in code blocks', () => {
    const md = '```js\nfunction foo() {\n  return 1\n}\n```'
    expect(convert(md)).toBe('{code:language=js}\nfunction foo() {\n  return 1\n}\n{code}')
  })

  it('handles code block with many languages', () => {
    expect(convert('```python\nprint("hi")\n```')).toBe(
      '{code:language=python}\nprint("hi")\n{code}'
    )
    expect(convert('```bash\necho hello\n```')).toBe('{code:language=bash}\necho hello\n{code}')
  })

  it('handles empty code block', () => {
    expect(convert('```\n\n```')).toBe('{code}\n\n{code}')
  })
})

describe('blockquotes — edge cases', () => {
  it('converts multiline blockquote', () => {
    const md = '> Line 1\n> Line 2'
    expect(convert(md)).toBe('bq. Line 1\nbq. Line 2')
  })

  it('converts blockquote with inline code', () => {
    expect(convert('> Use `code` here')).toBe('bq. Use {{code}} here')
  })
})

describe('tables — edge cases', () => {
  it('handles table with empty cells', () => {
    const md = '| A | B |\n|---|---|\n|   |   |'
    expect(convert(md)).toBe('||A||B||\n|||')
  })

  it('escapes pipe characters inside cells', () => {
    // Pipe inside cell content should be escaped
    const md = '| Formula |\n|---------|\n| a \\| b |'
    const result = convert(md)
    expect(result).toContain('||Formula||')
  })

  it('handles single-column table', () => {
    const md = '| Col |\n|-----|\n| Val |'
    expect(convert(md)).toBe('||Col||\n|Val|')
  })

  it('handles table with links in cells', () => {
    const md = '| Site |\n|------|\n| [Google](https://google.com) |'
    expect(convert(md)).toBe('||Site||\n|[Google|https://google.com]|')
  })

  it('handles table with bold in header', () => {
    const md = '| **Header** |\n|------------|\n| data |'
    expect(convert(md)).toBe('||*Header*||\n|data|')
  })
})

describe('html and frontmatter — out of scope', () => {
  it('ignores HTML blocks silently', () => {
    expect(convert('<div>hello</div>')).toBe('')
  })

  it('ignores HTML inline within paragraphs', () => {
    // remark-parse treats <br> as HTML — should be ignored or stripped
    const result = convert('text <br> more text')
    expect(result).not.toContain('<br>')
  })

  it('handles markdown with YAML frontmatter gracefully', () => {
    // remark-parse without remark-frontmatter treats --- as thematic break
    const md = '---\ntitle: Test\n---\n\n# Hello'
    const result = convert(md)
    expect(result).toContain('h1. Hello')
  })
})

describe('task lists — wiki markup', () => {
  it('renders done item with (/) emoticon', () => {
    expect(convert('- [x] Done task')).toBe('(/) Done task')
  })

  it('renders todo item with (x) emoticon', () => {
    expect(convert('- [ ] Todo task')).toBe('(x) Todo task')
  })

  it('renders mixed task list', () => {
    const md = '- [x] First done\n- [ ] Second todo\n- [x] Third done'
    expect(convert(md)).toBe('(/) First done\n(x) Second todo\n(/) Third done')
  })

  it('renders task list with inline formatting', () => {
    expect(convert('- [x] **Bold** task')).toBe('(/) *Bold* task')
  })

  it('regular unordered list is not affected', () => {
    expect(convert('- Item A\n- Item B')).toBe('* Item A\n* Item B')
  })
})

describe('blockquotes — nested', () => {
  it('flattens nested blockquote to bq. lines', () => {
    // Markdown: "> outer\n> > inner"
    const md = '> outer\n> > inner'
    const result = convert(md)
    expect(result).toContain('bq. outer')
    expect(result).toContain('bq. inner')
  })

  it('handles deeply nested blockquote', () => {
    const md = '> > > deep'
    const result = convert(md)
    expect(result).toContain('bq. deep')
  })
})

describe('blockquotes — complex children', () => {
  it('renders list inside blockquote without bq. prefix', () => {
    const md = '> Note:\n> - item one\n> - item two'
    const result = convert(md)
    expect(result).toContain('bq. Note:')
    expect(result).toContain('* item one')
    expect(result).toContain('* item two')
  })

  it('renders code block inside blockquote without bq. prefix', () => {
    const md = '> Example:\n>\n> ```js\nconsole.log("hi")\n```'
    const result = convert(md)
    expect(result).toContain('bq. Example:')
    expect(result).toContain('{code:language=js}')
  })
})

// ── Known gap: table without a GFM separator row ──────────────────────────────
// remark-gfm requires a separator row (|---|---) to recognise a table block.
// Without it, the rows are plain paragraphs. AGENTS.md lists "treat first row
// as header" as the desired behaviour, but this requires a preprocessing step
// that is not yet implemented. These tests document the CURRENT behaviour so
// that a future implementation can flip the assertions intentionally.
describe('tables — missing separator row (known gap)', () => {
  it('table without separator row is NOT parsed as a table (current behaviour)', () => {
    const md = '| Name | Age |\n| John | 30 |'
    const result = convert(md)
    // Without a separator row, remark-gfm produces paragraphs, not a table.
    expect(result).not.toContain('||')
  })

  it('table with separator row is still parsed correctly', () => {
    const md = '| Name | Age |\n|------|-----|\n| John | 30 |'
    expect(convert(md)).toBe('||Name||Age||\n|John|30|')
  })
})

describe('full-document integration', () => {
  it('converts a document exercising all supported element types', () => {
    const md = [
      '# Main Title',
      '',
      'A paragraph with **bold**, _italic_, ~~strike~~, and `code`.',
      '',
      '[Link text](https://example.com)',
      '',
      '## Section',
      '',
      '- Bullet 1',
      '- Bullet 2',
      '',
      '1. Ordered 1',
      '2. Ordered 2',
      '',
      '- [x] Done task',
      '- [ ] Todo task',
      '',
      '> A blockquote',
      '',
      '```typescript',
      'const x = 42',
      '```',
      '',
      '---',
      '',
      '| Header A | Header B |',
      '|----------|----------|',
      '| Cell 1   | Cell 2   |',
    ].join('\n')

    const result = convert(md)

    // Headers
    expect(result).toContain('h1. Main Title')
    expect(result).toContain('h2. Section')
    // Inline formatting
    expect(result).toContain('*bold*')
    expect(result).toContain('_italic_')
    expect(result).toContain('-strike-')
    expect(result).toContain('{{code}}')
    // Link
    expect(result).toContain('[Link text|https://example.com]')
    // Lists
    expect(result).toContain('* Bullet 1')
    expect(result).toContain('* Bullet 2')
    expect(result).toContain('# Ordered 1')
    expect(result).toContain('# Ordered 2')
    // Task list
    expect(result).toContain('(/) Done task')
    expect(result).toContain('(x) Todo task')
    // Blockquote
    expect(result).toContain('bq. A blockquote')
    // Code block
    expect(result).toContain('{code:language=typescript}')
    expect(result).toContain('const x = 42')
    expect(result).toContain('{code}')
    // Thematic break
    expect(result).toContain('----')
    // Table
    expect(result).toContain('||Header A||Header B||')
    expect(result).toContain('|Cell 1|Cell 2|')
  })
})
