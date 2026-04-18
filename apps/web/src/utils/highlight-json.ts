/**
 * Escapes HTML special characters so a string is safe to embed in HTML.
 * Handles the five characters required by the HTML spec: & < > " '
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Produces an HTML string with syntax-highlighted JSON tokens wrapped in `<span>` elements.
 *
 * The input is first HTML-escaped, so the output is safe to set via `innerHTML`
 * (the only injected markup is our own `<span>` tags with whitelisted `class` values).
 */
export function highlightJson(json: string): string {
  // Escape HTML entities before injecting any markup.
  // Note: highlightJson only needs & < > " (not ') because JSON doesn't contain
  // unquoted single quotes, so we keep the original four-replace chain for perf.
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return escaped.replace(
    // Matches: quoted strings (keys end with :), booleans, null, numbers
    /(&quot;(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\&])*&quot;(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls: string
      if (match.startsWith('&quot;')) {
        cls = match.endsWith(':') ? 'json-key' : 'json-string'
      } else if (match === 'true' || match === 'false') {
        cls = 'json-boolean'
      } else if (match === 'null') {
        cls = 'json-null'
      } else {
        cls = 'json-number'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}
