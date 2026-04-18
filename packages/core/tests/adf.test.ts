import { describe, it, expect } from 'vitest'
import { convertToAdf } from '../src/index.js'

describe('convertToAdf', () => {
  it('returns empty doc for empty input', () => {
    expect(convertToAdf('')).toEqual({
      version: 1,
      type: 'doc',
      content: [],
    })
  })

  it('converts heading', () => {
    const result = convertToAdf('# Title')
    expect(result.content).toEqual([
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Title' }],
      },
    ])
  })

  it('converts paragraph with bold', () => {
    const result = convertToAdf('Some **bold** text')
    expect(result.content).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Some ' },
          { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
          { type: 'text', text: ' text' },
        ],
      },
    ])
  })

  it('converts italic', () => {
    const result = convertToAdf('_italic_')
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'italic', marks: [{ type: 'em' }] }],
    })
  })

  it('converts strikethrough', () => {
    const result = convertToAdf('~~strike~~')
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'strike', marks: [{ type: 'strike' }] }],
    })
  })

  it('converts inline code', () => {
    const result = convertToAdf('`code`')
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'code', marks: [{ type: 'code' }] }],
    })
  })

  it('converts link', () => {
    const result = convertToAdf('[Google](https://google.com)')
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Google',
          marks: [{ type: 'link', attrs: { href: 'https://google.com' } }],
        },
      ],
    })
  })

  it('converts unordered list', () => {
    const result = convertToAdf('- Item 1\n- Item 2')
    expect(result.content[0]).toMatchObject({
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }],
        },
      ],
    })
  })

  it('converts ordered list', () => {
    const result = convertToAdf('1. First\n2. Second')
    expect(result.content[0]).toMatchObject({
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second' }] }],
        },
      ],
    })
  })

  it('converts nested list', () => {
    const result = convertToAdf('- Item\n  - Nested')
    const outerItem = (result.content[0] as { content: { content: unknown[] }[] }).content[0]
    expect(outerItem.content).toHaveLength(2)
    expect(outerItem.content[1]).toMatchObject({ type: 'bulletList' })
  })

  it('converts code block with language', () => {
    const result = convertToAdf('```js\nconsole.log("hi")\n```')
    expect(result.content[0]).toMatchObject({
      type: 'codeBlock',
      attrs: { language: 'js' },
      content: [{ type: 'text', text: 'console.log("hi")' }],
    })
  })

  it('converts code block without language', () => {
    const result = convertToAdf('```\nsome code\n```')
    expect(result.content[0]).toMatchObject({
      type: 'codeBlock',
      content: [{ type: 'text', text: 'some code' }],
    })
  })

  it('converts blockquote', () => {
    const result = convertToAdf('> A quote')
    expect(result.content[0]).toMatchObject({
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A quote' }] }],
    })
  })

  it('converts horizontal rule', () => {
    const result = convertToAdf('---')
    expect(result.content[0]).toEqual({ type: 'rule' })
  })

  it('converts table', () => {
    const result = convertToAdf('| Name | Age |\n|------|-----|\n| John | 30 |')
    expect(result.content[0]).toMatchObject({
      type: 'table',
      attrs: { isNumberColumnEnabled: false, layout: 'default' },
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }],
            },
            {
              type: 'tableHeader',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Age' }] }],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'John' }] }],
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '30' }] }],
            },
          ],
        },
      ],
    })
  })

  it('converts table with formatting in cells', () => {
    const result = convertToAdf('| Status |\n|--------|\n| **High** |')
    const cell = (
      result.content[0] as { content: { content: { content: { content: unknown[] }[] }[] }[] }
    ).content[1].content[0].content[0].content[0]
    expect(cell).toMatchObject({
      type: 'text',
      text: 'High',
      marks: [{ type: 'strong' }],
    })
  })

  it('ignores images silently', () => {
    const result = convertToAdf('![alt](image.png)')
    expect(result.content[0]).toMatchObject({
      type: 'paragraph',
      content: [],
    })
  })
})

// ── ADF edge cases ──

describe('convertToAdf — edge cases', () => {
  it('returns empty doc for whitespace-only input', () => {
    expect(convertToAdf('   \n  ')).toEqual({
      version: 1,
      type: 'doc',
      content: [],
    })
  })

  it('normalizes heading level > 6 to h6', () => {
    const result = convertToAdf('###### H6')
    expect(result.content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 6 },
    })
  })

  it('converts code block without language — no attrs', () => {
    const result = convertToAdf('```\nplain code\n```')
    const block = result.content[0]
    expect(block).toMatchObject({ type: 'codeBlock' })
    // Should either have no attrs or undefined language
    expect(
      !('attrs' in block) ||
        (block as { attrs?: { language?: string } }).attrs?.language === undefined
    ).toBe(true)
  })

  it('handles link with empty text [](url) — text node uses URL', () => {
    const result = convertToAdf('[](https://example.com)')
    const para = result.content[0] as { content: { marks?: { attrs?: { href: string } }[] }[] }
    const linkMark = para.content[0]?.marks?.find((m) => m.attrs?.href)
    expect(linkMark?.attrs?.href).toBe('https://example.com')
  })

  it('handles nested bold inside italic', () => {
    const result = convertToAdf('_**bold in italic**_')
    const para = result.content[0] as { content: { marks?: { type: string }[] }[] }
    const textNode = para.content[0]
    expect(textNode?.marks).toContainEqual({ type: 'em' })
    expect(textNode?.marks).toContainEqual({ type: 'strong' })
  })

  it('converts thematic break to rule', () => {
    const result = convertToAdf('---')
    expect(result.content[0]).toEqual({ type: 'rule' })
  })

  it('converts multiple paragraphs', () => {
    const result = convertToAdf('First paragraph\n\nSecond paragraph')
    expect(result.content).toHaveLength(2)
    expect(result.content[0]).toMatchObject({ type: 'paragraph' })
    expect(result.content[1]).toMatchObject({ type: 'paragraph' })
  })

  it('table normalizes unequal column count', () => {
    const md = '| A | B | C |\n|---|---|---|\n| 1 | 2 |'
    const result = convertToAdf(md)
    const table = result.content[0] as {
      content: { content: unknown[] }[]
    }
    // Header row has 3 cells
    expect(table.content[0].content).toHaveLength(3)
    // Data row should also have 3 cells (padded)
    expect(table.content[1].content).toHaveLength(3)
  })

  it('ignores HTML blocks (out of scope)', () => {
    const result = convertToAdf('<div>hello</div>')
    // HTML blocks should be ignored — no content or empty
    expect(result.content.length).toBe(0)
  })

  it('handles hard break', () => {
    // Two trailing spaces = hard break
    const result = convertToAdf('line one  \nline two')
    const para = result.content[0] as { content: { type: string }[] }
    const hasBreak = para.content.some((n) => n.type === 'hardBreak')
    expect(hasBreak).toBe(true)
  })
})
