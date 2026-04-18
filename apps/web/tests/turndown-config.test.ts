import { describe, it, expect } from 'vitest'
import { createTurndownService } from '../src/components/jira-output/turndown-config.js'
import { adfToHtml } from '../src/components/jira-output/adf-renderer.js'
import { convertToAdf } from 'md2jira-core'

describe('createTurndownService', () => {
  it('converts bold to markdown', () => {
    const td = createTurndownService()
    expect(td.turndown('<strong>hello</strong>')).toBe('**hello**')
  })

  it('converts italic to markdown', () => {
    const td = createTurndownService()
    expect(td.turndown('<em>hello</em>')).toBe('_hello_')
  })

  it('converts strikethrough (s) to markdown', () => {
    const td = createTurndownService()
    expect(td.turndown('<s>hello</s>')).toBe('~~hello~~')
  })

  it('converts strikethrough (del) to markdown', () => {
    const td = createTurndownService()
    expect(td.turndown('<del>hello</del>')).toBe('~~hello~~')
  })

  it('converts pre>code block to fenced markdown', () => {
    const td = createTurndownService()
    const html = '<pre><code>const x = 1</code></pre>'
    const result = td.turndown(html)
    expect(result).toContain('```')
    expect(result).toContain('const x = 1')
  })

  it('converts h1 with atx style', () => {
    const td = createTurndownService()
    expect(td.turndown('<h1>Title</h1>')).toBe('# Title')
  })

  it('converts h2 with atx style', () => {
    const td = createTurndownService()
    expect(td.turndown('<h2>Sub</h2>')).toBe('## Sub')
  })

  it('converts hr to ---', () => {
    const td = createTurndownService()
    expect(td.turndown('<hr>')).toBe('---')
  })

  it('keeps sub and sup tags', () => {
    const td = createTurndownService()
    expect(td.turndown('<p>H<sub>2</sub>O</p>')).toContain('<sub>2</sub>')
    expect(td.turndown('<p>x<sup>2</sup></p>')).toContain('<sup>2</sup>')
  })

  it('converts table to markdown pipe syntax', () => {
    const td = createTurndownService()
    const html = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>'
    const result = td.turndown(html)
    expect(result).toContain('|')
    expect(result).toContain('---')
  })

  it('converts table cell with inline formatting', () => {
    const td = createTurndownService()
    const html = '<table><tr><th>Name</th></tr><tr><td><strong>bold</strong> text</td></tr></table>'
    const result = td.turndown(html)
    expect(result).toContain('**bold**')
  })

  it('converts multi-row table preserving all rows', () => {
    const td = createTurndownService()
    const html = '<table><tr><th>H</th></tr><tr><td>R1</td></tr><tr><td>R2</td></tr></table>'
    const result = td.turndown(html)
    expect(result).toContain('R1')
    expect(result).toContain('R2')
  })

  it('converts empty table cells', () => {
    const td = createTurndownService()
    const html = '<table><tr><th>A</th><th>B</th></tr><tr><td></td><td>val</td></tr></table>'
    const result = td.turndown(html)
    expect(result).toContain('val')
  })

  it('converts code block with language class', () => {
    const td = createTurndownService()
    const html = '<pre><code class="language-python">print("hi")</code></pre>'
    const result = td.turndown(html)
    expect(result).toContain('```')
    expect(result).toContain('print("hi")')
  })

  it('converts TipTap taskList to GFM checkboxes', () => {
    const td = createTurndownService()
    const html =
      '<ul data-type="taskList">' +
      '<li data-type="taskItem" data-checked="true"><div><p>Done</p></div></li>' +
      '<li data-type="taskItem" data-checked="false"><div><p>Todo</p></div></li>' +
      '</ul>'
    const result = td.turndown(html)
    expect(result).toContain('- [x] Done')
    expect(result).toContain('- [ ] Todo')
  })

  it('converts unchecked task list item', () => {
    const td = createTurndownService()
    const html =
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><div><p>Pending</p></div></li></ul>'
    const result = td.turndown(html)
    expect(result).toContain('- [ ] Pending')
  })
})

// ── Roundtrip integration: Markdown → ADF → HTML → Turndown → Markdown ───────
// These tests verify that the full pipeline (convert → render → edit → save)
// produces semantically equivalent Markdown when round-tripped.

describe('roundtrip: markdown → ADF → HTML → Turndown → markdown', () => {
  function roundtrip(md: string): string {
    const td = createTurndownService()
    return td.turndown(adfToHtml(convertToAdf(md)))
  }

  it('preserves bold text', () => {
    const result = roundtrip('**hello**')
    expect(result).toContain('**hello**')
  })

  it('preserves italic text', () => {
    const result = roundtrip('_world_')
    expect(result).toContain('_world_')
  })

  it('preserves headings', () => {
    const result = roundtrip('# Title\n\n## Subtitle')
    expect(result).toContain('# Title')
    expect(result).toContain('## Subtitle')
  })

  it('preserves inline code', () => {
    const result = roundtrip('Use `console.log()` here')
    expect(result).toContain('`console.log()`')
  })

  it('preserves fenced code block', () => {
    const result = roundtrip('```js\nconst x = 1\n```')
    expect(result).toContain('```')
    expect(result).toContain('const x = 1')
  })

  it('preserves unordered list items', () => {
    const result = roundtrip('- Alpha\n- Beta\n- Gamma')
    expect(result).toContain('Alpha')
    expect(result).toContain('Beta')
    expect(result).toContain('Gamma')
  })

  it('preserves ordered list items', () => {
    const result = roundtrip('1. First\n2. Second')
    expect(result).toContain('First')
    expect(result).toContain('Second')
  })

  it('preserves links', () => {
    const result = roundtrip('[Jira](https://jira.atlassian.com)')
    expect(result).toContain('https://jira.atlassian.com')
  })

  it('preserves blockquote', () => {
    const result = roundtrip('> A quote')
    expect(result).toContain('A quote')
  })

  it('preserves table structure', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const result = roundtrip(md)
    expect(result).toContain('|')
    expect(result).toContain('A')
    expect(result).toContain('B')
  })

  it('returns empty string for empty input', () => {
    expect(roundtrip('')).toBe('')
  })
})
