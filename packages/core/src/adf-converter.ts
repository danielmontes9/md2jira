import type {
  Blockquote,
  Code,
  Heading,
  Image,
  List,
  Paragraph,
  PhrasingContent,
  RootContent,
  Table,
} from 'mdast'
import { parseMarkdown } from './parse.js'
import { hasStringValue, normalizeTableColumnCount, resolveUrl } from './utils.js'
import type { ConvertOptions } from './utils.js'
import { detectAlertType, stripAlertMarker, ALERT_TO_ADF_PANEL } from './transforms/blockquotes.js'
import type {
  AdfBlockNode,
  AdfDocument,
  AdfInlineNode,
  AdfListItemNode,
  AdfMark,
  AdfMediaSingleNode,
  AdfTableCellNode,
  AdfTableHeaderNode,
  AdfTableRowNode,
  AdfTaskItemNode,
  AdfTaskListNode,
} from './adf-types.js'

function convertInlineToAdf(
  node: PhrasingContent,
  parentMarks: AdfMark[] = [],
  baseUrl?: string
): AdfInlineNode[] {
  switch (node.type) {
    case 'text':
      return [
        {
          type: 'text',
          text: node.value,
          ...(parentMarks.length > 0 ? { marks: [...parentMarks] } : {}),
        },
      ]
    case 'strong': {
      const marks: AdfMark[] = [...parentMarks, { type: 'strong' }]
      return node.children.flatMap((child) => convertInlineToAdf(child, marks, baseUrl))
    }
    case 'emphasis': {
      const marks: AdfMark[] = [...parentMarks, { type: 'em' }]
      return node.children.flatMap((child) => convertInlineToAdf(child, marks, baseUrl))
    }
    case 'delete': {
      const marks: AdfMark[] = [...parentMarks, { type: 'strike' }]
      return node.children.flatMap((child) => convertInlineToAdf(child, marks, baseUrl))
    }
    case 'inlineCode':
      return [
        {
          type: 'text',
          text: node.value,
          marks: [...parentMarks, { type: 'code' }],
        },
      ]
    case 'link': {
      const resolvedHref = resolveUrl(node.url, baseUrl)
      const marks: AdfMark[] = [...parentMarks, { type: 'link', attrs: { href: resolvedHref } }]
      if (node.children.length === 0) {
        // Empty link text [](url) — use the URL itself as the display text
        return [{ type: 'text', text: resolvedHref, marks }]
      }
      return node.children.flatMap((child) => convertInlineToAdf(child, marks, baseUrl))
    }
    case 'break':
      return [{ type: 'hardBreak' }]
    case 'image':
      // Images become block-level mediaSingle nodes — skip inline emission
      return []
    default:
      return []
  }
}

function transformImageToMediaSingle(node: Image, baseUrl?: string): AdfMediaSingleNode {
  const url = resolveUrl(node.url, baseUrl)
  const media = node.alt
    ? { type: 'media' as const, attrs: { type: 'external' as const, url, alt: node.alt } }
    : { type: 'media' as const, attrs: { type: 'external' as const, url } }
  return { type: 'mediaSingle', attrs: { layout: 'center' }, content: [media] }
}

function convertChildrenToAdf(children: PhrasingContent[], baseUrl?: string): AdfInlineNode[] {
  return children.flatMap((child) => convertInlineToAdf(child, [], baseUrl))
}

function transformHeadingToAdf(node: Heading, baseUrl?: string): AdfBlockNode {
  return {
    type: 'heading',
    attrs: { level: Math.min(node.depth, 6) as 1 | 2 | 3 | 4 | 5 | 6 },
    content: convertChildrenToAdf(node.children, baseUrl),
  }
}

function transformParagraphToAdf(node: Paragraph, baseUrl?: string): AdfBlockNode {
  return {
    type: 'paragraph',
    content: convertChildrenToAdf(node.children, baseUrl),
  }
}

/**
 * Converts a paragraph to one or more ADF blocks.
 * If the paragraph contains any image nodes they are lifted to adjacent
 * mediaSingle blocks (ADF has no inline image type). Otherwise returns a
 * single paragraph block. Used by blockquote, panel, and list transforms so
 * images are never silently discarded in nested contexts.
 */
function paragraphToBlocks(node: Paragraph, baseUrl?: string): AdfBlockNode[] {
  const hasImages = node.children.some((c) => c.type === 'image' && c.url)
  return hasImages
    ? liftImagesFromParagraph(node, baseUrl)
    : [transformParagraphToAdf(node, baseUrl)]
}

