import type { TableRow } from 'mdast'

/**
 * Escapes text for safe insertion into XML/HTML element bodies.
 * Used by `confluence-converter.ts` for both text nodes and attribute values.
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

/**
 * Escapes text for safe insertion into XML/XHTML element bodies.
 * Unlike `escapeHtml`, also escapes `>` for strict XML compliance.
 * Used by `confluence-converter.ts` which produces Confluence Storage Format (XHTML).
 */
export function escapeXml(text: string): string {
  return escapeHtml(text).replace(/>/g, '&gt;')
}

/**
 * Escapes a string for safe use inside a double-quoted XML attribute.
 * Builds on `escapeXml` so all XML special chars plus `"` are covered.
 */
export function escapeAttr(value: string): string {
  return escapeXml(value).replace(/"/g, '&quot;')
}

/**
 * Resolves a URL against a base URL when the URL is relative (starts with '/').
 * Shared by the Jira Wiki, ADF, and Confluence inline transform layers so
 * the resolution logic is defined exactly once.
 */
export function resolveUrl(url: string, baseUrl?: string): string {
  if (baseUrl && url.startsWith('/')) {
    return baseUrl.replace(/\/$/, '') + url
  }
  return url
}

/**
 * Returns true when an unknown remark node carries a string `.value` field.
 * Shared between converter.ts and adf-converter.ts to avoid duplicating the
 * inline `as { value: unknown }` cast in each default-case fallback.
 */
export function hasStringValue(node: object): node is { value: string } {
  return 'value' in node && typeof (node as { value: unknown }).value === 'string'
}

/**
 * Returns the maximum column count across all rows of a GFM table.
 * Shared between the Wiki Markup and ADF table transforms so both converters
 * normalise tables with unequal column counts (padding missing cells to '').
 */
export function normalizeTableColumnCount(rows: TableRow[]): number {
  let maxCols = 0
  for (const row of rows) {
    if (row.children.length > maxCols) maxCols = row.children.length
  }
  return maxCols
}

/**
 * Options accepted by `convert()` and `convertToAdf()`.
 * All fields are optional — omitting the argument preserves default behaviour.
 */
export interface ConvertOptions {
  /**
   * Base URL prepended to relative links (those starting with `/`).
   * e.g. `'https://company.atlassian.net/wiki/spaces/PROJECT'` turns
   * `[text](/page)` into `[text|https://company.atlassian.net/wiki/spaces/PROJECT/page]`.
   */
  baseUrl?: string
  /**
   * Node types whose output should be suppressed.
   * Most values correspond to mdast block node type names.
   * Exception: `'panel'` is a synthetic value (not an mdast type) that controls
   * whether GFM Alert blockquotes (`> [!NOTE]`) are rendered as panel macros
   * (`{note}` / `<ac:structured-macro ac:name="note">`) or fall back to plain
   * blockquotes. It is checked explicitly inside the blockquote handlers rather
   * than by the generic `node.type` switch.
   */
  disableTransforms?: ReadonlyArray<
    'heading' | 'list' | 'code' | 'blockquote' | 'table' | 'thematicBreak' | 'panel'
  >
}
