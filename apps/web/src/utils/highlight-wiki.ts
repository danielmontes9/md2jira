import { escapeHtml } from './escape-html.js'

/**
 * Produces an HTML string with syntax-highlighted Jira Wiki Markup tokens
 * wrapped in `<span>` elements.
 *
 * Processes the input line-by-line to identify structural tokens (headings,
 * table delimiters, code-block fences, horizontal rules, lists, blockquotes)
 * then applies inline highlighting (bold, italic, inline code, links) to
 * non-structural lines. The input is HTML-escaped before any markup is
 * injected, so the output is safe to set via `innerHTML`.
 */

/** Payloads larger than this are returned HTML-escaped but un-highlighted. */
const MAX_HIGHLIGHT_BYTES = 500_000

export function highlightWiki(wiki: string): string {
  if (wiki.length > MAX_HIGHLIGHT_BYTES) return escapeHtml(wiki)
  return wiki.split('\n').map(highlightWikiLine).join('\n')
}

function highlightWikiLine(line: string): string {
  const esc = escapeHtml(line)

  // Headings: h1. text → h6. text
  if (/^h[1-6]\. /.test(line)) {
    return esc.replace(/^(h[1-6]\.)/, '<span class="wiki-heading">$1</span>')
  }

  // Horizontal rule
  if (line.trim() === '----') {
    return `<span class="wiki-rule">${esc}</span>`
  }

  // Table rows: lines starting with | (includes || header rows)
  if (/^\s*\|/.test(line)) {
    // Use placeholder substitution to avoid || vs | ambiguity:
    // 1. Replace || with placeholder, 2. Replace remaining |, 3. Restore placeholder
    return esc
      .replace(/\|\|/g, '\x02')
      .replace(/\|/g, '<span class="wiki-td">|</span>')
      .replace(/\x02/g, '<span class="wiki-th">||</span>')
  }

  // Code block delimiters: {code}, {code:language=js}, {noformat}, etc.
  if (/^\{(?:code|noformat)(?::[^}]*)?\}$/.test(line)) {
    return `<span class="wiki-code-fence">${esc}</span>`
  }

  // Blockquote: bq. text
  if (/^bq\. /.test(line)) {
    return esc.replace(/^(bq\.)/, '<span class="wiki-blockquote">$1</span>')
  }

  // List items: * item (unordered) or # item (ordered), one or more prefix chars
  if (/^[*#]+ /.test(line)) {
    return esc.replace(/^([*#]+)/, '<span class="wiki-list-marker">$1</span>')
  }

  // For remaining lines apply inline token highlighting
  return applyInlineHighlights(esc)
}

/**
 * Applies inline Jira Wiki Markup highlighting to an already-HTML-escaped line.
 * Processes: inline code {{...}}, bold *...*, italic _..._, links [text|url].
 *
 * IMPORTANT: `esc` has already been HTML-escaped. The regexes below match
 * against the escaped form. Since escaping only affects `<>&"` characters
 * (none of which are Jira inline delimiters), the patterns work correctly.
 */
function applyInlineHighlights(esc: string): string {
  // Process in a defined order so that inline-code spans are applied last
  // and do not have bold/italic applied inside them.
  let result = esc

  // Inline code: {{text}} — apply first, protect content from further processing
  // Use a placeholder to prevent bold/italic from matching inside code spans.
  const codeSegments: string[] = []
  result = result.replace(/\{\{(.+?)\}\}/g, (_, inner: string) => {
    const idx = codeSegments.length
    codeSegments.push(`<span class="wiki-inline-code">{{${inner}}}</span>`)
    return `\x01${idx}\x01`
  })

  // Links: [text|url] or [url]
  result = result.replace(/\[([^\]]+)\]/g, (match) => {
    return `<span class="wiki-link">${match}</span>`
  })

  // Bold: *text* (non-greedy, no nesting)
  result = result.replace(/\*([^*\n]+)\*/g, (match) => {
    return `<span class="wiki-bold">${match}</span>`
  })

  // Italic: _text_ (non-greedy, no nesting)
  result = result.replace(/_([^_\n]+)_/g, (match) => {
    return `<span class="wiki-italic">${match}</span>`
  })

  // Restore inline code placeholders
  result = result.replace(/\x01(\d+)\x01/g, (_, idx: string) => codeSegments[Number(idx)] ?? '')

  return result
}
