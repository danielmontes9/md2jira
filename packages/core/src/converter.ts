import type { RootContent } from 'mdast'
import { convertInlineChildren } from './transforms/formatting.js'
import { transformHeading } from './transforms/headers.js'
import { transformList } from './transforms/lists.js'
import { transformCodeBlock } from './transforms/codeblocks.js'
import { transformTable } from './transforms/tables.js'
import { transformBlockquote } from './transforms/blockquotes.js'
import { parseMarkdown } from './parse.js'
import { hasStringValue } from './utils.js'
import type { ConvertOptions } from './utils.js'

interface WikiConvertContext {
  baseUrl: string | undefined
  disabled: ReadonlySet<string>
}

function transformNode(node: RootContent, ctx: WikiConvertContext): string | null {
  if (ctx.disabled.size > 0 && ctx.disabled.has(node.type)) return null
  switch (node.type) {
    case 'heading':
      return transformHeading(node, ctx.baseUrl)
    case 'paragraph':
      return convertInlineChildren(node.children, ctx.baseUrl)
    case 'list':
      return transformList(node, '', ctx.baseUrl)
    case 'code':
      return transformCodeBlock(node)
    case 'blockquote':
      return transformBlockquote(node, ctx.baseUrl)
    case 'thematicBreak':
      return '----'
    case 'table':
      return transformTable(node, ctx.baseUrl)
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
      if (hasStringValue(node)) {
        return node.value
      }
      return null
    }
  }
}

/**
 * Converts a Markdown string to Jira Wiki Markup.
 *
 * @param md - The Markdown string to convert.
 * @param options - Optional conversion options (baseUrl, disableTransforms).
 * @returns The converted Jira Wiki Markup string.
 */
export function convert(md: string, options?: ConvertOptions): string {
  if (!md.trim()) return ''

  const ctx: WikiConvertContext = {
    baseUrl: options?.baseUrl,
    disabled: new Set(options?.disableTransforms ?? []),
  }

  const tree = parseMarkdown(md)

  const parts: string[] = []

  for (const node of tree.children) {
    const result = transformNode(node, ctx)
    if (result !== null) {
      parts.push(result)
    }
  }

  return parts.join('\n\n')
}
