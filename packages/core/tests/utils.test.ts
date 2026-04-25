import { describe, it, expect } from 'vitest'
import { hasStringValue, normalizeTableColumnCount } from '../src/utils.js'
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
