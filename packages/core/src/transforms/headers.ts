import type { Heading } from 'mdast'
import { convertInlineChildren } from './formatting.js'

export function transformHeading(node: Heading, baseUrl?: string): string | null {
  const level = Math.min(node.depth, 6)
  const text = convertInlineChildren(node.children, baseUrl)
  if (!text.trim()) return null
  return `h${level}. ${text}`
}
