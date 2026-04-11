import type { Blockquote, Code, Heading, List, Paragraph, RootContent, Table } from 'mdast'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { convertInlineChildren } from './transforms/formatting.js'
import { transformHeading } from './transforms/headers.js'
import { transformList } from './transforms/lists.js'
import { transformCodeBlock } from './transforms/codeblocks.js'
import { transformTable } from './transforms/tables.js'
import { preprocessMarkdown } from './preprocess.js'

function transformBlockquote(node: Blockquote): string {
  const lines: string[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      lines.push(convertInlineChildren((child as Paragraph).children))
    }
  }
  return lines.map((line) => `bq. ${line}`).join('\n')
}

function transformNode(node: RootContent): string | null {
  switch (node.type) {
    case 'heading':
      return transformHeading(node as Heading)
    case 'paragraph':
      return convertInlineChildren((node as Paragraph).children)
    case 'list':
      return transformList(node as List)
    case 'code':
      return transformCodeBlock(node as Code)
    case 'blockquote':
      return transformBlockquote(node as Blockquote)
    case 'thematicBreak':
      return '----'
    case 'table':
      return transformTable(node as Table)
    case 'html':
      // Out of scope - ignore silently
      return null
    case 'yaml':
      // Frontmatter - skip silently
      return null
    default:
      return null
  }
}

/**
 * Converts a Markdown string to Jira Wiki Markup.
 *
 * @param md - The Markdown string to convert.
 * @returns The converted Jira Wiki Markup string.
 */
export function convert(md: string): string {
  if (!md.trim()) return ''

  const tree = unified().use(remarkParse).use(remarkGfm).parse(preprocessMarkdown(md))

  const parts: string[] = []

  for (const node of tree.children) {
    const result = transformNode(node)
    if (result !== null) {
      parts.push(result)
    }
  }

  return parts.join('\n\n')
}
