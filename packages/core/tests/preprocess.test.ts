import { describe, it, expect } from 'vitest'
import { preprocessMarkdown } from '../src/preprocess.js'

describe('preprocessMarkdown — line-ending normalisation', () => {
  it('returns LF-only for LF input', () => {
    expect(preprocessMarkdown('a\nb\nc')).toBe('a\nb\nc')
  })

  it('normalises CRLF to LF', () => {
    expect(preprocessMarkdown('a\r\nb\r\nc')).toBe('a\nb\nc')
  })

  it('normalises legacy CR (old Mac) to LF', () => {
    expect(preprocessMarkdown('a\rb\rc')).toBe('a\nb\nc')
  })

  it('normalises mixed CRLF and CR', () => {
    expect(preprocessMarkdown('a\r\nb\rc')).toBe('a\nb\nc')
  })

  it('returns empty string unchanged', () => {
    expect(preprocessMarkdown('')).toBe('')
  })
})

describe('preprocessMarkdown — GFM table gap collapsing', () => {
  const TABLE_WITH_GAP = ['| A | B |', '|---|---|', '| 1 | 2 |', '', '| 3 | 4 |'].join('\n')

  const TABLE_WITHOUT_GAP = ['| A | B |', '|---|---|', '| 1 | 2 |', '| 3 | 4 |'].join('\n')

  it('collapses a single empty line between table rows', () => {
    expect(preprocessMarkdown(TABLE_WITH_GAP)).toBe(TABLE_WITHOUT_GAP)
  })

  it('collapses multiple consecutive empty lines between table rows', () => {
    const input = ['| A | B |', '|---|---|', '| 1 | 2 |', '', '', '| 3 | 4 |'].join('\n')
    expect(preprocessMarkdown(input)).toBe(TABLE_WITHOUT_GAP)
  })

  it('preserves the empty line when it genuinely ends the table', () => {
    const input = ['| A | B |', '|---|---|', '| 1 | 2 |', '', 'Not a table row.'].join('\n')
    expect(preprocessMarkdown(input)).toBe(input)
  })

  it('does not collapse empty lines outside a table', () => {
    const input = 'paragraph one\n\nparagraph two'
    expect(preprocessMarkdown(input)).toBe(input)
  })

  it('handles a table at the very end of the string (no trailing newline)', () => {
    const input = '| A |\n|---|\n| 1 |'
    expect(preprocessMarkdown(input)).toBe('| A |\n|---|\n| 1 |')
  })

  it('handles a table followed immediately by another block', () => {
    const input = ['| A | B |', '|---|---|', '| 1 | 2 |', 'Not a table row.'].join('\n')
    expect(preprocessMarkdown(input)).toBe(input)
  })

  it('handles CRLF inside a table-with-gap (combined normalisation + collapse)', () => {
    const input = '| A | B |\r\n|---|---|\r\n| 1 | 2 |\r\n\r\n| 3 | 4 |'
    expect(preprocessMarkdown(input)).toBe(TABLE_WITHOUT_GAP)
  })

  it('handles a minimal single-column table', () => {
    const input = '| X |\n|---|\n| a |\n\n| b |'
    const expected = '| X |\n|---|\n| a |\n| b |'
    expect(preprocessMarkdown(input)).toBe(expected)
  })
})

describe('preprocessMarkdown — combined BOM + CRLF + table gap', () => {
  it('strips BOM, normalises CRLF, and collapses table gap in one pass', () => {
    const input = '\uFEFF| A | B |\r\n|---|---|\r\n| 1 | 2 |\r\n\r\n| 3 | 4 |'
    const expected = '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |'
    expect(preprocessMarkdown(input)).toBe(expected)
  })

  it('returns empty string for BOM-only input', () => {
    expect(preprocessMarkdown('\uFEFF')).toBe('')
  })

  it('strips BOM from content that has no table', () => {
    expect(preprocessMarkdown('\uFEFF# Title')).toBe('# Title')
  })
})

describe('preprocessMarkdown — indented / blockquote tables', () => {
  it('collapses an empty gap in a table that uses leading spaces (indented)', () => {
    // TABLE_ROW_RE uses /^\s*\|/ so indented pipe rows are treated as table rows.
    const input = '  | A | B |\n  |---|---|\n  | 1 | 2 |\n\n  | 3 | 4 |'
    const expected = '  | A | B |\n  |---|---|\n  | 1 | 2 |\n  | 3 | 4 |'
    expect(preprocessMarkdown(input)).toBe(expected)
  })

  it('does not collapse a gap when the next line after the gap is not a table row', () => {
    const input = '  | A | B |\n  |---|---|\n  | 1 | 2 |\n\nSome paragraph.'
    expect(preprocessMarkdown(input)).toBe(input)
  })
})
