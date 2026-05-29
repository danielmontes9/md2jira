import { escapeHtml } from './escape-html.js'

/**
 * Produces an HTML string with syntax-highlighted XML/XHTML tokens wrapped
 * in `<span>` elements. Designed for Confluence Storage Format output.
 *
 * Processes the input token by token (tags, CDATA, text nodes). Text content
 * is HTML-escaped before insertion; injected `<span>` tags use only whitelisted
 * class names. The output is safe to set via `innerHTML`.
 */

/** Payloads larger than this are returned HTML-escaped but un-highlighted. */
const MAX_HIGHLIGHT_BYTES = 500_000

/**
 * Matches XML tokens in order of precedence:
 *  1. CDATA sections  — <![CDATA[ … ]]>
 *  2. XML comments    — <!-- … -->
 *  3. Any XML tag     — <tag attrs/>, </tag>, <tag>
 */
const ATTR_PAIR = /([\w:.-]+)(\s*=\s*)("([^"]*)"|'([^']*)')/g

const XML_TOKEN =
  /(<!\[CDATA\[[\s\S]*?]]>|<!--[\s\S]*?-->|<\/?([\w:.-]+)(?:\s+[\w:.-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s/>]*))?)*\s*\/?>)/g

export function highlightXml(xml: string): string {
  if (!xml) return ''
  if (xml.length > MAX_HIGHLIGHT_BYTES) return escapeHtml(xml)

  let result = ''
  let lastIndex = 0
  XML_TOKEN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = XML_TOKEN.exec(xml)) !== null) {
    // Text node before this token — escape and emit
    if (match.index > lastIndex) {
      result += escapeHtml(xml.slice(lastIndex, match.index))
    }
    result += highlightToken(match[0])
    lastIndex = match.index + match[0].length
  }

  // Trailing text after the last token
  if (lastIndex < xml.length) {
    result += escapeHtml(xml.slice(lastIndex))
  }

  return result
}

function highlightToken(token: string): string {
  // CDATA section: <![CDATA[ content ]]>
  if (token.startsWith('<![CDATA[')) {
    const content = token.slice(9, token.length - 3)
    return (
      '<span class="xml-cdata-delim">&lt;![CDATA[</span>' +
      '<span class="xml-cdata-content">' +
      escapeHtml(content) +
      '</span>' +
      '<span class="xml-cdata-delim">]]&gt;</span>'
    )
  }

  // XML comment: <!-- … -->
  if (token.startsWith('<!--')) {
    return '<span class="xml-comment">' + escapeHtml(token) + '</span>'
  }

  // Opening / closing / self-closing tag
  const isClosing = token[1] === '/'
  const isSelfClosing = token[token.length - 2] === '/'

  // Locate the end of the tag name
  const nameStart = isClosing ? 2 : 1
  let nameEnd = nameStart
  while (
    nameEnd < token.length &&
    token[nameEnd] !== ' ' &&
    token[nameEnd] !== '/' &&
    token[nameEnd] !== '>'
  ) {
    nameEnd++
  }
  const tagName = token.slice(nameStart, nameEnd)

  // Attribute substring (between end of tag name and closing bracket)
  const attrsRaw = isSelfClosing
    ? token.slice(nameEnd, token.length - 2)
    : token.slice(nameEnd, token.length - 1)

  return (
    '<span class="xml-punct">&lt;' +
    (isClosing ? '/' : '') +
    '</span>' +
    '<span class="xml-tag">' +
    escapeHtml(tagName) +
    '</span>' +
    highlightAttrs(attrsRaw) +
    '<span class="xml-punct">' +
    (isSelfClosing ? ' /&gt;' : '&gt;') +
    '</span>'
  )
}

/**
 * Highlights `name="value"` pairs inside a raw attribute substring.
 * Whitespace between attributes is left as-is — it only contains spaces and
 * attribute names (`[\w:.-]+`), none of which are HTML-special characters.
 */
function highlightAttrs(attrs: string): string {
  ATTR_PAIR.lastIndex = 0
  return attrs.replace(
    ATTR_PAIR,
    (
      _full: string,
      name: string,
      eq: string,
      quotedValue: string,
      dqContent: string,
      sqContent: string
    ) => {
      const quote = quotedValue[0] as string
      const inner = dqContent ?? sqContent ?? ''
      return (
        '<span class="xml-attr-name">' +
        escapeHtml(name) +
        '</span>' +
        eq +
        quote +
        '<span class="xml-attr-value">' +
        escapeHtml(inner) +
        '</span>' +
        quote
      )
    }
  )
}
