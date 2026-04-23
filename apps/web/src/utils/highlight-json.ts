import { escapeHtml } from './escape-html.js'

/**
 * Produces an HTML string with syntax-highlighted JSON tokens wrapped in `<span>` elements.
 *
 * The input is first HTML-escaped, so the output is safe to set via `innerHTML`
 * (the only injected markup is our own `<span>` tags with whitelisted `class` values).
 */
/** Payloads larger than this (bytes) are returned HTML-escaped but un-highlighted
 * to avoid blocking the main thread with a very large regex scan. */
const MAX_HIGHLIGHT_BYTES = 500_000

export function highlightJson(json: string): string {
  // Skip syntax highlighting for very large payloads to avoid blocking the main thread.
  if (json.length > MAX_HIGHLIGHT_BYTES) {
    return escapeHtml(json)
  }

  // Escape HTML entities before injecting any markup.
  const escaped = escapeHtml(json)

  return escaped.replace(
    // Matches: quoted strings (keys end with :), booleans, null, numbers
    /(&quot;(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\&])*&quot;(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
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
