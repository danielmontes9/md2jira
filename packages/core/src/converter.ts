import type { Blockquote, Code, Heading, List, Paragraph, RootContent, Table } from 'mdast'
import { convertInlineChildren } from './transforms/formatting.js'
import { transformHeading } from './transforms/headers.js'
import { transformList } from './transforms/lists.js'
import { transformCodeBlock } from './transforms/codeblocks.js'
import { transformTable } from './transforms/tables.js'
import { transformBlockquote } from './transforms/blockquotes.js'
import { parseMarkdown } from './parse.js'

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
    default: {
      // Unknown node type (e.g. from remark plugins) — emit raw text value if available.
      // Matches the fallback behaviour in adf-converter.ts so unknown nodes are never
      // silently discarded when they carry readable content.
      const unknown = node as { value?: unknown }
      if (typeof unknown.value === 'string' && unknown.value) {
        return unknown.value
      }
      return null
    }
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
