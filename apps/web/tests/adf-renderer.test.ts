import { describe, it, expect } from 'vitest'
import { adfToHtml, adfInlineToHtml } from '../src/components/jira-output/adf-renderer.js'
import type { AdfDocument, AdfInlineNode } from 'md2jira-core'

describe('adfInlineToHtml', () => {
  it('returns plain escaped text', () => {
    const node: AdfInlineNode = { type: 'text', text: '<script>&test</script>' }
    expect(adfInlineToHtml(node)).toBe('&lt;script&gt;&amp;test&lt;/script&gt;')
  })

  it('returns <br> for hardBreak', () => {
    const node = { type: 'hardBreak' as const }
    expect(adfInlineToHtml(node as AdfInlineNode)).toBe('<br>')
  })

  it('wraps bold mark', () => {
    const node: AdfInlineNode = { type: 'text', text: 'hello', marks: [{ type: 'strong' }] }
    expect(adfInlineToHtml(node)).toBe('<strong>hello</strong>')
  })

  it('wraps italic mark', () => {
    const node: AdfInlineNode = { type: 'text', text: 'hello', marks: [{ type: 'em' }] }
    expect(adfInlineToHtml(node)).toBe('<em>hello</em>')
  })

  it('wraps subsup mark with type sub as <sub>', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'n',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'subsup', attrs: { type: 'sub' } } as any],
    }
    expect(adfInlineToHtml(node)).toBe('<sub>n</sub>')
  })

  it('wraps subsup mark with type sup as <sup>', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'x',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'subsup', attrs: { type: 'sup' } } as any],
    }
    expect(adfInlineToHtml(node)).toBe('<sup>x</sup>')
  })

  it('wraps code mark', () => {
    const node: AdfInlineNode = { type: 'text', text: 'x', marks: [{ type: 'code' }] }
    expect(adfInlineToHtml(node)).toBe('<code>x</code>')
  })

  it('allows safe https links', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'example',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'link', attrs: { href: 'https://example.com' } } as any],
    }
    const html = adfInlineToHtml(node)
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('example</a>')
  })

  it('blocks javascript: URLs — OWASP A03 injection prevention', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'click',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } } as any],
    }
    const html = adfInlineToHtml(node)
    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="#"')
  })

  it('blocks data: URLs', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'x',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'link', attrs: { href: 'data:text/html,<h1>XSS</h1>' } } as any],
    }
    expect(adfInlineToHtml(node)).not.toContain('data:')
  })

  it('returns # for malformed URLs', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'x',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'link', attrs: { href: 'not a url' } } as any],
    }
    expect(adfInlineToHtml(node)).toContain('href="#"')
  })
})

describe('adfToHtml', () => {
  it('converts a simple paragraph', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
    }
    expect(adfToHtml(doc)).toBe('<p>Hello world</p>')
  })

  it('converts a heading', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
      ],
    }
    expect(adfToHtml(doc)).toBe('<h2>Title</h2>')
  })

  it('converts a bullet list', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }],
            },
          ],
        },
      ],
    }
    expect(adfToHtml(doc)).toBe('<ul><li><p>item</p></li></ul>')
  })

  it('converts a horizontal rule', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'rule' }],
    }
    expect(adfToHtml(doc)).toBe('<hr>')
  })

  it('returns empty string for unknown node types', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: [{ type: 'unknown' as any, content: [] }],
    }
    expect(adfToHtml(doc)).toBe('')
  })

  it('converts a code block without language', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'codeBlock', content: [{ type: 'text', text: 'const x = 1' }] }],
    }
    const html = adfToHtml(doc)
    expect(html).toContain('<pre>')
    expect(html).toContain('const x = 1')
  })

  it('converts a code block with language attr (renders language- class)', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [{ type: 'text', text: 'const x: number = 1' }],
        },
      ],
    }
    const html = adfToHtml(doc)
    expect(html).toContain('<pre><code class="language-typescript">')
    expect(html).toContain('const x: number = 1')
  })

  it('converts a blockquote', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'quoted' }] }],
        },
      ],
    }
    const html = adfToHtml(doc)
    expect(html).toContain('<blockquote>')
    expect(html).toContain('quoted')
  })

  it('converts a table with header and body rows', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'table',
          attrs: { isNumberColumnEnabled: false, layout: 'default' },
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H1' }] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'C1' }] }],
                },
              ],
            },
          ],
        },
      ],
    }
    const html = adfToHtml(doc)
    expect(html).toContain('<th>')
    expect(html).toContain('H1')
    expect(html).toContain('<td>')
    expect(html).toContain('C1')
  })

  it('converts an ordered list', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'first' }] }],
            },
          ],
        },
      ],
    }
    expect(adfToHtml(doc)).toBe('<ol><li><p>first</p></li></ol>')
  })
})
