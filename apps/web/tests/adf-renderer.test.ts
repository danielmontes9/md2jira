import { describe, it, expect } from 'vitest'
import {
  adfToHtml,
  adfInlineToHtml,
  adfBlockToHtml,
} from '../src/components/jira-output/adf-renderer.js'
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

  it('wraps underline mark', () => {
    const node: AdfInlineNode = { type: 'text', text: 'underlined', marks: [{ type: 'underline' }] }
    expect(adfInlineToHtml(node)).toBe('<u>underlined</u>')
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

  it('allows mailto: links', () => {
    const node: AdfInlineNode = {
      type: 'text',
      text: 'email',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marks: [{ type: 'link', attrs: { href: 'mailto:user@example.com' } } as any],
    }
    const html = adfInlineToHtml(node)
    expect(html).toContain('href="mailto:user@example.com"')
    expect(html).toContain('email</a>')
  })

  it('wraps strike mark as <s>', () => {
    const node: AdfInlineNode = { type: 'text', text: 'crossed', marks: [{ type: 'strike' }] }
    expect(adfInlineToHtml(node)).toBe('<s>crossed</s>')
  })

  it('returns attrs.text for external ADF mention nodes that carry no .text property', () => {
    // Jira REST API mention nodes look like { type: 'mention', attrs: { text: '@alice', id: '...' } }.
    // They are not in our AdfInlineNode type but may appear in real-world ADF payloads.
    // The defensive guard in adfInlineToHtml should extract attrs.text and escape it.
    const mentionNode = {
      type: 'text' as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attrs: { text: '@alice <script>', id: 'user-123' },
    } as unknown as AdfInlineNode
    expect(adfInlineToHtml(mentionNode)).toBe('@alice &lt;script&gt;')
  })

  it('returns empty string for external inline nodes with neither .text nor attrs.text', () => {
    // e.g. an emoji or status node that has no extractable text representation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusNode = {
      type: 'text' as const,
      attrs: { color: 'red' },
    } as unknown as AdfInlineNode
    expect(adfInlineToHtml(statusNode)).toBe('')
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

  it('escapes HTML inside codeBlock content — XSS prevention', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          content: [{ type: 'text', text: '<script>alert("xss")</script>' }],
        },
      ],
    }
    const html = adfToHtml(doc)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('sanitizes XSS payload in codeBlock language attribute — OWASP A03', () => {
    // The language tag is used in a class attribute: class="language-{lang}".
    // An attacker could try to inject HTML by supplying a crafted lang value.
    // The sanitizer (lang.replace(/[^\w-]/g, '')) strips every character that
    // is not a word char or hyphen.  The payload below would inject a <script>
    // tag if not sanitized; after sanitization it becomes benign residue.
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attrs: { language: '"><script>alert(1)</script><span class="' } as any,
          content: [{ type: 'text', text: 'code' }],
        },
      ],
    }
    const html = adfToHtml(doc)
    // The injected angle brackets and quotes must be absent from the output
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('alert(1)')
    // The output must still be valid HTML — the <pre> wrapper must be present
    expect(html).toContain('<pre>')
    // The code content itself must appear verbatim
    expect(html).toContain('code')
  })

  it('allows alphanumeric and hyphen characters in codeBlock language attribute', () => {
    const doc: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [{ type: 'text', text: 'const x = 1' }],
        },
      ],
    }
    const html = adfToHtml(doc)
    expect(html).toContain('class="language-typescript"')
  })
})

describe('adfBlockToHtml', () => {
  it('returns empty string for unknown block node type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = adfBlockToHtml({ type: 'unknownType' } as any)
    expect(result).toBe('')
  })

  it('renders children of unknown block types as best-effort fallback', () => {
    // Simulates a future ADF node type (e.g. "expand") that core doesn't handle.
    // The renderer should fall through and render the inner paragraph content.
    const result = adfBlockToHtml({
      type: 'expand',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'nested' }] }],
    } as any)
    expect(result).toBe('<p>nested</p>')
  })

  it('renders taskList with TODO item as unchecked checkbox', () => {
    const result = adfBlockToHtml({
      type: 'taskList',
      attrs: { localId: 'tl-0' },
      content: [
        {
          type: 'taskItem',
          attrs: { localId: 'task-0', state: 'TODO' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write tests' }] }],
        },
      ],
    })
    expect(result).toContain('data-type="taskList"')
    expect(result).toContain('data-type="taskItem"')
    expect(result).not.toContain('checked')
    expect(result).toContain('tabindex="-1"')
    expect(result).toContain('Write tests')
  })

  it('renders taskList with DONE item as checked checkbox', () => {
    const result = adfBlockToHtml({
      type: 'taskList',
      attrs: { localId: 'tl-0' },
      content: [
        {
          type: 'taskItem',
          attrs: { localId: 'task-0', state: 'DONE' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Done task' }] }],
        },
      ],
    })
    expect(result).toContain('checked')
    expect(result).toContain('tabindex="-1"')
    expect(result).toContain('Done task')
  })

  it('renders taskList with bold inline text inside item', () => {
    const result = adfBlockToHtml({
      type: 'taskList',
      attrs: { localId: 'tl-0' },
      content: [
        {
          type: 'taskItem',
          attrs: { localId: 'task-0', state: 'TODO' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'bold', marks: [{ type: 'strong' }] }],
            },
          ],
        },
      ],
    })
    expect(result).toContain('<strong>bold</strong>')
  })
})

describe('adfBlockToHtml — panel nodes', () => {
  const panelTypes = ['info', 'note', 'warning', 'tip', 'error', 'success'] as const

  for (const panelType of panelTypes) {
    it(`renders a ${panelType} panel with correct class and content`, () => {
      const result = adfBlockToHtml({
        type: 'panel',
        attrs: { panelType },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: `${panelType} message` }] }],
      })
      expect(result).toContain('class="adf-panel adf-panel--' + panelType + '"')
      expect(result).toContain(`${panelType} message`)
      expect(result).toContain('<p>')
    })
  }

  it('panel wraps multiple child blocks', () => {
    const result = adfBlockToHtml({
      type: 'panel',
      attrs: { panelType: 'info' },
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
      ],
    })
    expect(result).toContain('First')
    expect(result).toContain('Second')
    // Verify both paragraphs are inside the same panel div
    expect(result).toMatch(/adf-panel--info[\s\S]*<p>First<\/p>[\s\S]*<p>Second<\/p>/)
  })
})
