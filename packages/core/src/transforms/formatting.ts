import type { Strong, Emphasis, Delete, InlineCode, Link, PhrasingContent } from 'mdast'

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
      // Out of scope - ignore silently
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

export function transformLink(node: Link, baseUrl?: string): string {
  const resolvedUrl =
    baseUrl && node.url.startsWith('/') ? baseUrl.replace(/\/$/, '') + node.url : node.url
  const text = convertInlineChildren(node.children, baseUrl)
  if (!text) {
    return `[${resolvedUrl}]`
  }
  return `[${text}|${resolvedUrl}]`
}
