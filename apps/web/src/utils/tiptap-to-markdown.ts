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

/**
 * Traverses the document and returns true as soon as a mark satisfying
 * `predicate` is found. Short-circuits on first match.
 */
function hasMarkWhere(doc: Node, predicate: (mark: Mark) => boolean): boolean {
  let found = false
  doc.descendants((node) => {
    if (found) return false // short-circuit once detected
    for (const mark of node.marks) {
      if (predicate(mark)) {
        found = true
        return false
      }
    }
    return undefined // continue traversal
  })
  return found
}

/**
 * Returns true if the document contains any textStyle marks with a non-empty
 * color attribute. Used to surface a warning toast before the color is
 * silently stripped by the Markdown → Jira conversion pipeline.
 */
export function hasColorMarks(doc: Node): boolean {
  return hasMarkWhere(
    doc,
    (m) => m.type.name === 'textStyle' && !!(m.attrs as { color?: string }).color
  )
}

/**
 * Returns true if the document contains any underline marks.
 * Underline is not a standard Markdown element and will be serialized as the
 * HTML `<u>` tag. Since md2jira-core silently ignores HTML, underline
 * formatting will be lost in the Jira output — used to surface a warning.
 */
export function hasUnderlineMarks(doc: Node): boolean {
  return hasMarkWhere(doc, (m) => m.type.name === 'underline')
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

    case 'image': {
      const attrs = node.attrs as { src?: string; alt?: string; title?: string }
      // OWASP A03: only emit URLs that pass SAFE_SRC_RE into the serialized
      // Markdown. Unsafe schemes (javascript:, data:text/, data:image/svg+xml)
      // and protocol-relative URLs (//host) are replaced with '#'. The HTML
      // preview already guards via sanitizeUrl(), but the exported Markdown
      // must also be safe at the source.
      const rawSrc = attrs.src ?? ''
      const src = SAFE_SRC_RE.test(rawSrc) ? rawSrc : rawSrc ? '#' : ''
      // Escape ] inside alt — an unescaped ] closes the ![...] span and
      // produces syntactically invalid Markdown (e.g. ![click]here](url)).
      const alt = (attrs.alt ?? '').replace(/]/g, '\\]')
      return `![${alt}](${src}${escapeTitle(attrs.title)})\n\n`
    }

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

/** * Escapes characters that would be interpreted as Markdown syntax in plain-text
 * nodes (i.e. text nodes with no formatting marks). Without this, text like
 * `**not bold**` typed literally in the WYSIWYG editor would round-trip as bold
 * when the resulting Markdown is re-parsed.
 *
 * `\` must be first to prevent double-escaping.
 */
function escapeMd(text: string): string {
  return text.replace(/[\\*_`~[\]]/g, '\\$&')
}

/**
 * URL schemes and path patterns that are safe to emit in Markdown output.
 * javascript: and data:text/ can be executed by downstream parsers that
 * don't sanitize. Relative paths (root-relative, ./, ../), fragment anchors
 * (#), and action protocols (mailto:, tel:) are safe and preserved.
 * Protocol-relative URLs (//host) are excluded — they inherit the page
 * protocol and cannot be validated statically.
 * data:image/svg+xml is excluded — SVG can contain embedded <script> elements
 * that execute in some rendering contexts. Only raster subtypes are permitted.
 * The (?=[;,]) lookahead after the subtype group is intentional: it ensures
 * that a crafted subtype like "pngEVIL" does not match via prefix (RFC 2397
 * requires the subtype to be followed immediately by ';' or ','). Removing
 * the lookahead would silently re-open this bypass — do not simplify it.
 * Reused by both the image node serializer and the link mark serializer.
 *
 * The leading ^ anchors the entire group. Adding a new alternative inside
 * the group without ensuring it is anchored would be a runtime gap, not a
 * compile-time error, so review changes to this constant carefully.
 */
const SAFE_SRC_RE =
  /^(https?:\/\/|data:image\/(?:png|jpe?g|gif|webp|avif)(?=[;,])|\/(?!\/)|\.\.\/|\.\/|#|mailto:|tel:)/i

/**
 * Escapes " inside a Markdown link/image title and wraps it in the
 * standard ` "title"` suffix. Returns an empty string when title is absent.
 */
function escapeTitle(title: string | undefined): string {
  return title ? ` "${title.replace(/"/g, '\\"')}"` : ''
}

