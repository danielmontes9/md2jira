import type { Blockquote, Code, Heading, List, Paragraph, RootContent, Table } from 'mdast'
import { convertInlineChildren } from './transforms/formatting.js'
import { transformHeading } from './transforms/headers.js'
import { transformList } from './transforms/lists.js'
import { transformCodeBlock } from './transforms/codeblocks.js'
import { transformTable } from './transforms/tables.js'
import { parseMarkdown } from './parse.js'

function transformBlockquote(node: Blockquote): string {
  const parts: string[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const text = convertInlineChildren((child as Paragraph).children)
      // Hard line breaks within the paragraph produce \n; each sub-line needs its own bq. prefix.
      for (const sub of text.split('\n')) {
        parts.push(`bq. ${sub}`)
      }
    }
  }
  return parts.join('\n')
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

  const tree = parseMarkdown(md)

  const parts: string[] = []

  for (const node of tree.children) {
    const result = transformNode(node)
    if (result !== null) {
      parts.push(result)
    }
  }

  return parts.join('\n\n')
}
