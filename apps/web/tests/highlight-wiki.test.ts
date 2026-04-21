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

  // ── Inline token highlighting ────────────────────────────────────────────────

  it('highlights *bold* with wiki-bold span', () => {
    const result = highlightWiki('This is *bold* text')
    expect(result).toContain('<span class="wiki-bold">*bold*</span>')
  })

  it('highlights _italic_ with wiki-italic span', () => {
    const result = highlightWiki('This is _italic_ text')
    expect(result).toContain('<span class="wiki-italic">_italic_</span>')
  })

  it('highlights {{inline code}} with wiki-inline-code span', () => {
    const result = highlightWiki('Use {{myVar}} here')
    expect(result).toContain('<span class="wiki-inline-code">{{myVar}}</span>')
  })

  it('highlights [text|url] link with wiki-link span', () => {
    const result = highlightWiki('See [Jira|https://jira.atlassian.com]')
    expect(result).toContain('<span class="wiki-link">[Jira|https://jira.atlassian.com]</span>')
  })

  it('highlights bare [url] link with wiki-link span', () => {
    const result = highlightWiki('Visit [https://jira.atlassian.com]')
    expect(result).toContain('<span class="wiki-link">[https://jira.atlassian.com]</span>')
  })

  it('highlights bq. blockquote prefix with wiki-blockquote span', () => {
    const result = highlightWiki('bq. A quoted note')
    expect(result).toContain('<span class="wiki-blockquote">bq.</span>')
  })

  it('highlights * unordered list marker with wiki-list-marker span', () => {
    const result = highlightWiki('* List item')
    expect(result).toContain('<span class="wiki-list-marker">*</span>')
  })

  it('highlights ** nested list marker with wiki-list-marker span', () => {
    const result = highlightWiki('** Nested item')
    expect(result).toContain('<span class="wiki-list-marker">**</span>')
  })

  it('highlights # ordered list marker with wiki-list-marker span', () => {
    const result = highlightWiki('# Ordered item')
    expect(result).toContain('<span class="wiki-list-marker">#</span>')
  })

  it('inline code protects its content from bold/italic highlighting', () => {
    const result = highlightWiki('{{*not bold*}}')
    // The content should be inside wiki-inline-code, NOT wiki-bold
    expect(result).toContain('wiki-inline-code')
    expect(result).not.toContain('wiki-bold')
  })

  it('does not apply inline highlights inside heading lines', () => {
    // Heading lines return early and don't go through inline processing
    const result = highlightWiki('h1. *Title*')
    expect(result).toContain('wiki-heading')
    expect(result).not.toContain('wiki-bold')
  })

  it('escapes HTML-special chars inside inline bold before wrapping span', () => {
    const result = highlightWiki('*<b>html</b>*')
    expect(result).toContain('&lt;b&gt;')
    expect(result).not.toContain('<b>')
  })

  // ── Inline highlighting inside table cells ────────────────────────────────────

  it('applies bold highlighting inside wiki table cell content', () => {
    const result = highlightWiki('| *bold* text |')
    expect(result).toContain('<span class="wiki-bold">*bold*</span>')
    expect(result).toContain('<span class="wiki-td">|</span>')
  })

  it('applies italic highlighting inside wiki table cell content', () => {
    const result = highlightWiki('| _italic_ text |')
    expect(result).toContain('<span class="wiki-italic">_italic_</span>')
  })

  it('applies inline-code highlighting inside wiki table cell content', () => {
    const result = highlightWiki('| {{myVar}} |')
    expect(result).toContain('<span class="wiki-inline-code">{{myVar}}</span>')
  })

  it('applies link highlighting inside wiki table cell content', () => {
    const result = highlightWiki('| [Jira|https://jira.com] |')
    expect(result).toContain('<span class="wiki-link">')
  })

  it('still wraps || header delimiters when cell contains inline tokens', () => {
    const result = highlightWiki('|| *Header* || plain ||')
    expect(result).toContain('<span class="wiki-th">||</span>')
    expect(result).toContain('<span class="wiki-bold">*Header*</span>')
  })

  it('does not produce unescaped HTML when cell contains angle brackets', () => {
    const result = highlightWiki('| <script>alert(1)</script> |')
    expect(result).toContain('&lt;script&gt;')
    expect(result).not.toContain('<script>')
  })

  // ── Link protection from bold/italic ────────────────────────────────────────

  it('does not apply bold highlighting inside a link span', () => {
    // [*bold*|url] — the *bold* inside the link should NOT get a wiki-bold span
    const result = highlightWiki('[*bold text*|https://example.com]')
    // The entire link is wrapped in wiki-link
    expect(result).toContain('<span class="wiki-link">')
    // But no wiki-bold span should appear inside it
    expect(result).not.toContain('wiki-bold')
  })

  it('does not apply italic highlighting inside a link span', () => {
    const result = highlightWiki('[_italic text_|https://example.com]')
    expect(result).toContain('<span class="wiki-link">')
    expect(result).not.toContain('wiki-italic')
  })

  // ── Color macro tokens ───────────────────────────────────────────────────────

  it('highlights {color:red} opening tag with wiki-macro span', () => {
    const result = highlightWiki('{color:red}hello{color}')
    expect(result).toContain('<span class="wiki-macro">{color:red}</span>')
  })

  it('highlights {color} closing tag with wiki-macro span', () => {
    const result = highlightWiki('{color:blue}text{color}')
    expect(result).toContain('<span class="wiki-macro">{color}</span>')
  })

  it('highlights {color:#ff0000} hex color with wiki-macro span', () => {
    const result = highlightWiki('{color:#ff0000}red text{color}')
    expect(result).toContain('<span class="wiki-macro">{color:#ff0000}</span>')
  })

  it('still applies bold to text between color macro tokens', () => {
    const result = highlightWiki('{color:red}*bold*{color}')
    expect(result).toContain('wiki-macro')
    expect(result).toContain('wiki-bold')
  })
})
