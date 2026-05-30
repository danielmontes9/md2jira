import type { Strong, Emphasis, Delete, InlineCode, Link, Image, PhrasingContent } from 'mdast'
import { resolveUrl } from '../utils.js'

export function convertInlineChildren(children: PhrasingContent[], baseUrl?: string): string {
  return children.map((child) => convertInlineNode(child, baseUrl)).join('')
}

export function convertInlineNode(node: PhrasingContent, baseUrl?: string): string {
  switch (node.type) {
    case 'text':
      return node.value
    case 'strong':
      return transformStrong(node, baseUrl)
    case 'emphasis':
      return transformEmphasis(node, baseUrl)
    case 'delete':
      return transformDelete(node, baseUrl)
    case 'inlineCode':
      return transformInlineCode(node)
    case 'link':
      return transformLink(node, baseUrl)
    case 'break':
      return '\n'
    case 'image':
      return transformImage(node, baseUrl)
    case 'html':
      // HTML passthrough is out of scope — ignore silently per AGENTS.md
      return ''
    default:
      return ''
  }
}

export function transformStrong(node: Strong, baseUrl?: string): string {
  const text = convertInlineChildren(node.children, baseUrl)
  return `*${text}*`
}

export function transformEmphasis(node: Emphasis, baseUrl?: string): string {
  const text = convertInlineChildren(node.children, baseUrl)
  return `_${text}_`
}

export function transformDelete(node: Delete, baseUrl?: string): string {
  const text = convertInlineChildren(node.children, baseUrl)
  return `-${text}-`
}

export function transformInlineCode(node: InlineCode): string {
  return `{{${node.value}}}`
}

export function transformImage(node: Image, baseUrl?: string): string {
  if (!node.url) return ''
  const url = resolveUrl(node.url, baseUrl)
  // Escape characters that would break Jira image syntax: ! terminates the tag, | starts params
  const safeUrl = url.replace(/!/g, '%21').replace(/\|/g, '%7C')
  // node.title carries Jira image params via Markdown title syntax:
  //   ![alt](img.png "width=200,align=right") → !img.png|width=200,align=right!
  // Sanitize: strip ! (terminates tag) and | (used as url/params separator), collapse whitespace
  const rawParams = node.title
    ? node.title
        .replace(/[!|]/g, '')
        .replace(/[\r\n\t]/g, ' ')
        .trim()
    : ''
  const params = rawParams ? `|${rawParams}` : ''
  return `!${safeUrl}${params}!`
}

export function transformLink(node: Link, baseUrl?: string): string {
  const resolvedUrl = resolveUrl(node.url, baseUrl)
  const text = convertInlineChildren(node.children, baseUrl)
  if (!text) {
    return `[${resolvedUrl}]`
  }
  return `[${text}|${resolvedUrl}]`
}
