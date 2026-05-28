import type { RootContent, PhrasingContent, List, ListItem, Blockquote } from 'mdast'
import { parseMarkdown } from './parse.js'
import {
  hasStringValue,
  resolveUrl,
  normalizeTableColumnCount,
  escapeXml,
  escapeAttr,
} from './utils.js'
import type { ConvertOptions } from './utils.js'
import { detectAlertType, stripAlertMarker } from './transforms/blockquotes.js'

// ── Inline transforms (Confluence Storage Format XHTML) ──────────────────────

function inlineChildren(children: PhrasingContent[], baseUrl?: string): string {
  return children.map((n) => inlineNode(n, baseUrl)).join('')
}

function inlineNode(node: PhrasingContent, baseUrl?: string): string {
  switch (node.type) {
    case 'text':
      return escapeXml(node.value)
    case 'strong':
      return `<strong>${inlineChildren(node.children, baseUrl)}</strong>`
    case 'emphasis':
      return `<em>${inlineChildren(node.children, baseUrl)}</em>`
    case 'delete':
      return `<del>${inlineChildren(node.children, baseUrl)}</del>`
    case 'inlineCode':
      return `<code>${escapeXml(node.value)}</code>`
    case 'link': {
      const href = resolveUrl(node.url, baseUrl)
      const label =
        node.children.length > 0 ? inlineChildren(node.children, baseUrl) : escapeXml(href)
      return `<a href="${escapeAttr(href)}">${label}</a>`
    }
    case 'image':
      // Out of scope — ignore silently per AGENTS.md
      return ''
    case 'break':
      return '<br/>'
    case 'html':
      // HTML passthrough is out of scope — ignore silently
      return ''
    default: {
      // Fallback: emit escaped raw text for unknown inline node types
      const n = node as { value?: unknown }
      if (typeof n.value === 'string') return escapeXml(n.value)
      return ''
    }
  }
}

// ── Block transforms ──────────────────────────────────────────────────────────

function confluenceHeading(
  node: Extract<RootContent, { type: 'heading' }>,
  baseUrl?: string
): string | null {
  const level = Math.min(node.depth, 6)
  const content = inlineChildren(node.children, baseUrl)
  if (!content.trim()) return null
  return `<h${level}>${content}</h${level}>`
}

function confluenceCodeBlock(node: Extract<RootContent, { type: 'code' }>): string {
  // CDATA must not contain "]]>" — split if present
  const body = node.value.replace(/]]>/g, ']]]]><![CDATA[>')
  if (node.lang) {
    return (
      `<ac:structured-macro ac:name="code">` +
      `<ac:parameter ac:name="language">${escapeAttr(node.lang)}</ac:parameter>` +
      `<ac:plain-text-body><![CDATA[${body}]]></ac:plain-text-body>` +
      `</ac:structured-macro>`
    )
  }
  return (
    `<ac:structured-macro ac:name="code">` +
    `<ac:plain-text-body><![CDATA[${body}]]></ac:plain-text-body>` +
    `</ac:structured-macro>`
  )
}

function confluenceListItem(item: ListItem, baseUrl?: string): string {
  const parts: string[] = []
  for (const child of item.children) {
    if (child.type === 'paragraph') {
      parts.push(inlineChildren(child.children, baseUrl))
    } else if (child.type === 'list') {
      parts.push(confluenceList(child, baseUrl))
    }
  }
  return `<li>${parts.join('')}</li>`
}

function confluenceTaskList(node: List, baseUrl?: string): string {
  const tasks = node.children.map((item) => {
    const textParts: string[] = []
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        textParts.push(inlineChildren(child.children, baseUrl))
      }
    }
    const status = item.checked === true ? 'complete' : 'incomplete'
    const body = textParts.join('')
    return (
      `<ac:task>` +
      `<ac:task-status>${status}</ac:task-status>` +
      `<ac:task-body>${body}</ac:task-body>` +
      `</ac:task>`
    )
  })
  return `<ac:task-list>${tasks.join('')}</ac:task-list>`
}

function confluenceList(node: List, baseUrl?: string): string {
  // GFM task list: any item with a non-null checked state triggers task-list macro
  const isTask = !node.ordered && node.children.some((item) => item.checked !== null)
  if (isTask) return confluenceTaskList(node, baseUrl)

  const tag = node.ordered ? 'ol' : 'ul'
  const items = node.children.map((item) => confluenceListItem(item, baseUrl)).join('')
  return `<${tag}>${items}</${tag}>`
}

