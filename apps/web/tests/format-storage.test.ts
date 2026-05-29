import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getStoredFormat } from '../src/utils/format-storage.js'

const LS_KEY = 'output-format'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('getStoredFormat — URL param priority', () => {
  it('returns "wiki" when ?fmt=wiki is in the search string', () => {
    expect(getStoredFormat('?fmt=wiki')).toBe('wiki')
  })

  it('returns "adf" when ?fmt=adf is in the search string', () => {
    expect(getStoredFormat('?fmt=adf')).toBe('adf')
  })

  it('returns "confluence" when ?fmt=confluence is in the search string', () => {
    expect(getStoredFormat('?fmt=confluence')).toBe('confluence')
  })

  it('ignores an invalid ?fmt= value and falls through to localStorage', () => {
    localStorage.setItem(LS_KEY, 'wiki')
    expect(getStoredFormat('?fmt=invalid')).toBe('wiki')
  })

  it('ignores an invalid ?fmt= value and returns "adf" when localStorage is also empty', () => {
    expect(getStoredFormat('?fmt=bogus')).toBe('adf')
  })
})

describe('getStoredFormat — localStorage fallback', () => {
  it('returns "wiki" when localStorage has "wiki" and no URL param', () => {
    localStorage.setItem(LS_KEY, 'wiki')
    expect(getStoredFormat('')).toBe('wiki')
  })

  it('returns "confluence" when localStorage has "confluence" and no URL param', () => {
    localStorage.setItem(LS_KEY, 'confluence')
    expect(getStoredFormat('')).toBe('confluence')
  })

  it('returns "adf" when localStorage has "adf"', () => {
    localStorage.setItem(LS_KEY, 'adf')
    expect(getStoredFormat('')).toBe('adf')
  })

  it('ignores an invalid localStorage value and returns the default', () => {
    localStorage.setItem(LS_KEY, 'invalid')
    expect(getStoredFormat('')).toBe('adf')
  })

  it('URL param takes priority over localStorage', () => {
    localStorage.setItem(LS_KEY, 'wiki')
    expect(getStoredFormat('?fmt=confluence')).toBe('confluence')
  })
})

describe('getStoredFormat — default fallback', () => {
  it('returns "adf" when there is no URL param and no localStorage value', () => {
    expect(getStoredFormat('')).toBe('adf')
  })

  it('returns "adf" with an empty search string', () => {
    expect(getStoredFormat()).toBe('adf')
  })
})
