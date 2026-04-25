import type { List } from 'mdast'
import { convertInlineChildren } from './formatting.js'

export function transformList(node: List, parentPrefix = '', baseUrl?: string): string {
  const marker = node.ordered ? '#' : '*'
  const prefix = parentPrefix + marker

  // Detect GFM task list: any item has a non-null checked state
  const isTaskList = !node.ordered && node.children.some((item) => item.checked !== null)

  const lines: string[] = []

  for (const item of node.children) {
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        const text = convertInlineChildren(child.children, baseUrl)
        if (isTaskList) {
          // Jira Wiki has no native task list syntax; use status emoticons:
          // (/) = green check (done), (x) = red cross (to do / not done)
          const icon = item.checked === true ? '(/)' : '(x)'
          lines.push(`${icon} ${text}`)
        } else {
          lines.push(`${prefix} ${text}`)
        }
      } else if (child.type === 'list') {
        lines.push(transformList(child, prefix, baseUrl))
      }
    }
  }

  return lines.join('\n')
}
