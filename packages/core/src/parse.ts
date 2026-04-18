import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Root } from 'mdast'
import { preprocessMarkdown } from './preprocess.js'

/**
 * Parses a Markdown string into an mdast Root node.
 * Applies CRLF normalisation and GFM table-gap collapsing via preprocessMarkdown,
 * then runs remark-parse + remark-gfm so both converter.ts and adf-converter.ts
 * share a single, consistent parser configuration.
 */
export function parseMarkdown(md: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(preprocessMarkdown(md)) as Root
}
