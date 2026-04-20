import type { Node, Mark } from '@tiptap/pm/model'

/**
 * Serializes a TipTap/ProseMirror document node directly to a Markdown string.
 *
 * Replaces the Turndown HTML→Markdown round-trip that was used in
 * useTiptapEditor: instead of converting the editor's HTML output back to
 * Markdown (which loses marks that have no HTML equivalent, such as
 * subscript/superscript/colour), this function walks the ProseMirror document
 * tree directly.  No DOM access, no HTML round-trip, no extra dependency.
 *
 * Node/mark names are TipTap camelCase names as registered by each extension.
 */
export function tiptapDocToMarkdown(doc: Node): string {
  return serializeNode(doc, { listDepth: 0, listType: null }).trim()
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface Ctx {
  listDepth: number
  listType: 'bullet' | 'ordered' | null
}

// ─── Node serializers ─────────────────────────────────────────────────────────

function serializeNode(node: Node, ctx: Ctx): string {
  switch (node.type.name) {
    case 'doc':
      return serializeChildren(node, ctx)

    case 'paragraph':
      return serializeInline(node) + '\n\n'

    case 'heading': {
      const level = (node.attrs as { level: number }).level
      return '#'.repeat(level) + ' ' + serializeInline(node) + '\n\n'
    }

    case 'blockquote': {
      const inner = serializeChildren(node, ctx).trim()
      return (
        inner
          .split('\n')
          .map((l) => '> ' + l)
          .join('\n') + '\n\n'
      )
    }

    case 'codeBlock': {
      const lang = (node.attrs as { language?: string }).language ?? ''
      return '```' + lang + '\n' + node.textContent + '\n```\n\n'
    }

    case 'bulletList':
      return serializeChildren(node, { listDepth: ctx.listDepth + 1, listType: 'bullet' }) + '\n'

    case 'taskList':
      return serializeChildren(node, { listDepth: ctx.listDepth + 1, listType: 'bullet' }) + '\n'

    case 'orderedList':
      return serializeChildren(node, { listDepth: ctx.listDepth + 1, listType: 'ordered' }) + '\n'

    case 'listItem': {
      const indent = '  '.repeat(Math.max(0, ctx.listDepth - 1))
      const marker = ctx.listType === 'ordered' ? '1. ' : '- '
      const content = serializeChildren(node, ctx).trim()
      // Indent continuation lines so they stay inside the list item
      return indent + marker + content.replace(/\n/g, '\n' + indent + '  ') + '\n'
    }

    case 'taskItem': {
      const checked = (node.attrs as { checked: boolean }).checked
      const indent = '  '.repeat(Math.max(0, ctx.listDepth - 1))
      const content = serializeChildren(node, ctx).trim()
      return (
        indent + `- [${checked ? 'x' : ' '}] ` + content.replace(/\n/g, '\n' + indent + '  ') + '\n'
      )
    }

    case 'horizontalRule':
      return '---\n\n'

    case 'hardBreak':
      return '  \n'

    case 'table':
      return serializeTable(node)

    case 'text':
      return applyMarks(node.text ?? '', node.marks)

    default:
      if (node.isText) return applyMarks(node.text ?? '', node.marks)
      if (node.isLeaf) return ''
      return serializeChildren(node, ctx)
  }
}

function serializeChildren(node: Node, ctx: Ctx): string {
  let out = ''
  node.forEach((child) => {
    out += serializeNode(child, ctx)
  })
  return out
}

// ─── Inline serializer ────────────────────────────────────────────────────────

/**
 * Serializes the inline children of a block node (paragraph, heading, etc.).
 * Merges adjacent text nodes with identical mark sets before wrapping so that
 * contiguous bold/italic runs don't produce redundant delimiter sequences
 * like `**hello****world**`.
 */
function serializeInline(parent: Node): string {
  const parts: string[] = []
  let i = 0
  const n = parent.childCount

  while (i < n) {
    const child = parent.child(i)

    if (child.isText) {
      // Merge contiguous text nodes with identical marks
      let text = child.text ?? ''
      let j = i + 1
      while (j < n && parent.child(j).isText && sameMarks(parent.child(j).marks, child.marks)) {
        text += parent.child(j).text ?? ''
        j++
      }
      parts.push(applyMarks(text, child.marks))
      i = j
    } else if (child.type.name === 'hardBreak') {
      parts.push('  \n')
      i++
    } else {
      // Inline node with children (e.g. a link node wrapping text) — recurse
      parts.push(serializeInline(child))
      i++
    }
  }

  return parts.join('')
}

function sameMarks(a: readonly Mark[], b: readonly Mark[]): boolean {
  if (a.length !== b.length) return false
  return a.every((m, idx) => m.eq(b[idx]!))
}

// ─── Mark application ─────────────────────────────────────────────────────────

/**
 * Priority order for mark wrapping: higher number → applied first (innermost).
 * `code` is last because backtick spans cannot contain other Markdown syntax.
 */
const MARK_PRIORITY: Record<string, number> = {
  link: 0,
  bold: 1,
  italic: 2,
  strike: 3,
  underline: 4,
  subscript: 5,
  superscript: 5,
  textStyle: 6,
  code: 99,
}

function applyMarks(text: string, marks: readonly Mark[]): string {
  if (marks.length === 0) return text
  const sorted = [...marks].sort(
    (a, b) => (MARK_PRIORITY[b.type.name] ?? 50) - (MARK_PRIORITY[a.type.name] ?? 50)
  )
  let result = text
  for (const mark of sorted) {
    result = applyMark(mark, result)
  }
  return result
}

function applyMark(mark: Mark, text: string): string {
  switch (mark.type.name) {
    case 'bold':
      return `**${text}**`
    case 'italic':
      return `_${text}_`
    case 'code':
      return `\`${text}\``
    case 'strike':
      return `~~${text}~~`
    case 'underline':
      return `<u>${text}</u>`
    case 'subscript':
      return `<sub>${text}</sub>`
    case 'superscript':
      return `<sup>${text}</sup>`
    case 'textStyle': {
      const color = (mark.attrs as { color?: string }).color
      return color ? `<span style="color:${color}">${text}</span>` : text
    }
    case 'link': {
      const { href = '', title } = mark.attrs as { href?: string; title?: string }
      return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`
    }
    default:
      return text
  }
}

// ─── Table serializer ─────────────────────────────────────────────────────────

function serializeTable(table: Node): string {
  if (table.childCount === 0) return ''

  const rows: string[][] = []

  table.forEach((rowNode) => {
    const cells: string[] = []
    rowNode.forEach((cellNode) => {
      // Collect inline content from each paragraph inside the cell
      let cellContent = ''
      cellNode.forEach((child) => {
        cellContent += serializeInline(child)
      })
      // Escape pipe characters that would break the table syntax
      cells.push(cellContent.trim().replace(/\|/g, '\\|'))
    })
    rows.push(cells)
  })

  const colCount = Math.max(...rows.map((r) => r.length))

  // Pad all rows to the same column count
  const paddedRows = rows.map((row) => [
    ...row,
    ...Array<string>(Math.max(0, colCount - row.length)).fill(''),
  ])

  const firstRow = paddedRows[0]!
  const separator = Array<string>(colCount).fill('---')

  let out = '| ' + firstRow.join(' | ') + ' |\n'
  out += '| ' + separator.join(' | ') + ' |\n'
  for (let i = 1; i < paddedRows.length; i++) {
    out += '| ' + paddedRows[i]!.join(' | ') + ' |\n'
  }

  return out + '\n'
}
