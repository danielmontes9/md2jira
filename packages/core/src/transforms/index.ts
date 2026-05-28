/**
 * Public barrel re-export for the stable transform API in `packages/core`.
 *
 * External consumers can import individual transforms via `md2jira-core/transforms`
 * without depending on internal file paths. Internal helpers (inline-level
 * functions, alert detection utils) are intentionally excluded — they are
 * implementation details and not part of the stable public surface.
 *
 * `converter.ts` and `adf-converter.ts` import directly from each transform
 * file for tree-shaking clarity.
 */
export { transformHeading } from './headers.js'
export { convertInlineChildren } from './formatting.js'
export { transformList } from './lists.js'
export { transformCodeBlock } from './codeblocks.js'
export { transformTable } from './tables.js'
export { transformBlockquote, transformPanel } from './blockquotes.js'