/**
 * Splits a mixed paragraph (text + images) into a sequence of ADF blocks:
 *   - Text runs become `paragraph` nodes.
 *   - Image nodes become `mediaSingle` block nodes.
 *
 * ADF does not have an inline image type, so images must be lifted to block
 * level. This preserves all content instead of silently discarding images.
 *
 * Example:
 *   "See ![logo](a.png) and ![banner](b.png) here"
 *   → paragraph("See ")
 *   → mediaSingle(a.png)
 *   → paragraph(" and ")
 *   → mediaSingle(b.png)
 *   → paragraph(" here")
 */
function liftImagesFromParagraph(node: Paragraph, baseUrl?: string): AdfBlockNode[] {
  const blocks: AdfBlockNode[] = []
  let textBuffer: PhrasingContent[] = []

  const flushBuffer = () => {
    if (textBuffer.length === 0) return
    const inlineContent = convertChildrenToAdf(textBuffer, baseUrl)
    // Only emit the paragraph if it has non-empty inline content
    if (inlineContent.length > 0) {
      blocks.push({ type: 'paragraph', content: inlineContent })
    }
    textBuffer = []
  }

  for (const child of node.children) {
    if (child.type === 'image' && child.url) {
      flushBuffer()
      blocks.push(transformImageToMediaSingle(child, baseUrl))
    } else {
      textBuffer.push(child)
    }
  }
  flushBuffer()

  return blocks
}

/** Mutable context threaded through the transform functions to avoid module-level state. */
interface AdfConvertContext {
  /** Incremented each time a task list is encountered to generate unique localIds. */
  taskListIdx: number
  /** Base URL prepended to relative links (those starting with '/'). */
  baseUrl: string | undefined
  /** Set of mdast block node types to suppress. */
  disabled: ReadonlySet<string>
}

function transformListToAdf(node: List, ctx: AdfConvertContext): AdfBlockNode {
  const listItems = node.children

  // Detect GFM task list: at least one item has a checked state (boolean, not null)
  const isTaskList = !node.ordered && listItems.some((item) => item.checked !== null)

  if (isTaskList) {
    const listIdx = ctx.taskListIdx++
    const taskItems: AdfTaskItemNode[] = listItems.map((item, idx) => {
      const paragraphs = item.children.filter((c): c is Paragraph => c.type === 'paragraph')
      const content: AdfBlockNode[] = paragraphs.flatMap((p) => paragraphToBlocks(p, ctx.baseUrl))
      return {
        type: 'taskItem',
        attrs: { localId: `task-${listIdx}-${idx}`, state: item.checked ? 'DONE' : 'TODO' },
        content,
      }
    })
    const taskList: AdfTaskListNode = {
      type: 'taskList',
      attrs: { localId: `taskList-${listIdx}` },
      content: taskItems,
    }
    return taskList
  }

  const items: AdfListItemNode[] = listItems.map((item) => {
    const content: AdfBlockNode[] = []
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        content.push(...paragraphToBlocks(child, ctx.baseUrl))
      } else if (child.type === 'list') {
        content.push(transformListToAdf(child, ctx))
      }
    }
    return { type: 'listItem', content }
  })

  if (node.ordered) {
    return { type: 'orderedList', content: items }
  }
  return { type: 'bulletList', content: items }
}

function transformCodeBlockToAdf(node: Code): AdfBlockNode {
  return {
    type: 'codeBlock',
    ...(node.lang ? { attrs: { language: node.lang } } : {}),
    content: [{ type: 'text', text: node.value }],
  }
}

function transformBlockquoteToAdf(node: Blockquote, ctx: AdfConvertContext): AdfBlockNode {
  const content: AdfBlockNode[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      content.push(...paragraphToBlocks(child, ctx.baseUrl))
    } else if (child.type === 'blockquote') {
      // Nested blockquote: ADF blockquote can contain another blockquote
      content.push(transformBlockquoteToAdf(child, ctx))
    } else if (child.type === 'list') {
      content.push(transformListToAdf(child, ctx))
    } else if (child.type === 'code') {
      content.push(transformCodeBlockToAdf(child))
    }
  }
  return { type: 'blockquote', content }
}

