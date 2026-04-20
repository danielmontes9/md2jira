/**
 * URL-safe base64 (base64url) encoding/decoding of Markdown strings for the ?md= URL param.
 *
 * Standard btoa uses `+` and `/` which are not URL-safe and get mangled by
 * messaging apps (Slack, Teams). We replace them with `-` and `_` (base64url spec,
 * RFC 4648 §5) and strip padding `=` so the URL is clean.
 */

// Max URL-safe encoded length (~1500 chars encoded ≈ ~1000 chars raw markdown).
// Beyond this limit we skip updating the ?md= param to avoid exceeding browser URL limits.
export const URL_MD_MAX_ENCODED = 1500

export function encodeMarkdown(md: string): string {
  return btoa(encodeURIComponent(md)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeMarkdown(encoded: string): string {
  // Guard against decoding arbitrarily large URL params (DoS / memory pressure)
  if (encoded.length > URL_MD_MAX_ENCODED * 2) return ''
  try {
    // Restore base64url → standard base64 before decoding
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    return decodeURIComponent(atob(b64))
  } catch {
    return ''
  }
}

/**
 * Default Markdown shown on first load and in tests.
 * Lives here (rather than App.tsx) so it is accessible to utilities and tests
 * without importing the root component.
 */
export const PLACEHOLDER = `# My Issue

Some **bold** text, _italic_, and ~~strikethrough~~.

## Details

| Field | Value |
|-------|-------|
| Status | In Progress |
| Priority | **High** |

- Item 1
- Item 2
  - Nested item

\`\`\`js
console.log("hello")
\`\`\`

> A blockquote

[Jira Docs](https://confluence.atlassian.com/jira)
`

/** Reads the initial Markdown from the `?md=` URL parameter, or falls back to `placeholder`. */
export function getInitialMarkdown(placeholder: string): string {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('md')
  if (encoded) {
    const decoded = decodeMarkdown(encoded)
    if (decoded) return decoded
  }
  return placeholder
}
