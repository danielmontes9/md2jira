import type { RootContent } from 'mdast'
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
      return transformHeading(node)
    case 'paragraph':
      return convertInlineChildren(node.children)
    case 'list':
      return transformList(node)
    case 'code':
      return transformCodeBlock(node)
    case 'blockquote':
      return transformBlockquote(node)
    case 'thematicBreak':
      return '----'
    case 'table':
      return transformTable(node)
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
      if ('value' in node && typeof (node as { value: unknown }).value === 'string') {
        return (node as { value: string }).value
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
