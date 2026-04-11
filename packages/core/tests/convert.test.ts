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
    expect(convert('**bold** and _italic_ and `code`')).toBe(
      '*bold* and _italic_ and {{code}}'
    )
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
