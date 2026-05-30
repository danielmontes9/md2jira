/**
 * md2jira-core  Pure TypeScript Markdown to Jira Wiki Markup converter.
 * No browser/React dependencies. Safe to use in Node.js, CLI, and VSCode Extension.
 */
export { convert } from './converter.js'
export { convertToAdf } from './adf-converter.js'
export { convertToConfluence } from './confluence-converter.js'
export type { ConvertOptions } from './utils.js'
export type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfMark,
  AdfHeadingNode,
  AdfParagraphNode,
  AdfBulletListNode,
  AdfOrderedListNode,
  AdfListItemNode,
  AdfTaskItemNode,
  AdfTaskListNode,
  AdfCodeBlockNode,
  AdfBlockquoteNode,
  AdfTextNode,
  AdfHardBreakNode,
  AdfRuleNode,
  AdfTableNode,
  AdfTableRowNode,
  AdfTableHeaderNode,
  AdfTableCellNode,
  AdfPanelNode,
  AdfMediaNode,
  AdfMediaSingleNode,
} from './adf-types.js'
