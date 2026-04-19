/**
 * Public barrel re-export for all transform functions in `packages/core`.
 *
 * External consumers can import individual transforms via `md2jira-core/transforms`
 * without depending on internal file paths. `converter.ts` and `adf-converter.ts`
 * import directly from each transform file for tree-shaking clarity, but this
 * barrel remains the stable public surface for any downstream tooling.
 */
export { transformHeading } from './headers.js'
export {
  convertInlineChildren,
  convertInlineNode,
  transformStrong,
  transformEmphasis,
  transformDelete,
  transformInlineCode,
  transformLink,
} from './formatting.js'
export { transformList } from './lists.js'
export { transformCodeBlock } from './codeblocks.js'
export { transformTable } from './tables.js'
export { transformBlockquote } from './blockquotes.js'
