import type { Blockquote, Paragraph } from 'mdast'
import { convertInlineChildren } from './formatting.js'

/**
 * Converts a Markdown blockquote (and any nested blockquotes) to Jira Wiki Markup.
 *
 * Jira Wiki has no nested blockquote syntax — `bq.` is always a single-line prefix.
 * Nested blockquotes are flattened: each leaf paragraph is emitted as its own `bq.` line.
 */
export function transformBlockquote(node: Blockquote): string {
  const parts: string[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      const text = convertInlineChildren((child as Paragraph).children)
      // Hard line breaks within the paragraph produce \n; each sub-line needs its own bq. prefix.
      for (const sub of text.split('\n')) {
        parts.push(`bq. ${sub}`)
      }
    } else if (child.type === 'blockquote') {
      // Nested blockquote: recurse and flatten (Jira Wiki has no nested bq. syntax)
      parts.push(transformBlockquote(child as Blockquote))
    }
  }
  return parts.join('\n')
}
