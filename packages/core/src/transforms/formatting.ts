import type { Strong, Emphasis, Delete, InlineCode, Link, PhrasingContent } from 'mdast'

export function convertInlineChildren(children: PhrasingContent[]): string {
  return children.map((child) => convertInlineNode(child)).join('')
}

export function convertInlineNode(node: PhrasingContent): string {
  switch (node.type) {
    case 'text':
      return node.value
    case 'strong':
      return transformStrong(node)
    case 'emphasis':
      return transformEmphasis(node)
    case 'delete':
      return transformDelete(node)
    case 'inlineCode':
      return transformInlineCode(node)
    case 'link':
      return transformLink(node)
    case 'break':
      return '\n'
    case 'image':
      // Out of scope - ignore silently
      return ''
    default:
      return ''
  }
}

export function transformStrong(node: Strong): string {
  const text = convertInlineChildren(node.children)
  return `*${text}*`
}

export function transformEmphasis(node: Emphasis): string {
  const text = convertInlineChildren(node.children)
  return `_${text}_`
}

export function transformDelete(node: Delete): string {
  const text = convertInlineChildren(node.children)
  return `-${text}-`
}

export function transformInlineCode(node: InlineCode): string {
  return `{{${node.value}}}`
}

export function transformLink(node: Link): string {
  const text = convertInlineChildren(node.children)
  if (!text) {
    return `[${node.url}]`
  }
  return `[${text}|${node.url}]`
}
