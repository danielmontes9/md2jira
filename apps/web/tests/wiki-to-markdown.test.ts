import { describe, it, expect } from 'vitest'
import { wikiToMarkdown } from '../src/utils/wiki-to-markdown.js'

// ── Headings ──────────────────────────────────────────────────────────────────

describe('wikiToMarkdown — headings', () => {
  it('converts h1. to # heading', () => {
    expect(wikiToMarkdown('h1. Hello')).toBe('# Hello')
  })

  it('converts h2. to ## heading', () => {
    expect(wikiToMarkdown('h2. Sub')).toBe('## Sub')
  })

  it('converts h3.-h6.', () => {
    expect(wikiToMarkdown('h3. Third')).toBe('### Third')
    expect(wikiToMarkdown('h6. Deep')).toBe('###### Deep')
  })

  it('preserves inline content inside headings', () => {
    expect(wikiToMarkdown('h1. *Bold* Title')).toBe('# **Bold** Title')
  })
})

// ── Blockquote ────────────────────────────────────────────────────────────────

describe('wikiToMarkdown — blockquote', () => {
  it('converts bq. to > quote', () => {
    expect(wikiToMarkdown('bq. This is a quote')).toBe('> This is a quote')
  })

  it('converts inline markup inside bq.', () => {
    expect(wikiToMarkdown('bq. *bold* text')).toBe('> **bold** text')
  })
})

// ── Thematic break ────────────────────────────────────────────────────────────

describe('wikiToMarkdown — thematic break', () => {
  it('converts ---- to ---', () => {
    expect(wikiToMarkdown('----')).toBe('---')
  })
})

// ── Lists ─────────────────────────────────────────────────────────────────────

describe('wikiToMarkdown — unordered lists', () => {
  it('converts * item to - item', () => {
    expect(wikiToMarkdown('* First')).toBe('- First')
  })

  it('converts ** item to 2-space indented - item', () => {
    expect(wikiToMarkdown('** Nested')).toBe('  - Nested')
  })

  it('converts *** item to 4-space indented - item', () => {
    expect(wikiToMarkdown('*** Deep')).toBe('    - Deep')
  })
})

describe('wikiToMarkdown — ordered lists', () => {
  it('converts # item to 1. item', () => {
    expect(wikiToMarkdown('# Step one')).toBe('1. Step one')
  })

  it('converts ## item to 2-space indented 1. item', () => {
    expect(wikiToMarkdown('## Sub step')).toBe('  1. Sub step')
  })
})

// ── Inline formatting ─────────────────────────────────────────────────────────

describe('wikiToMarkdown — inline formatting', () => {
  it('converts *bold* to **bold**', () => {
    expect(wikiToMarkdown('This is *bold* text')).toBe('This is **bold** text')
  })

  it('converts _italic_ to *italic*', () => {
    expect(wikiToMarkdown('This is _italic_ text')).toBe('This is *italic* text')
  })

  it('converts {{code}} to `code`', () => {
    expect(wikiToMarkdown('Use {{myFunc}} here')).toBe('Use `myFunc` here')
  })

  it('converts multiple inline formats in one line', () => {
    const result = wikiToMarkdown('*bold* and _italic_ and {{code}}')
    expect(result).toBe('**bold** and *italic* and `code`')
  })
})

// ── Links ─────────────────────────────────────────────────────────────────────

describe('wikiToMarkdown — links', () => {
  it('converts [text|url] to [text](url)', () => {
    expect(wikiToMarkdown('[Jira|https://jira.example.com]')).toBe(
      '[Jira](https://jira.example.com)'
    )
  })

  it('converts bare [url] to [url](url)', () => {
    expect(wikiToMarkdown('[https://example.com]')).toBe(
      '[https://example.com](https://example.com)'
    )
  })
})

// ── Images ────────────────────────────────────────────────────────────────────

describe('wikiToMarkdown — images', () => {
  it('converts !url! to ![](url)', () => {
    expect(wikiToMarkdown('!image.png!')).toBe('![](image.png)')
  })

  it('converts !url|params! to ![](url) dropping params', () => {
    expect(wikiToMarkdown('!image.png|width=200!')).toBe('![](image.png)')
  })
})

// ── Code blocks ───────────────────────────────────────────────────────────────

describe('wikiToMarkdown — {code} blocks', () => {
  it('converts {code} block to fenced code without language', () => {
    const input = '{code}\nconst x = 1\n{code}'
    expect(wikiToMarkdown(input)).toBe('```\nconst x = 1\n```')
  })

  it('converts {code:language=js} to ```js fence', () => {
    const input = '{code:language=js}\nconsole.log()\n{code}'
    expect(wikiToMarkdown(input)).toBe('```js\nconsole.log()\n```')
  })

  it('does not apply inline transforms inside code blocks', () => {
    const input = '{code}\n*not bold* _not italic_\n{code}'
    expect(wikiToMarkdown(input)).toBe('```\n*not bold* _not italic_\n```')
  })

  it('handles multi-line code blocks', () => {
    const input = '{code:language=ts}\nline 1\nline 2\nline 3\n{code}'
    expect(wikiToMarkdown(input)).toBe('```ts\nline 1\nline 2\nline 3\n```')
  })
})

// ── Noformat blocks ───────────────────────────────────────────────────────────

describe('wikiToMarkdown — {noformat} blocks', () => {
  it('converts {noformat} block to fenced code with no language', () => {
    const input = '{noformat}\nplain text\n{noformat}'
    expect(wikiToMarkdown(input)).toBe('```\nplain text\n```')
  })

  it('does not apply inline transforms inside noformat blocks', () => {
    const input = '{noformat}\n*raw* _markup_\n{noformat}'
    expect(wikiToMarkdown(input)).toBe('```\n*raw* _markup_\n```')
  })

  it('handles multi-line noformat blocks', () => {
    const input = '{noformat}\nline one\nline two\n{noformat}'
    expect(wikiToMarkdown(input)).toBe('```\nline one\nline two\n```')
  })

  it('{code} and {noformat} can both close an open block', () => {
    // Regardless of which opener was used, both closers are accepted
    const input = '{noformat}\ncontent\n{noformat}'
    expect(wikiToMarkdown(input)).toBe('```\ncontent\n```')
  })
})

// ── Empty / identity ──────────────────────────────────────────────────────────

describe('wikiToMarkdown — empty / identity', () => {
  it('returns empty string for empty input', () => {
    expect(wikiToMarkdown('')).toBe('')
  })

  it('passes through plain text unchanged', () => {
    expect(wikiToMarkdown('Hello world')).toBe('Hello world')
  })

  it('handles multi-paragraph input', () => {
    const input = 'h1. Title\n\nSome *bold* text.\n\nbq. A quote'
    expect(wikiToMarkdown(input)).toBe('# Title\n\nSome **bold** text.\n\n> A quote')
  })
})
