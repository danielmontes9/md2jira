import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../src/utils/escape-html.js'

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b')
  })

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("a 'b' c")).toBe('a &#39;b&#39; c')
  })

  it('escapes all five characters together', () => {
    expect(escapeHtml('<div class="x" data-a=\'y\'>&</div>')).toBe(
      '&lt;div class=&quot;x&quot; data-a=&#39;y&#39;&gt;&amp;&lt;/div&gt;'
    )
  })

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('does not modify strings with no special characters', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123')
  })

  it('escapes a script tag injection', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('handles multiple ampersands', () => {
    expect(escapeHtml('a && b && c')).toBe('a &amp;&amp; b &amp;&amp; c')
  })
})
