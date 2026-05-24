/**
 * Lazy-loaded DOMPurify wrapper used by useTiptapEditor to sanitize HTML
 * before injecting it into the TipTap editor.
 *
 * Extracted from useTiptapEditor.ts so the sanitization logic is independently
 * testable and reusable without importing the full TipTap hook.
 *
 * DOMPurify is loaded in a separate chunk so it never blocks initial parse.
 * The fallback (tag-strip) is used only on the rare initial frame before the
 * promise resolves, or when DOMPurify fails to load (e.g. strict CSP).
 * HTML always originates from our own adfToHtml renderer, so the fallback
 * risk is minimal — we never pass untrusted markup through unfiltered.
 */
let _DOMPurify: null | { sanitize: (html: string) => string } = null

import('dompurify')
  .then((m) => {
    _DOMPurify = m.default
  })
  /* v8 ignore next 3 -- DOMPurify is a bundled local module; this catch is a defense-in-depth guard */
  .catch(() => {
    // DOMPurify failed to load (e.g. strict CSP). stripTags fallback remains.
  })

/** Strip all HTML tags as a last-resort fallback when DOMPurify is unavailable.
 *
 * The regex consumes quoted attribute values before matching '>' so that
 * attributes containing literal '>' (e.g. <img src="x>">) are handled
 * correctly and no residual markup leaks into the output.
 */
export function stripTags(html: string): string {
  return html.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '')
}

/** Sanitize HTML with DOMPurify, falling back to tag-stripping if unavailable. */
export function sanitize(html: string): string {
  if (_DOMPurify) return _DOMPurify.sanitize(html)
  /* v8 ignore next -- DOMPurify is always loaded in tests; this is the bare fallback */
  return stripTags(html)
}
