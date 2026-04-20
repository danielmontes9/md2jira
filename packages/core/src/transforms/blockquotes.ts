import type { Blockquote } from 'mdast'
import { convertInlineChildren } from './formatting.js'
import { transformList } from './lists.js'
import { transformCodeBlock } from './codeblocks.js'

/**
 * Converts a Markdown blockquote (and any nested blockquotes) to Jira Wiki Markup.
 *
 * Jira Wiki has no nested blockquote syntax — `bq.` is always a single-line prefix.
 * Nested blockquotes are flattened: each leaf paragraph is emitted as its own `bq.` line.
 * Lists and code blocks inside a blockquote are rendered inline (without `bq.` prefix)
 * because Jira Wiki Markup has no syntax to nest them inside a blockquote.
 */
export function transformBlockquote(node: Blockquote): string {
  const parts: string[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const text = convertInlineChildren(child.children)
      // Hard line breaks within the paragraph produce \n; each sub-line needs its own bq. prefix.
      for (const sub of text.split('\n')) {
        parts.push(`bq. ${sub}`)
      }
    } else if (child.type === 'blockquote') {
      // Nested blockquote: recurse and flatten (Jira Wiki has no nested bq. syntax)
      parts.push(transformBlockquote(child))
    } else if (child.type === 'list') {
      // Lists cannot be nested inside bq. — render them at the top level
      parts.push(transformList(child))
    } else if (child.type === 'code') {
      // Code blocks cannot be nested inside bq. — render them at the top level
      parts.push(transformCodeBlock(child))
    }
  }
  return parts.join('\n')
}
