/**
 * Best-effort conversion of Jira Wiki Markup back to Markdown.
 * Covers the subset of constructs produced by packages/core/src/converter.ts.
 *
 * This is a one-way helper for the WYSIWYG edit mode "Sync to Markdown" button.
 * It does NOT guarantee round-trip fidelity for all edge cases.
 */
export function wikiToMarkdown(wiki: string): string {
  const lines = wiki.split('\n')
  const out: string[] = []
  let inCodeBlock = false
  let codeLang = ''

  for (const raw of lines) {
    // ── Code blocks ──────────────────────────────────────────────────────────
    if (!inCodeBlock) {
      const codeOpen = raw.match(/^\{code(?::language=([a-z0-9+#.-]+))?\}$/i)
      if (codeOpen) {
        inCodeBlock = true
        codeLang = codeOpen[1] ?? ''
        out.push('```' + codeLang)
        continue
      }
      if (/^\{noformat\}$/i.test(raw)) {
        inCodeBlock = true
        codeLang = ''
        out.push('```')
        continue
      }
    } else {
      if (/^\{(?:code|noformat)\}$/i.test(raw)) {
        inCodeBlock = false
        out.push('```')
        continue
      }
      out.push(raw)
      continue
    }

    let line = raw

    // ── Headings ──────────────────────────────────────────────────────────────
    const headingMatch = line.match(/^h([1-6])\. (.*)$/)
    if (headingMatch) {
      const level = parseInt(headingMatch[1]!, 10)
      out.push('#'.repeat(level) + ' ' + headingMatch[2])
      continue
    }

    // ── Blockquote (bq.) ──────────────────────────────────────────────────────
    if (line.startsWith('bq. ')) {
      out.push('> ' + convertInlineWikiToMd(line.slice(4)))
      continue
    }

    // ── Thematic break ────────────────────────────────────────────────────────
    if (line === '----') {
      out.push('---')
      continue
    }

    // ── Ordered list ─────────────────────────────────────────────────────────
    const olMatch = line.match(/^(#+) (.*)$/)
    if (olMatch) {
      const depth = olMatch[1]!.length
      const indent = '  '.repeat(depth - 1)
      out.push(indent + '1. ' + convertInlineWikiToMd(olMatch[2]!))
      continue
    }

    // ── Unordered list ───────────────────────────────────────────────────────
    const ulMatch = line.match(/^(\*+) (.*)$/)
    if (ulMatch) {
      const depth = ulMatch[1]!.length
      const indent = '  '.repeat(depth - 1)
      out.push(indent + '- ' + convertInlineWikiToMd(ulMatch[2]!))
      continue
    }

    // ── Normal paragraph — convert inline markup ──────────────────────────────
    out.push(convertInlineWikiToMd(line))
  }

  return out.join('\n')
}

/** Convert inline Wiki markup tokens to their Markdown equivalents. */
function convertInlineWikiToMd(text: string): string {
  return (
    text
      // {noformat} blocks (treat as code fence inline — skip content transform)
      // Inline code: {{code}} → `code`
      .replace(/\{\{([^}]+)\}\}/g, '`$1`')
      // Bold: *bold* → **bold**  (Jira uses single *, Markdown uses double)
      // Must not match list bullets — handled above, so safe here
      .replace(/\*([^*\n]+)\*/g, '**$1**')
      // Italic: _italic_ → *italic*
      .replace(/_([^_\n]+)_/g, '*$1*')
      // Strikethrough: -strike- → ~~strike~~
      // Careful: don't eat list markers.  Require non-whitespace after -
      .replace(/(?<!\s)-([^-\n]+)-/g, '~~$1~~')
      // Links: [text|url] → [text](url)
      .replace(/\[([^\]|]+)\|([^\]]+)\]/g, '[$1]($2)')
      // Links without text: [url] → [url](url)  (bare Jira link)
      .replace(/\[([^\]|]+)\]/g, '[$1]($1)')
      // Images: !url! → ![](url)
      // Images with params: !url|width=200! → ![](url)  (drop params)
      .replace(/!([^!\n|]+)(?:\|[^!]*)?!/g, '![]($1)')
  )
}
