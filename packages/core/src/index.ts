/**
 * md2jira-core  Pure TypeScript Markdown to Jira Wiki Markup converter.
 * No browser/React dependencies. Safe to use in Node.js, CLI, and VSCode Extension.
 */
export { convert } from './converter.js'
export { convertToAdf } from './adf-converter.js'
export type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfMark,
  AdfListItemNode,
  AdfTextNode,
  AdfTableRowNode,
  AdfTableHeaderNode,
  AdfTableCellNode,
} from './adf-types.js'
