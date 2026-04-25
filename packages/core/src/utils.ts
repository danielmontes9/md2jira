import type { TableRow } from 'mdast'

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
   * mdast block node types whose output should be suppressed.
   * Valid values match mdast block node type names:
   * `'heading' | 'list' | 'code' | 'blockquote' | 'table' | 'thematicBreak'`
   */
  disableTransforms?: ReadonlyArray<
    'heading' | 'list' | 'code' | 'blockquote' | 'table' | 'thematicBreak' | 'panel'
  >
}
