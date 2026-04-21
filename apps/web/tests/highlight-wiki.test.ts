import { describe, it, expect } from 'vitest'
import { highlightWiki } from '../src/utils/highlight-wiki.js'

describe('highlightWiki', () => {
  it('returns empty string for empty input', () => {
    expect(highlightWiki('')).toBe('')
  })

  it('wraps h1. heading token in wiki-heading span', () => {
    const result = highlightWiki('h1. Title')
    expect(result).toContain('<span class="wiki-heading">h1.</span>')
    expect(result).toContain('Title')
  })

  it('wraps h6. heading token in wiki-heading span', () => {
    const result = highlightWiki('h6. Small heading')
    expect(result).toContain('<span class="wiki-heading">h6.</span>')
  })

  it('does not apply heading style to invalid patterns like h7.', () => {
    const result = highlightWiki('h7. Not a heading')
    expect(result).not.toContain('wiki-heading')
  })

  it('wraps || header delimiters in wiki-th spans', () => {
    const result = highlightWiki('|| Name || Age ||')
    expect(result).toContain('<span class="wiki-th">||</span>')
    expect(result).not.toContain('<span class="wiki-td">|</span>')
  })

  it('wraps | cell delimiters in wiki-td spans', () => {
    const result = highlightWiki('| Alice | 30 |')
    expect(result).toContain('<span class="wiki-td">|</span>')
    expect(result).not.toContain('<span class="wiki-th">||</span>')
  })

  it('handles a row that mixes || and | (header followed by data)', () => {
    const result = highlightWiki('|| col ||')
    expect(result).toContain('wiki-th')
    const result2 = highlightWiki('| cell |')
    expect(result2).toContain('wiki-td')
  })

  it('wraps horizontal rule ---- in wiki-rule span', () => {
    const result = highlightWiki('----')
    expect(result).toContain('<span class="wiki-rule">')
    expect(result).toContain('----')
  })

  it('does not treat --- (three dashes) as a horizontal rule', () => {
    const result = highlightWiki('---')
    expect(result).not.toContain('wiki-rule')
  })

  it('wraps {code} fence in wiki-code-fence span', () => {
    const result = highlightWiki('{code}')
    expect(result).toContain('<span class="wiki-code-fence">')
  })

  it('wraps {code:language=js} fence in wiki-code-fence span', () => {
    const result = highlightWiki('{code:language=js}')
    expect(result).toContain('<span class="wiki-code-fence">')
  })

  it('wraps {noformat} fence in wiki-code-fence span', () => {
    const result = highlightWiki('{noformat}')
    expect(result).toContain('<span class="wiki-code-fence">')
  })

  it('escapes < and > in plain text before injecting spans', () => {
    const result = highlightWiki('foo <bar> baz')
    expect(result).toContain('&lt;bar&gt;')
    expect(result).not.toContain('<bar>')
  })

  it('escapes & in plain text', () => {
    const result = highlightWiki('a & b')
    expect(result).toContain('&amp;')
  })

  it('escapes " in plain text', () => {
    const result = highlightWiki('say "hello"')
    expect(result).toContain('&quot;')
  })

  it('escapes HTML-special chars in headings before wrapping span', () => {
    const result = highlightWiki('h1. <script>alert(1)</script>')
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>')
  })

  it('escapes HTML-special chars in table cells', () => {
    const result = highlightWiki('| <b>bold</b> |')
    expect(result).toContain('&lt;b&gt;')
    expect(result).not.toContain('<b>')
  })

  it('processes multiple lines independently', () => {
    const result = highlightWiki('h1. Title\nh2. Sub\nsome text')
    const lines = result.split('\n')
    expect(lines[0]).toContain('wiki-heading')
    expect(lines[1]).toContain('wiki-heading')
    expect(lines[2]).not.toContain('wiki-heading')
  })

  it('returns HTML-escaped text without highlight spans for payloads over 500KB', () => {
    const large = 'h1. heading\n'.repeat(50_000) // ~600 KB
    const result = highlightWiki(large)
    // Should be escaped but NOT have any wiki-heading spans (bypass path)
    expect(result).not.toContain('<span class="wiki-heading">')
    // The raw text should be present (escaped)
    expect(result).toContain('h1. heading')
  })

  it('plain text line is returned HTML-escaped and unchanged', () => {
    const result = highlightWiki('just some text')
    expect(result).toBe('just some text')
  })
})
