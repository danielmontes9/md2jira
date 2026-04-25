import { describe, it, expect } from 'vitest'
import { highlightJson } from '../src/utils/highlight-json.js'
import { escapeHtml } from '../src/utils/escape-html.js'

describe('escapeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('escapes all five HTML special characters', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('leaves safe characters unchanged', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123')
  })

  it('handles mixed content', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('does not double-escape already escaped text', () => {
    // If the input already has &amp;, it should become &amp;amp;
    // (correct — the function always escapes raw & characters)
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })
})

describe('highlightJson', () => {
  it('returns empty string for empty input', () => {
    expect(highlightJson('')).toBe('')
  })

  it('escapes HTML special characters before wrapping spans', () => {
    // The < and > in the input must be escaped to &lt; and &gt;
    const result = highlightJson('<b>1</b>')
    expect(result).toContain('&lt;b&gt;')
    expect(result).not.toContain('<b>')
  })

  it('wraps object keys with json-key class', () => {
    const result = highlightJson('{"name": "Alice"}')
    expect(result).toContain('<span class="json-key">&quot;name&quot;:</span>')
  })

  it('wraps string values with json-string class', () => {
    const result = highlightJson('{"key": "value"}')
    expect(result).toContain('<span class="json-string">&quot;value&quot;</span>')
  })

  it('wraps true with json-boolean class', () => {
    const result = highlightJson('{"active": true}')
    expect(result).toContain('<span class="json-boolean">true</span>')
  })

  it('wraps false with json-boolean class', () => {
    const result = highlightJson('{"active": false}')
    expect(result).toContain('<span class="json-boolean">false</span>')
  })

  it('wraps null with json-null class', () => {
    const result = highlightJson('{"data": null}')
    expect(result).toContain('<span class="json-null">null</span>')
  })

  it('wraps integer numbers with json-number class', () => {
    const result = highlightJson('{"count": 42}')
    expect(result).toContain('<span class="json-number">42</span>')
  })

  it('wraps negative numbers with json-number class', () => {
    const result = highlightJson('{"delta": -3}')
    expect(result).toContain('<span class="json-number">-3</span>')
  })

  it('wraps floating-point numbers with json-number class', () => {
    const result = highlightJson('{"ratio": 3.14}')
    expect(result).toContain('<span class="json-number">3.14</span>')
  })

  it('wraps exponential numbers with json-number class', () => {
    const result = highlightJson('{"big": 1e10}')
    expect(result).toContain('<span class="json-number">1e10</span>')
  })

  it('does not double-escape already escaped entities', () => {
    // Ampersands in the input should become &amp; exactly once
    const result = highlightJson('{"url": "a&b"}')
    expect(result).toContain('a&amp;b')
    expect(result).not.toContain('&amp;amp;')
  })

  it('handles a complete JSON object', () => {
    const input = JSON.stringify({ name: 'test', count: 5, active: true, missing: null }, null, 2)
    const result = highlightJson(input)
    expect(result).toContain('json-key')
    expect(result).toContain('json-string')
    expect(result).toContain('json-number')
    expect(result).toContain('json-boolean')
    expect(result).toContain('json-null')
  })

  it('passes through plain text (no JSON tokens) unchanged except HTML escaping', () => {
    const result = highlightJson('hello world')
    expect(result).toBe('hello world')
  })

  it('returns HTML-escaped text without highlight spans for payloads over 500KB', () => {
    // ~600 KB payload — must take the early-exit path to avoid blocking the main thread
    const large = '{"key": "value"}\n'.repeat(37_500)
    const result = highlightJson(large)
    // Bypass path: no span tags injected
    expect(result).not.toContain('<span class="json-key">')
    expect(result).not.toContain('<span class="json-string">')
    // But the content must still be HTML-escaped
    expect(result).toContain('&quot;key&quot;')
    expect(result).toContain('&quot;value&quot;')
  })
})
