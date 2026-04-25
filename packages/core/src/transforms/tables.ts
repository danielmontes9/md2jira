import type { Table, TableCell } from 'mdast'
import { convertInlineChildren } from './formatting.js'
import { normalizeTableColumnCount } from '../utils.js'

/**
 * Escapes `|` characters that appear outside of Jira link brackets `[text|url]`.
 * Tracks bracket depth so the separator `|` inside Jira links is never escaped.
 */
function escapePipesOutsideBrackets(text: string): string {
  let result = ''
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (ch === '[') {
      depth++
      result += ch
    } else if (ch === ']') {
      if (depth > 0) depth--
      result += ch
    } else if (ch === '|' && depth === 0) {
      result += '\\|'
    } else {
      result += ch
    }
  }
  return result
}

function escapeJiraCell(text: string): string {
  let escaped = text
  // 1. Escape lone Jira macro delimiters { and } but NOT {{ }} sequences.
  //    {{...}} is produced by transformInlineCode and must reach Jira intact
  //    so it renders as inline-code monospace formatting inside table cells.
  //    Negative lookahead/lookbehind selects only single braces.
  escaped = escaped.replace(/(?<!\{)\{(?!\{)/g, '\\{').replace(/(?<!\})\}(?!\})/g, '\\}')
  // 2. Escape | that are not inside [text|url] Jira links
  escaped = escapePipesOutsideBrackets(escaped)
  // 3. Escape standalone brackets [text] (no URL pattern) as \[text\]
  escaped = escaped.replace(/\[([^\]|]*)\]/g, (match, inner: string) => {
    // If it already looks like a Jira link [text|url], don't escape
    if (inner.includes('|')) return match
    return `\\[${inner}\\]`
  })
  return escaped
}

function getCellText(cell: TableCell): string {
  const text = convertInlineChildren(cell.children)
  return escapeJiraCell(text)
}

export function transformTable(node: Table): string {
  const rows = node.children
  if (rows.length === 0) return ''

  const colCount = normalizeTableColumnCount(rows)
  const lines: string[] = []

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]!
    const cells: string[] = []

    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const cell = row.children[colIdx]
      cells.push(cell ? getCellText(cell) : '')
    }

    if (rowIdx === 0) {
      // Header row: ||heading1||heading2||
      lines.push(`||${cells.join('||')}||`)
    } else {
      // Data row: |cell1|cell2|
      lines.push(`|${cells.join('|')}|`)
    }
  }

  return lines.join('\n')
}