/** Priority order for mark wrapping: higher number → applied first (innermost).
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
  // No marks: escape Markdown-special characters so plain text like **foo**
  // doesn't become bold when the resulting Markdown is re-parsed.
  if (marks.length === 0) return escapeMd(text)

  // Check whether there is a `code` mark — backtick spans must contain raw
  // text (no other Markdown syntax inside), so we skip escapeMd for code.
  const hasCode = marks.some((m) => m.type.name === 'code')

  // For all non-code marks, escape the inner text first so that Markdown-
  // special characters inside a formatted run (e.g. bold text containing an
  // underscore) don't create unexpected nested formatting on round-trip.
  const base = hasCode ? text : escapeMd(text)

  const sorted = [...marks].sort(
    (a, b) => (MARK_PRIORITY[b.type.name] ?? 50) - (MARK_PRIORITY[a.type.name] ?? 50)
  )
  let result = base
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
      if (!color) return text
      // Only allow characters that are valid in CSS color values to prevent
      // CSS injection via crafted mark attributes (e.g. expression(...)).
      if (!/^[a-zA-Z0-9#(),. %+-]+$/.test(color)) return text
      return `<span style="color:${color}">${text}</span>`
    }
    case 'link': {
      const { href = '', title } = mark.attrs as { href?: string; title?: string }
      // Same OWASP A03 guard as the image node serializer: reject unsafe schemes.
      const safeHref = SAFE_SRC_RE.test(href) ? href : href ? '#' : ''
      return `[${text}](${safeHref}${escapeTitle(title)})`
    }
    default:
      return text
  }
}

// ─── Table serializer ─────────────────────────────────────────────────────────

/**
 * Serializes the inline content of a single table cell.
 *
 * Cells may contain multiple block children (paragraphs, headings). Each
 * block is serialized as inline text and joined with a `<br>` tag so the
 * content stays on one Markdown table row. Hard-break nodes inside a block
 * are also converted to `<br>` rather than the `  \n` sequence that would
 * break the table pipe structure.
 */
function serializeTableCell(cellNode: Node): string {
  const parts: string[] = []
  cellNode.forEach((child) => {
    if (child.isText) {
      parts.push(applyMarks(child.text ?? '', child.marks))
      return
    }
    // Inline leaf nodes inside a cell (e.g. hardBreak)
    if (child.type.name === 'hardBreak') {
      parts.push('<br>')
      return
    }
    // Block nodes (paragraph, heading, etc.) — serialize their inline children
    // and join multiple blocks with <br> to keep everything on one table line.
    let blockText = ''
    child.forEach((inline) => {
      if (inline.type.name === 'hardBreak') {
        blockText += '<br>'
      } else if (inline.isText) {
        blockText += applyMarks(inline.text ?? '', inline.marks)
      } else {
        // Nested inline container (e.g. link wrapping text)
        blockText += serializeInline(inline)
      }
    })
    if (blockText) parts.push(blockText)
  })
  // Escape pipe characters that would break the table syntax, then join blocks.
  return parts.join('<br>').replace(/\|/g, '\\|')
}

function serializeTable(table: Node): string {
  if (table.childCount === 0) return ''

  const rows: string[][] = []
  const colAlignments: Array<'left' | 'center' | 'right' | null> = []

  table.forEach((rowNode, _offset, rowIdx) => {
    const cells: string[] = []
    rowNode.forEach((cellNode, _cellOffset, colIdx) => {
      // Capture column alignments from the first row only.
      // The `alignment` attr is added by the AlignedTableCell/AlignedTableHeader
      // extensions in useTiptapEditor; defaults to null for standard cells.
      if (rowIdx === 0) {
        const al = (cellNode.attrs as { alignment?: string | null }).alignment ?? null
        colAlignments[colIdx] = al as 'left' | 'center' | 'right' | null
      }
      cells.push(serializeTableCell(cellNode).trim())
    })
    rows.push(cells)
  })

  const colCount = Math.max(...rows.map((r) => r.length))

  // Pad all rows to the same column count
  const paddedRows = rows.map((row) => [
    ...row,
    ...Array<string>(Math.max(0, colCount - row.length)).fill(''),
  ])

  // Build separator cells with alignment markers where applicable
  const separator = Array.from({ length: colCount }, (_, i) => {
    const al = colAlignments[i] ?? null
    if (al === 'center') return ':---:'
    if (al === 'right') return '---:'
    return '---'
  })

  const firstRow = paddedRows[0]!
  let out = '| ' + firstRow.join(' | ') + ' |\n'
  out += '| ' + separator.join(' | ') + ' |\n'
  for (let i = 1; i < paddedRows.length; i++) {
    out += '| ' + paddedRows[i]!.join(' | ') + ' |\n'
  }

  return out + '\n'
}
