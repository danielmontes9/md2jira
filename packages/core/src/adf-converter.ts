import type {
  Blockquote,
  Code,
  Heading,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  RootContent,
  Table,
  TableCell,
  TableRow,
  Strong,
  Emphasis,
  Delete,
  InlineCode,
  Link,
  Text,
} from 'mdast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { preprocessMarkdown } from './preprocess.js'
import type {
  AdfBlockNode,
  AdfDocument,
  AdfInlineNode,
  AdfListItemNode,
  AdfMark,
  AdfTableCellNode,
  AdfTableHeaderNode,
  AdfTableRowNode,
} from './adf-types.js'

function convertInlineToAdf(
  node: PhrasingContent,
  parentMarks: AdfMark[] = []
): AdfInlineNode[] {
  switch (node.type) {
    case 'text':
      return [
        {
          type: 'text',
          text: (node as Text).value,
          ...(parentMarks.length > 0 ? { marks: [...parentMarks] } : {}),
        },
      ]
    case 'strong': {
      const marks: AdfMark[] = [...parentMarks, { type: 'strong' }]
      return (node as Strong).children.flatMap((child) =>
        convertInlineToAdf(child, marks)
      )
    }
    case 'emphasis': {
      const marks: AdfMark[] = [...parentMarks, { type: 'em' }]
      return (node as Emphasis).children.flatMap((child) =>
        convertInlineToAdf(child, marks)
      )
    }
    case 'delete': {
      const marks: AdfMark[] = [...parentMarks, { type: 'strike' }]
      return (node as Delete).children.flatMap((child) =>
        convertInlineToAdf(child, marks)
      )
    }
    case 'inlineCode':
      return [
        {
          type: 'text',
          text: (node as InlineCode).value,
          marks: [...parentMarks, { type: 'code' }],
        },
      ]
    case 'link': {
      const linkNode = node as Link
      const marks: AdfMark[] = [
        ...parentMarks,
        { type: 'link', attrs: { href: linkNode.url } },
      ]
      return linkNode.children.flatMap((child) =>
        convertInlineToAdf(child, marks)
      )
    }
    case 'break':
      return [{ type: 'hardBreak' }]
    case 'image':
      return []
    default:
      return []
  }
}

function convertChildrenToAdf(children: PhrasingContent[]): AdfInlineNode[] {
  return children.flatMap((child) => convertInlineToAdf(child))
}

function transformHeadingToAdf(node: Heading): AdfBlockNode {
  return {
    type: 'heading',
    attrs: { level: Math.min(node.depth, 6) },
    content: convertChildrenToAdf(node.children),
  }
}

function transformParagraphToAdf(node: Paragraph): AdfBlockNode {
  return {
    type: 'paragraph',
    content: convertChildrenToAdf(node.children),
  }
}

function transformListToAdf(node: List): AdfBlockNode {
  const items: AdfListItemNode[] = (node.children as ListItem[]).map((item) => {
    const content: AdfBlockNode[] = []
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        content.push(transformParagraphToAdf(child as Paragraph))
      } else if (child.type === 'list') {
        content.push(transformListToAdf(child as List))
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

function transformBlockquoteToAdf(node: Blockquote): AdfBlockNode {
  const content: AdfBlockNode[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      content.push(transformParagraphToAdf(child as Paragraph))
    }
  }
  return { type: 'blockquote', content }
}

function transformTableToAdf(node: Table): AdfBlockNode {
  const rows = node.children as TableRow[]
  const adfRows: AdfTableRowNode[] = []

  // Calculate max columns for normalization
  let maxCols = 0
  for (const row of rows) {
    if (row.children.length > maxCols) maxCols = row.children.length
  }

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]!
    const cells: (AdfTableHeaderNode | AdfTableCellNode)[] = []

    for (let colIdx = 0; colIdx < maxCols; colIdx++) {
      const cell = row.children[colIdx] as TableCell | undefined
      const cellContent: AdfBlockNode[] = cell
        ? [
            {
              type: 'paragraph' as const,
              content: convertChildrenToAdf(cell.children),
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

function transformNodeToAdf(node: RootContent): AdfBlockNode | null {
  switch (node.type) {
    case 'heading':
      return transformHeadingToAdf(node as Heading)
    case 'paragraph':
      return transformParagraphToAdf(node as Paragraph)
    case 'list':
      return transformListToAdf(node as List)
    case 'code':
      return transformCodeBlockToAdf(node as Code)
    case 'blockquote':
      return transformBlockquoteToAdf(node as Blockquote)
    case 'thematicBreak':
      return { type: 'rule' }
    case 'table':
      return transformTableToAdf(node as Table)
    case 'html':
      return null
    case 'yaml':
      return null
    default:
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
export function convertToAdf(md: string): AdfDocument {
  const emptyDoc: AdfDocument = { version: 1, type: 'doc', content: [] }

  if (!md.trim()) return emptyDoc

  const tree = unified().use(remarkParse).use(remarkGfm).parse(preprocessMarkdown(md))

  const content: AdfBlockNode[] = []
  for (const node of tree.children) {
    const result = transformNodeToAdf(node)
    if (result !== null) {
      content.push(result)
    }
  }

  return { version: 1, type: 'doc', content }
}
