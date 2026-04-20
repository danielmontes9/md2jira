import { describe, it, expect } from 'vitest'
import {
  encodeMarkdown,
  decodeMarkdown,
  getInitialMarkdown,
  URL_MD_MAX_ENCODED,
} from '../src/utils/markdown-url.js'

describe('encodeMarkdown / decodeMarkdown', () => {
  it('roundtrips ASCII text', () => {
    const md = '# Hello\nSome **bold** text.'
    expect(decodeMarkdown(encodeMarkdown(md))).toBe(md)
  })

  it('roundtrips Unicode text', () => {
    const md = 'Héllo 世界 🚀 — em dash'
    expect(decodeMarkdown(encodeMarkdown(md))).toBe(md)
  })

  it('roundtrips an empty string', () => {
    expect(decodeMarkdown(encodeMarkdown(''))).toBe('')
  })

  it('produces URL-safe characters (no +, /, or =)', () => {
    // Run many inputs to cover all base64 output characters
    for (const md of ['hello world', 'a', 'ab', 'abc', 'abcd', '~~~']) {
      const encoded = encodeMarkdown(md)
      expect(encoded).not.toMatch(/[+/=]/)
    }
  })

  it('decodeMarkdown returns empty string for invalid base64', () => {
    expect(decodeMarkdown('!!!not-valid-base64!!!')).toBe('')
  })

  it('decodeMarkdown returns empty string when encoded length exceeds DoS guard', () => {
    const oversized = 'a'.repeat(URL_MD_MAX_ENCODED * 2 + 1)
    expect(decodeMarkdown(oversized)).toBe('')
  })

  it('decodeMarkdown handles corrupt percent-encoding gracefully', () => {
    // atob of 'JTg' decodes to '%8' — decodeURIComponent('%8') throws a URIError
    expect(decodeMarkdown('JTg')).toBe('')
  })
})

describe('getInitialMarkdown', () => {
  it('returns placeholder when no ?md= param is present', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    })
    expect(getInitialMarkdown('placeholder')).toBe('placeholder')
  })

  it('returns decoded markdown when valid ?md= param is present', () => {
    const md = '# My Doc'
    const encoded = encodeMarkdown(md)
    Object.defineProperty(window, 'location', {
      value: { search: `?md=${encoded}` },
      writable: true,
    })
    expect(getInitialMarkdown('placeholder')).toBe(md)
  })

  it('falls back to placeholder when ?md= decodes to empty string', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?md=!!!invalid!!!' },
      writable: true,
    })
    expect(getInitialMarkdown('placeholder')).toBe('placeholder')
  })
})