function transformPanelToAdf(
  node: Blockquote,
  alertType: string,
  ctx: AdfConvertContext
): AdfBlockNode {
  const panelType = ALERT_TO_ADF_PANEL[alertType] ?? 'info'
  const content: AdfBlockNode[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!
    if (child.type === 'paragraph') {
      const pChildren = i === 0 ? stripAlertMarker(child.children) : child.children
      const hasImages = pChildren.some((c) => c.type === 'image' && c.url)
      if (hasImages) {
        const syntheticPara: Paragraph = { ...child, children: pChildren }
        content.push(...liftImagesFromParagraph(syntheticPara, ctx.baseUrl))
      } else {
        const inlineContent = convertChildrenToAdf(pChildren, ctx.baseUrl)
        if (inlineContent.length > 0) {
          content.push({ type: 'paragraph', content: inlineContent })
        }
      }
    } else if (child.type === 'list') {
      content.push(transformListToAdf(child, ctx))
    } else if (child.type === 'code') {
      content.push(transformCodeBlockToAdf(child))
    }
    // nested blockquotes inside a panel: skip (no ADF equivalent)
  }

  return {
    type: 'panel',
    attrs: { panelType },
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
  }
}

function transformTableToAdf(node: Table, baseUrl?: string): AdfBlockNode {
  const rows = node.children
  const adfRows: AdfTableRowNode[] = []

  const maxCols = normalizeTableColumnCount(rows)

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]!
    const cells: (AdfTableHeaderNode | AdfTableCellNode)[] = []

    for (let colIdx = 0; colIdx < maxCols; colIdx++) {
      const cell = row.children[colIdx]
      const cellContent: AdfBlockNode[] = cell
        ? [
            {
              type: 'paragraph' as const,
              content: convertChildrenToAdf(cell.children, baseUrl),
            },
          ]
        : [{ type: 'paragraph' as const, content: [] }]

      if (rowIdx === 0) {
        cells.push({ type: 'tableHeader', content: cellContent })
      } else {
        cells.push({ type: 'tableCell', content: cellContent })
      }
    }

    adfRows.push({ type: 'tableRow', content: cells })
  }

  return {
    type: 'table',
    attrs: { isNumberColumnEnabled: false, layout: 'default' },
    content: adfRows,
  }
}

function transformNodeToAdf(
  node: RootContent,
  ctx: AdfConvertContext
): AdfBlockNode | AdfBlockNode[] | null {
  if (ctx.disabled.size > 0 && ctx.disabled.has(node.type)) return null
  switch (node.type) {
    case 'heading':
      return transformHeadingToAdf(node, ctx.baseUrl)
    case 'paragraph': {
      // If the paragraph contains any image nodes, lift them to mediaSingle blocks.
      // This handles standalone images (1 image child) and mixed paragraphs (text + images).
      const hasImages = node.children.some((c) => c.type === 'image' && c.url)
      if (hasImages) {
        return liftImagesFromParagraph(node, ctx.baseUrl)
      }
      return transformParagraphToAdf(node, ctx.baseUrl)
    }
    case 'list':
      return transformListToAdf(node, ctx)
    case 'code':
      return transformCodeBlockToAdf(node)
    case 'blockquote': {
      const alertType = detectAlertType(node)
      if (alertType !== null && !ctx.disabled.has('panel'))
        return transformPanelToAdf(node, alertType, ctx)
      return transformBlockquoteToAdf(node, ctx)
    }
    case 'thematicBreak':
      return { type: 'rule' }
    case 'table':
      return transformTableToAdf(node, ctx.baseUrl)
    case 'html':
      // Out of scope — ignore silently
      return null
    case 'yaml':
      // Frontmatter — skip silently
      return null
    default:
      // Unknown node type — emit a paragraph with raw text as fallback so content
      // is not silently discarded. Future consumers (CLI, VSCode) benefit from
      // graceful degradation rather than data loss.
      if (hasStringValue(node)) {
        return {
          type: 'paragraph',
          content: [{ type: 'text', text: node.value }],
        }
      }
      return null
  }
}

/**
 * Converts a Markdown string to Atlassian Document Format (ADF).
 * ADF is the native JSON format used by Jira Cloud.
 *
 * @param md - The Markdown string to convert.
 * @returns The ADF document object.
 */
export function convertToAdf(md: string, options?: ConvertOptions): AdfDocument {
  const emptyDoc: AdfDocument = { version: 1, type: 'doc', content: [] }

  if (!md.trim()) return emptyDoc

  const ctx: AdfConvertContext = {
    taskListIdx: 0,
    baseUrl: options?.baseUrl,
    disabled: new Set(options?.disableTransforms ?? []),
  }
  const tree = parseMarkdown(md)

  const content: AdfBlockNode[] = []
  for (const node of tree.children) {
    const result = transformNodeToAdf(node, ctx)
    if (result === null) continue
    if (Array.isArray(result)) {
      content.push(...result)
    } else {
      content.push(result)
    }
  }

  return { version: 1, type: 'doc', content }
}