/** Maps GFM Alert keyword → Confluence macro name. */
const ALERT_TO_CONFLUENCE: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  WARNING: 'warning',
  CAUTION: 'warning', // Confluence has no {caution}; {warning} is the closest
  IMPORTANT: 'info',
}

function confluencePanel(node: Blockquote, alertType: string, baseUrl?: string): string {
  const macro = ALERT_TO_CONFLUENCE[alertType] ?? 'info'
  const parts: string[] = []
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!
    if (child.type === 'paragraph') {
      const children = i === 0 ? stripAlertMarker(child.children) : child.children
      const text = inlineChildren(children, baseUrl)
      if (text.trim()) parts.push(`<p>${text}</p>`)
    } else if (child.type === 'list') {
      parts.push(confluenceList(child, baseUrl))
    } else if (child.type === 'code') {
      parts.push(confluenceCodeBlock(child))
    }
  }
  return (
    `<ac:structured-macro ac:name="${macro}">` +
    `<ac:rich-text-body>${parts.join('')}</ac:rich-text-body>` +
    `</ac:structured-macro>`
  )
}

function confluenceBlockquote(node: Blockquote, baseUrl?: string, disablePanel = false): string {
  const alertType = detectAlertType(node)
  if (alertType && !disablePanel) return confluencePanel(node, alertType, baseUrl)

  const parts: string[] = []
  for (const child of node.children) {
    if (child.type === 'paragraph') {
      parts.push(`<p>${inlineChildren(child.children, baseUrl)}</p>`)
    } else if (child.type === 'list') {
      parts.push(confluenceList(child, baseUrl))
    } else if (child.type === 'code') {
      parts.push(confluenceCodeBlock(child))
    }
  }
  return `<blockquote>${parts.join('')}</blockquote>`
}

function confluenceTable(node: Extract<RootContent, { type: 'table' }>, baseUrl?: string): string {
  const rows = node.children
  const maxCols = normalizeTableColumnCount(rows)

  const rowStrings = rows.map((row, rowIndex) => {
    const isHeader = rowIndex === 0
    const tag = isHeader ? 'th' : 'td'
    const cells = row.children.map((cell) => {
      const content = inlineChildren(cell.children, baseUrl)
      return `<${tag}>${content}</${tag}>`
    })
    // Pad rows with fewer columns than the widest row
    while (cells.length < maxCols) cells.push(`<${tag}></${tag}>`)
    return `<tr>${cells.join('')}</tr>`
  })

  return `<table><tbody>${rowStrings.join('')}</tbody></table>`
}

// ── Root converter ────────────────────────────────────────────────────────────

interface ConfluenceContext {
  baseUrl: string | undefined
  disabled: ReadonlySet<string>
}

function transformNode(node: RootContent, ctx: ConfluenceContext): string | null {
  if (ctx.disabled.size > 0 && ctx.disabled.has(node.type)) return null
  switch (node.type) {
    case 'heading':
      return confluenceHeading(node, ctx.baseUrl)
    case 'paragraph':
      return `<p>${inlineChildren(node.children, ctx.baseUrl)}</p>`
    case 'list':
      return confluenceList(node, ctx.baseUrl)
    case 'code':
      return confluenceCodeBlock(node)
    case 'blockquote':
      return confluenceBlockquote(node, ctx.baseUrl, ctx.disabled.has('panel'))
    case 'thematicBreak':
      return '<hr/>'
    case 'table':
      return confluenceTable(node, ctx.baseUrl)
    case 'html':
      // Out of scope — ignore silently
      return null
    case 'yaml':
      // Frontmatter — skip silently
      return null
    default: {
      if (hasStringValue(node)) return `<p>${escapeXml(node.value)}</p>`
      return null
    }
  }
}

/**
 * Converts a Markdown string to Confluence Storage Format (XHTML).
 *
 * The output is valid Confluence Storage Format that can be imported directly
 * into a Confluence page body via the REST API or the editor paste action.
 *
 * @param md      - The Markdown string to convert.
 * @param options - Optional conversion options (baseUrl, disableTransforms).
 * @returns The converted Confluence Storage Format XHTML string.
 */
export function convertToConfluence(md: string, options?: ConvertOptions): string {
  if (!md.trim()) return ''

  const ctx: ConfluenceContext = {
    baseUrl: options?.baseUrl,
    disabled: new Set(options?.disableTransforms ?? []),
  }

  const tree = parseMarkdown(md)
  const parts: string[] = []

  for (const node of tree.children) {
    const result = transformNode(node, ctx)
    if (result !== null) parts.push(result)
  }

  return parts.join('\n')
}
