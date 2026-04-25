import type { Blockquote, PhrasingContent } from 'mdast'
import { convertInlineChildren } from './formatting.js'
import { transformList } from './lists.js'
import { transformCodeBlock } from './codeblocks.js'

/** Maps GFM Alert keyword → Jira Wiki Markup macro name. */
const ALERT_TO_JIRA_MACRO: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  WARNING: 'warning',
  CAUTION: 'warning', // Jira has no {caution}; {warning} is the closest equivalent
  IMPORTANT: 'info',
}

/** Maps GFM Alert keyword → ADF panelType. Exported for use in adf-converter.ts. */
export const ALERT_TO_ADF_PANEL: Record<string, 'info' | 'note' | 'warning' | 'tip'> = {
  NOTE: 'note',
  TIP: 'tip',
  WARNING: 'warning',
  CAUTION: 'warning',
  IMPORTANT: 'info',
}

/**
 * Matches the GFM Alert marker at the start of a text node.
 * Supports `> [!NOTE]\n> content` (soft-wrapped, single paragraph) and
 * `> [!NOTE]\n>\n> content` (blank-line separated paragraphs).
 */
const ALERT_RE = /^\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\][ \t]*/i

/**
 * Detects whether a blockquote is a GFM Alert (e.g. `> [!NOTE]`).
 * Returns the uppercased alert keyword (e.g. `'NOTE'`) if detected, or `null`.
 *
 * remark-gfm parses `> [!NOTE]\n> content` as a blockquote whose first
 * paragraph's first text node starts with the `[!NOTE]` marker.
 */
export function detectAlertType(node: Blockquote): string | null {
  const first = node.children[0]
  if (first?.type !== 'paragraph') return null
  const firstInline = first.children[0]
  if (firstInline?.type !== 'text') return null
  const match = ALERT_RE.exec(firstInline.value)
  return match ? match[1]!.toUpperCase() : null
}

/**
 * Strips the GFM Alert marker from a paragraph's inline children.
 * Returns a new array — does not mutate the original.
 *
 * Handles two layouts:
 * - `[!NOTE]\ncontent` (soft-wrapped): strips marker + leading newline, keeps rest
 * - `[!NOTE]` (entire text node): removes the node; remaining siblings are the body
 */
export function stripAlertMarker(children: PhrasingContent[]): PhrasingContent[] {
  const first = children[0]
  if (first?.type !== 'text') return children
  const afterMarker = first.value.replace(ALERT_RE, '').replace(/^\n/, '')
  if (!afterMarker) return children.slice(1)
  return [{ ...first, value: afterMarker }, ...children.slice(1)]
}

/**
 * Converts a GFM Alert blockquote to a Jira Wiki Markup panel macro.
 * e.g. `> [!NOTE]\n> content` → `{note}\ncontent\n{note}`
 */
export function transformPanel(node: Blockquote, alertType: string): string {
  const macro = ALERT_TO_JIRA_MACRO[alertType] ?? 'info'
  const parts: string[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!
    if (child.type === 'paragraph') {
      const children = i === 0 ? stripAlertMarker(child.children) : child.children
      const text = convertInlineChildren(children)
      if (text.trim()) parts.push(text)
    } else if (child.type === 'list') {
      parts.push(transformList(child))
    } else if (child.type === 'code') {
      parts.push(transformCodeBlock(child))
    }
    // nested blockquotes inside a GFM Alert panel have no Jira equivalent — skip
  }

  return `{${macro}}\n${parts.join('\n\n')}\n{${macro}}`
}

/**
 * Converts a Markdown blockquote (and any nested blockquotes) to Jira Wiki Markup.
 *
 * If the blockquote is a GFM Alert (`> [!NOTE]`, `> [!TIP]`, etc.), it is rendered
 * as the corresponding Jira panel macro (`{note}`, `{tip}`, `{warning}`, `{info}`).
 *
 * For plain blockquotes, Jira Wiki has no nested blockquote syntax — `bq.` is always
 * a single-line prefix. Nested blockquotes are flattened: each leaf paragraph becomes
 * its own `bq.` line.
 */
export function transformBlockquote(node: Blockquote): string {
  const alertType = detectAlertType(node)
  if (alertType !== null) return transformPanel(node, alertType)

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
