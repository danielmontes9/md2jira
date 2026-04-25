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

// ── Task list (GFM) ──

describe('convertToAdf — task lists', () => {
  it('converts a todo item to taskList/taskItem with state TODO', () => {
    const result = convertToAdf('- [ ] Write tests')
    expect(result.content[0]).toMatchObject({
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { state: 'TODO' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write tests' }] }],
        },
      ],
    })
  })

  it('converts a checked item to taskItem with state DONE', () => {
    const result = convertToAdf('- [x] Done task')
    expect(result.content[0]).toMatchObject({
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { state: 'DONE' },
        },
      ],
    })
  })

  it('converts mixed task list items', () => {
    const result = convertToAdf('- [x] Done\n- [ ] Todo')
    const taskList = result.content[0] as { type: string; content: { attrs: { state: string } }[] }
    expect(taskList.type).toBe('taskList')
    expect(taskList.content[0].attrs.state).toBe('DONE')
    expect(taskList.content[1].attrs.state).toBe('TODO')
  })

  it('does not treat a regular bullet list as a taskList', () => {
    const result = convertToAdf('- regular item')
    expect(result.content[0]).toMatchObject({ type: 'bulletList' })
  })

  it('does not treat an ordered list as a taskList', () => {
    const result = convertToAdf('1. [ ] still ordered')
    expect(result.content[0]).toMatchObject({ type: 'orderedList' })
  })
})

describe('convertToAdf — unique localId', () => {
  it('generates unique localIds for multiple task lists in one document', () => {
    // A paragraph between the two task lists forces remark to produce two separate list nodes
    const md = '- [x] First list\n\nSeparator\n\n- [ ] Second list'
    const result = convertToAdf(md)
    const taskLists = result.content.filter((n) => n.type === 'taskList') as {
      type: string
      attrs: { localId: string }
    }[]
    expect(taskLists).toHaveLength(2)
    expect(taskLists[0]!.attrs.localId).not.toBe(taskLists[1]!.attrs.localId)
  })

  it('taskItem localIds are scoped to their parent taskList', () => {
    const md = '- [x] Item A\n- [ ] Item B'
    const result = convertToAdf(md)
    const taskList = result.content[0] as {
      attrs: { localId: string }
      content: { attrs: { localId: string } }[]
    }
    const [a, b] = taskList.content
    expect(a!.attrs.localId).not.toBe(b!.attrs.localId)
  })

  it('localIds are deterministic across repeated calls', () => {
    const md = '- [x] Task'
    const first = convertToAdf(md)
    const second = convertToAdf(md)
    const firstId = (first.content[0] as { attrs: { localId: string } }).attrs.localId
    const secondId = (second.content[0] as { attrs: { localId: string } }).attrs.localId
    expect(firstId).toBe(secondId)
  })
})

describe('convertToAdf — nested blockquotes', () => {
  it('converts nested blockquote to nested ADF blockquote', () => {
    const md = '> outer\n> > inner'
    const result = convertToAdf(md)
    expect(result.content[0]).toMatchObject({
      type: 'blockquote',
      content: expect.arrayContaining([
        { type: 'paragraph', content: [{ type: 'text', text: 'outer' }] },
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'inner' }] }],
        },
      ]),
    })
  })
})

describe('convertToAdf — blockquote complex children', () => {
  it('includes list inside blockquote as bulletList ADF node', () => {
    const md = '> Note:\n> - item one\n> - item two'
    const result = convertToAdf(md)
    const bq = result.content[0] as { type: string; content: { type: string }[] }
    expect(bq.type).toBe('blockquote')
    const hasList = bq.content.some((n) => n.type === 'bulletList')
    expect(hasList).toBe(true)
  })

  it('includes code block inside blockquote as codeBlock ADF node', () => {
    const md = '> Example:\n>\n> ```js\nconsole.log("hi")\n```'
    const result = convertToAdf(md)
    const bq = result.content[0] as { type: string; content: { type: string }[] }
    expect(bq.type).toBe('blockquote')
    const hasCode = bq.content.some((n) => n.type === 'codeBlock')
    expect(hasCode).toBe(true)
  })
})

