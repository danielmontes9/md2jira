import type { Table, TableRow, TableCell } from 'mdast'
import { convertInlineChildren } from './formatting.js'

function escapeJiraCell(text: string): string {
  let escaped = text
  escaped = escaped.replace(/\{/g, '\\{').replace(/\}/g, '\\}')
  // Escape standalone brackets [text] (no URL pattern)
  escaped = escaped.replace(/\[([^\]|]*)\]/g, (match, inner: string) => {
    // If it already looks like a Jira link [text|url], don't escape
    if (inner.includes('|')) return match
    // If it looks like a converted link, don't escape
    return `\\[${inner}\\]`
  })
  return escaped
}

function getCellText(cell: TableCell): string {
  const text = convertInlineChildren(cell.children)
  return escapeJiraCell(text)
}

function normalizeColumnCount(rows: TableRow[]): number {
  let maxCols = 0
  for (const row of rows) {
    if (row.children.length > maxCols) {
      maxCols = row.children.length
    }
  }
  return maxCols
}

export function transformTable(node: Table): string {
  const rows = node.children
  if (rows.length === 0) return ''

  const colCount = normalizeColumnCount(rows)
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
