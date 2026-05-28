import { describe, it, expect } from 'vitest'
import { hasStringValue, normalizeTableColumnCount, resolveUrl } from '../src/utils.js'
import type { TableRow } from 'mdast'

// Minimal TableRow factory — only the `children` array matters for column counting.
const row = (cols: number): TableRow => ({
  type: 'tableRow',
  children: Array.from({ length: cols }, () => ({
    type: 'tableCell',
    children: [],
  })),
})

describe('hasStringValue', () => {
  it('returns true when the object has a string value field', () => {
    expect(hasStringValue({ value: 'hello' })).toBe(true)
  })

  it('returns true for an empty string value', () => {
    expect(hasStringValue({ value: '' })).toBe(true)
  })

  it('returns false when value field is a number', () => {
    expect(hasStringValue({ value: 42 })).toBe(false)
  })

  it('returns false when value field is null', () => {
    expect(hasStringValue({ value: null })).toBe(false)
  })

  it('returns false when value field is undefined', () => {
    expect(hasStringValue({ value: undefined })).toBe(false)
  })

  it('returns false when value field is missing', () => {
    expect(hasStringValue({ type: 'unknown' })).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(hasStringValue({})).toBe(false)
  })
})

describe('normalizeTableColumnCount', () => {
  it('returns 0 for an empty row array', () => {
    expect(normalizeTableColumnCount([])).toBe(0)
  })

  it('returns the column count of a uniform table', () => {
    expect(normalizeTableColumnCount([row(3), row(3)])).toBe(3)
  })

  it('returns the max column count when rows have unequal columns', () => {
    expect(normalizeTableColumnCount([row(2), row(4), row(3)])).toBe(4)
  })

  it('returns 1 for a single-column table', () => {
    expect(normalizeTableColumnCount([row(1), row(1)])).toBe(1)
  })

  it('handles a single row', () => {
    expect(normalizeTableColumnCount([row(5)])).toBe(5)
  })

  it('handles a row with 0 columns among others', () => {
    expect(normalizeTableColumnCount([row(0), row(3)])).toBe(3)
  })
})

describe('resolveUrl', () => {
  it('returns the URL unchanged when no baseUrl is provided', () => {
    expect(resolveUrl('/page')).toBe('/page')
  })

  it('returns an absolute URL unchanged even when baseUrl is provided', () => {
    expect(resolveUrl('https://example.com/page', 'https://base.com')).toBe(
      'https://example.com/page'
    )
  })

  it('prepends baseUrl to a relative URL starting with /', () => {
    expect(resolveUrl('/wiki/page', 'https://company.atlassian.net')).toBe(
      'https://company.atlassian.net/wiki/page'
    )
  })

  it('strips a trailing slash from baseUrl before prepending', () => {
    expect(resolveUrl('/page', 'https://base.com/')).toBe('https://base.com/page')
  })

  it('returns an anchor-only URL unchanged', () => {
    expect(resolveUrl('#top', 'https://base.com')).toBe('#top')
  })

  it('returns an empty string unchanged', () => {
    expect(resolveUrl('', 'https://base.com')).toBe('')
  })

  it('returns the URL unchanged when baseUrl is an empty string', () => {
    expect(resolveUrl('/page', '')).toBe('/page')
  })
})