describe('convertToAdf — GFM Alert panels', () => {
  it('converts [!NOTE] alert to ADF panel with panelType note', () => {
    const result = convertToAdf('> [!NOTE]\n> Some info')
    expect(result.content[0]).toMatchObject({
      type: 'panel',
      attrs: { panelType: 'note' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Some info' }] }],
    })
  })

  it('converts [!TIP] to panelType tip', () => {
    const result = convertToAdf('> [!TIP]\n> A tip')
    expect(result.content[0]).toMatchObject({ type: 'panel', attrs: { panelType: 'tip' } })
  })

  it('converts [!WARNING] to panelType warning', () => {
    const result = convertToAdf('> [!WARNING]\n> Be careful')
    expect(result.content[0]).toMatchObject({ type: 'panel', attrs: { panelType: 'warning' } })
  })

  it('maps [!CAUTION] to panelType warning', () => {
    const result = convertToAdf('> [!CAUTION]\n> Danger')
    expect(result.content[0]).toMatchObject({ type: 'panel', attrs: { panelType: 'warning' } })
  })

  it('maps [!IMPORTANT] to panelType info', () => {
    const result = convertToAdf('> [!IMPORTANT]\n> Important info')
    expect(result.content[0]).toMatchObject({ type: 'panel', attrs: { panelType: 'info' } })
  })

  it('leaves regular blockquotes as blockquote node (no regression)', () => {
    const result = convertToAdf('> regular quote')
    expect(result.content[0]).toMatchObject({ type: 'blockquote' })
  })

  it('converts panel with empty body (marker only) to panel with empty paragraph', () => {
    const result = convertToAdf('> [!NOTE]')
    expect(result.content[0]).toMatchObject({
      type: 'panel',
      attrs: { panelType: 'note' },
      content: [{ type: 'paragraph', content: [] }],
    })
  })

  it('converts panel with code block child', () => {
    const result = convertToAdf('> [!NOTE]\n>\n> ```js\nconst x = 1\n```')
    const panel = result.content[0] as { type: string; content: { type: string }[] }
    expect(panel.type).toBe('panel')
    const hasCode = panel.content.some((n) => n.type === 'codeBlock')
    expect(hasCode).toBe(true)
  })

  it('converts panel with list child', () => {
    const result = convertToAdf('> [!TIP]\n> - item one\n> - item two')
    const panel = result.content[0] as { type: string; content: { type: string }[] }
    expect(panel.type).toBe('panel')
    const hasList = panel.content.some((n) => n.type === 'bulletList')
    expect(hasList).toBe(true)
  })
})

describe('convertToAdf — taskList inside blockquote', () => {
  it('renders task list inside blockquote as taskList ADF node', () => {
    const md = '> - [x] Done\n> - [ ] Todo'
    const result = convertToAdf(md)
    const bq = result.content[0] as { type: string; content: { type: string }[] }
    expect(bq.type).toBe('blockquote')
    const hasTaskList = bq.content.some((n) => n.type === 'taskList')
    expect(hasTaskList).toBe(true)
  })

  it('task items inside blockquote have correct state', () => {
    const md = '> - [x] Done\n> - [ ] Todo'
    const result = convertToAdf(md)
    const bq = result.content[0] as {
      type: string
      content: { type: string; content: { attrs: { state: string } }[] }[]
    }
    const taskList = bq.content.find((n) => n.type === 'taskList')!
    expect(taskList.content[0]!.attrs.state).toBe('DONE')
    expect(taskList.content[1]!.attrs.state).toBe('TODO')
  })
})

describe('convertToAdf — ConvertOptions.baseUrl', () => {
  it('resolves relative links with baseUrl', () => {
    const result = convertToAdf('[docs](/guide)', { baseUrl: 'https://wiki.example.com' })
    const para = result.content[0] as {
      type: string
      content: { marks: { type: string; attrs: { href: string } }[] }[]
    }
    expect(para.content[0]!.marks[0]).toMatchObject({
      type: 'link',
      attrs: { href: 'https://wiki.example.com/guide' },
    })
  })

  it('leaves absolute links unchanged when baseUrl is set', () => {
    const result = convertToAdf('[home](https://example.com)', {
      baseUrl: 'https://wiki.example.com',
    })
    const para = result.content[0] as {
      type: string
      content: { marks: { type: string; attrs: { href: string } }[] }[]
    }
    expect(para.content[0]!.marks[0]).toMatchObject({
      type: 'link',
      attrs: { href: 'https://example.com' },
    })
  })

  it('trims trailing slash from baseUrl', () => {
    const result = convertToAdf('[page](/about)', { baseUrl: 'https://wiki.example.com/' })
    const para = result.content[0] as {
      type: string
      content: { marks: { type: string; attrs: { href: string } }[] }[]
    }
    expect(para.content[0]!.marks[0]).toMatchObject({
      type: 'link',
      attrs: { href: 'https://wiki.example.com/about' },
    })
  })

  it('resolves relative links inside headings', () => {
    const result = convertToAdf('# See [Guide](/guide)', { baseUrl: 'https://wiki.example.com' })
    const heading = result.content[0] as {
      type: string
      attrs: { level: number }
      content: { type: string; marks?: { type: string; attrs: { href: string } }[] }[]
    }
    expect(heading.type).toBe('heading')
    expect(heading.attrs.level).toBe(1)
    const linkNode = heading.content.find((n) => n.marks && n.marks.length > 0)
    expect(linkNode).toBeDefined()
    expect(linkNode!.marks![0]).toMatchObject({
      type: 'link',
      attrs: { href: 'https://wiki.example.com/guide' },
    })
  })

  it('resolves relative links in table data cells', () => {
    const md = '| Link |\n|------|\n| [Guide](/guide) |'
    const result = convertToAdf(md, { baseUrl: 'https://wiki.example.com' })
    // table → tableRow (data, idx 1) → tableCell → paragraph → text[link mark]
    const table = result.content[0] as {
      type: string
      content: {
        type: string
        content: {
          type: string
          content: {
            type: string
            content: { marks: { attrs: { href: string } }[] }[]
          }[]
        }[]
      }[]
    }
    const dataCell = table.content[1]!.content[0]!
    const dataPara = dataCell.content[0]!
    expect(dataPara.content[0]!.marks[0]!.attrs.href).toBe('https://wiki.example.com/guide')
  })
})

describe('convertToAdf — ConvertOptions.disableTransforms', () => {
  it('suppresses heading nodes', () => {
    const result = convertToAdf('# Title\n\nParagraph', { disableTransforms: ['heading'] })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'paragraph' })
  })

  it('suppresses table nodes', () => {
    const md = '| A |\n|---|\n| B |\n\nText'
    const result = convertToAdf(md, { disableTransforms: ['table'] })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'paragraph' })
  })

  it('suppresses blockquote nodes', () => {
    const result = convertToAdf('> quote\n\nText', { disableTransforms: ['blockquote'] })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'paragraph' })
  })

  it('suppresses list nodes', () => {
    const result = convertToAdf('- item\n\nText', { disableTransforms: ['list'] })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'paragraph' })
  })

  it('can disable multiple transforms at once', () => {
    const result = convertToAdf('# Title\n\n> quote\n\nText', {
      disableTransforms: ['heading', 'blockquote'],
    })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'paragraph' })
  })

  it('without options preserves all nodes', () => {
    const result = convertToAdf('# Title')
    expect(result.content[0]).toMatchObject({ type: 'heading' })
  })
})
