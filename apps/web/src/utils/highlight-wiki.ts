import { escapeHtml } from './escape-html.js'

/**
 * Produces an HTML string with syntax-highlighted Jira Wiki Markup tokens
 * wrapped in `<span>` elements.
 *
 * Processes the input line-by-line to identify structural tokens (headings,
 * table delimiters, code-block fences, horizontal rules). The input is
 * HTML-escaped before any markup is injected, so the output is safe to set
 * via `innerHTML`.
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

  return esc
}
