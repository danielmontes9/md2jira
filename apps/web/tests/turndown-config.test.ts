import { describe, it, expect } from 'vitest'
import { createTurndownService } from '../src/components/jira-output/turndown-config.js'

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
})
