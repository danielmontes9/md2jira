import { describe, it, expect } from 'vitest'
import { highlightXml } from '../src/utils/highlight-xml.js'

describe('highlightXml', () => {
  it('returns empty string for empty input', () => {
    expect(highlightXml('')).toBe('')
  })

  it('wraps element names in xml-tag span', () => {
    const result = highlightXml('<h1>Title</h1>')
    expect(result).toContain('<span class="xml-tag">h1</span>')
  })

  it('wraps opening bracket in xml-punct span', () => {
    const result = highlightXml('<p>text</p>')
    expect(result).toContain('<span class="xml-punct">&lt;</span>')
  })

  it('wraps closing bracket in xml-punct span', () => {
    const result = highlightXml('<p>text</p>')
    expect(result).toContain('<span class="xml-punct">&gt;</span>')
  })

  it('marks closing tags with / in xml-punct', () => {
    const result = highlightXml('</strong>')
    expect(result).toContain('<span class="xml-punct">&lt;/</span>')
    expect(result).toContain('<span class="xml-tag">strong</span>')
  })

  it('highlights self-closing tags with / before &gt;', () => {
    const result = highlightXml('<br/>')
    expect(result).toContain('<span class="xml-punct"> /&gt;</span>')
  })

  it('highlights attribute names in xml-attr-name span', () => {
    const result = highlightXml('<ac:structured-macro ac:name="code">')
    expect(result).toContain('<span class="xml-attr-name">ac:name</span>')
  })

  it('highlights attribute values in xml-attr-value span', () => {
    const result = highlightXml('<ac:parameter ac:name="language">js</ac:parameter>')
    expect(result).toContain('<span class="xml-attr-value">language</span>')
  })

  it('escapes HTML special characters in text nodes', () => {
    const result = highlightXml('<p>1 &amp; 2</p>')
    // The & in text node is escaped to &amp;amp; (double-escaped because already escaped)
    expect(result).toContain('&amp;')
  })

  it('highlights CDATA delimiters in xml-cdata-delim span', () => {
    const result = highlightXml('<![CDATA[some code]]>')
    expect(result).toContain('<span class="xml-cdata-delim">&lt;![CDATA[</span>')
    expect(result).toContain('<span class="xml-cdata-delim">]]&gt;</span>')
  })

  it('highlights CDATA content in xml-cdata-content span', () => {
    const result = highlightXml('<![CDATA[const x = 1;]]>')
    expect(result).toContain('<span class="xml-cdata-content">const x = 1;</span>')
  })

  it('escapes < and > inside CDATA content', () => {
    const result = highlightXml('<![CDATA[a < b]]>')
    const contentSpan = result.match(/<span class="xml-cdata-content">(.*?)<\/span>/)
    expect(contentSpan?.[1]).toBe('a &lt; b')
  })

  it('handles namespaced tags like ac:structured-macro', () => {
    const result = highlightXml('<ac:structured-macro ac:name="code"></ac:structured-macro>')
    expect(result).toContain('<span class="xml-tag">ac:structured-macro</span>')
  })

  it('handles a full Confluence code block', () => {
    const input =
      '<ac:structured-macro ac:name="code">' +
      '<ac:parameter ac:name="language">javascript</ac:parameter>' +
      '<ac:plain-text-body><![CDATA[const x = 1;]]></ac:plain-text-body>' +
      '</ac:structured-macro>'
    const result = highlightXml(input)
    expect(result).toContain('<span class="xml-tag">ac:structured-macro</span>')
    // ac:name="language" — attribute value is "language", not the text content
    expect(result).toContain('<span class="xml-attr-value">language</span>')
    // "javascript" is the text content between <ac:parameter> tags — plain escaped text
    expect(result).toContain('>javascript<')
    expect(result).toContain('<span class="xml-cdata-content">const x = 1;</span>')
    expect(result).toContain('<span class="xml-tag">ac:plain-text-body</span>')
  })

  it('handles input larger than the highlight threshold by returning escaped plain text', () => {
    const big = '<p>' + 'a'.repeat(600_000) + '</p>'
    const result = highlightXml(big)
    expect(result).not.toContain('<span class="xml-tag">')
    expect(result).toContain('&lt;p&gt;')
  })

  it('does not crash on malformed input', () => {
    expect(() => highlightXml('<unclosed')).not.toThrow()
    expect(() => highlightXml('no tags at all')).not.toThrow()
    expect(() => highlightXml('<>')).not.toThrow()
  })

  it('returns plain escaped text when there are no tags', () => {
    // Input with no < or > — returned as-is (no span wrapping)
    const result = highlightXml('plain text with no markup')
    expect(result).toBe('plain text with no markup')
  })

  it('escapes & in plain text nodes', () => {
    const result = highlightXml('<p>a &amp; b</p>')
    // The & in the text node is already escaped in the input; escapeHtml double-escapes it
    expect(result).toContain('&amp;amp;')
  })
})
