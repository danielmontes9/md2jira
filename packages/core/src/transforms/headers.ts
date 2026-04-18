import type { Heading } from 'mdast'
import { convertInlineChildren } from './formatting.js'

export function transformHeading(node: Heading): string | null {
  const level = Math.min(node.depth, 6)
  const text = convertInlineChildren(node.children)
  if (!text.trim()) return null
  return `h${level}. ${text}`
}
