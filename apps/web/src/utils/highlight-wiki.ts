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

  // Headings: h1. text → h6. text — wrap the 'hX.' prefix and apply inline
  // highlights to the title content so *bold* / _italic_ inside headings renders.
  // All heading prefixes are exactly 3 chars ('h1.'–'h6.') followed by a space.
  if (/^h[1-6]\. /.test(line)) {
    const content = applyInlineHighlights(esc.slice(4))
    return '<span class="wiki-heading">' + esc.slice(0, 3) + '</span> ' + content
  }

  // Horizontal rule
  if (line.trim() === '----') {
    return `<span class="wiki-rule">${esc}</span>`
  }

  // Table rows: lines starting with | (includes || header rows).
  // Scan the already-HTML-escaped line, wrapping each pipe delimiter in a
  // span and applying inline highlighting to the content between delimiters.
  if (/^\s*\|/.test(line)) {
    let result = ''
    let i = 0
    while (i < esc.length) {
      if (esc[i] === '|' && esc[i + 1] === '|') {
        result += '<span class="wiki-th">||</span>'
        i += 2
      } else if (esc[i] === '|') {
        result += '<span class="wiki-td">|</span>'
        i += 1
      } else {
        // Collect cell content until the next unbracketed '|'.
        // Skip over [...] sequences so the pipe inside [text|url] links is
        // not mistaken for a cell delimiter.
        let segEnd = i
        while (segEnd < esc.length) {
          if (esc[segEnd] === '[') {
            // Advance past the matching ']', or to end-of-string if unmatched.
            const close = esc.indexOf(']', segEnd + 1)
            segEnd = close === -1 ? esc.length : close + 1
          } else if (esc[segEnd] === '|') {
            break
          } else {
            segEnd++
          }
        }
        result += applyInlineHighlights(esc.slice(i, segEnd))
        i = segEnd
      }
    }
    return result
  }

  // Code block delimiters: {code}, {code:language=js}, {noformat}, etc.
  if (/^\{(?:code|noformat)(?::[^}]*)?\}$/.test(line)) {
    return `<span class="wiki-code-fence">${esc}</span>`
  }

  // Block macros: {info}, {note}, {warning}, {tip}, {quote}, {panel:title=...}
  if (/^\{(?:panel|info|note|warning|tip|quote)(?::[^}]*)?\}$/.test(line)) {
    return `<span class="wiki-block-macro">${esc}</span>`
  }

  // Blockquote: bq. text — wrap 'bq.' prefix and apply inline highlights to
  // the quoted content so formatting like *bold* and _italic_ is rendered.
  // 'bq.' = 3 chars, 'bq. ' = 4 chars; these are not HTML-special so esc
  // starts with the same bytes.
  if (/^bq\. /.test(line)) {
    const content = applyInlineHighlights(esc.slice(4))
    return '<span class="wiki-blockquote">bq.</span> ' + content
  }

  // List items: * item (unordered) or # item (ordered), one or more prefix chars.
  // Wrap the marker(s) in wiki-list-marker and apply inline highlights to the
  // item content so *bold* / _italic_ in list text is rendered correctly.
  if (/^[*#]+ /.test(line)) {
    // Non-null: we already confirmed the pattern matches, and */#/space are
    // not HTML-special so esc starts with the same bytes as line.
    const markerMatch = /^([*#]+) /.exec(esc)!
    const prefix = markerMatch[1]!
    const content = applyInlineHighlights(esc.slice(markerMatch[0].length))
    return `<span class="wiki-list-marker">${prefix}</span> ` + content
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
  // Process in a defined order so that inner content is never double-highlighted.
  // Inline code and links are protected with placeholders before bold/italic run.
  let result = esc

  // 1. Inline code: {{text}} — protect content from all further processing.
  const codeSegments: string[] = []
  result = result.replace(/\{\{(.+?)\}\}/g, (_, inner: string) => {
    const idx = codeSegments.length
    codeSegments.push(`<span class="wiki-inline-code">{{${inner}}}</span>`)
    return `\x01${idx}\x01`
  })

  // 2. Links: [text|url] or [url] — protect from bold/italic matching inside.
  const linkSegments: string[] = []
  result = result.replace(/\[([^\]]+)\]/g, (match) => {
    const idx = linkSegments.length
    linkSegments.push(`<span class="wiki-link">${match}</span>`)
    return `\x02${idx}\x02`
  })

  // 3. Color macro tokens: {color:VALUE} and {color} (close tag)
  result = result.replace(/\{color(?::[^}]*)?\}/g, (match) => {
    return `<span class="wiki-macro">${match}</span>`
  })

  // 4. Bold: *text* (non-greedy, no nesting)
  result = result.replace(/\*([^*\n]+)\*/g, (match) => {
    return `<span class="wiki-bold">${match}</span>`
  })

  // 5. Italic: _text_ (non-greedy, no nesting)
  result = result.replace(/_([^_\n]+)_/g, (match) => {
    return `<span class="wiki-italic">${match}</span>`
  })

  // 6. Strikethrough: -text- (Jira wiki output for ~~text~~ from Markdown).
  //    Negative lookarounds prevent false positives in hyphenated words and dates
  //    (e.g. "e-mail" or "2024-04-20" are not matched).
  result = result.replace(
    /(?<![a-zA-Z0-9])-([^\s-](?:[^-\n]*[^\s-])?)-(?![a-zA-Z0-9])/g,
    (match) => `<span class="wiki-strike">${match}</span>`
  )

  // 7. Restore link placeholders
  result = result.replace(/\x02(\d+)\x02/g, (_, idx: string) => linkSegments[Number(idx)] ?? '')

  // 8. Restore inline code placeholders
  result = result.replace(/\x01(\d+)\x01/g, (_, idx: string) => codeSegments[Number(idx)] ?? '')

  return result
}
