/**
 * ADF mark types as a discriminated union.
 * Each variant has a precise `attrs` type so consumers can access mark
 * attributes without unsafe casts (e.g. `mark.attrs.href` on a link mark).
 */
export type AdfMark =
  | { type: 'strong' }
  | { type: 'em' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'underline' }
  | { type: 'link'; attrs: { href: string } }
  | { type: 'subsup'; attrs: { type: 'sub' | 'sup' } }
  | { type: 'textColor'; attrs: { color: string } }

export interface AdfTextNode {
  type: 'text'
  text: string
  marks?: AdfMark[]
}

export interface AdfHardBreakNode {
  type: 'hardBreak'
}

export type AdfInlineNode = AdfTextNode | AdfHardBreakNode

export interface AdfHeadingNode {
  type: 'heading'
  attrs: { level: number }
  content: AdfInlineNode[]
}

export interface AdfParagraphNode {
  type: 'paragraph'
  content: AdfInlineNode[]
}

export interface AdfBulletListNode {
  type: 'bulletList'
  content: AdfListItemNode[]
}

export interface AdfOrderedListNode {
  type: 'orderedList'
  content: AdfListItemNode[]
}

export interface AdfListItemNode {
  type: 'listItem'
  content: AdfBlockNode[]
}

export interface AdfCodeBlockNode {
  type: 'codeBlock'
  attrs?: { language?: string }
  content: AdfTextNode[]
}

export interface AdfBlockquoteNode {
  type: 'blockquote'
  content: AdfBlockNode[]
}

export interface AdfRuleNode {
  type: 'rule'
}

export interface AdfTableNode {
  type: 'table'
  attrs: { isNumberColumnEnabled: boolean; layout: string }
  content: AdfTableRowNode[]
}

export interface AdfTableRowNode {
  type: 'tableRow'
  content: (AdfTableHeaderNode | AdfTableCellNode)[]
}

export interface AdfTableHeaderNode {
  type: 'tableHeader'
  attrs?: { colspan?: number; rowspan?: number; colwidth?: number[] }
  content: AdfBlockNode[]
}

export interface AdfTableCellNode {
  type: 'tableCell'
  attrs?: { colspan?: number; rowspan?: number; colwidth?: number[] }
  content: AdfBlockNode[]
}

export interface AdfTaskItemNode {
  type: 'taskItem'
  attrs: { localId: string; state: 'TODO' | 'DONE' }
  content: AdfBlockNode[]
}

export interface AdfTaskListNode {
  type: 'taskList'
  attrs: { localId: string }
  content: AdfTaskItemNode[]
}

export interface AdfPanelNode {
  type: 'panel'
  attrs: { panelType: 'info' | 'note' | 'warning' | 'tip' | 'error' | 'success' }
  content: AdfBlockNode[]
}

export type AdfBlockNode =
  | AdfHeadingNode
  | AdfParagraphNode
  | AdfBulletListNode
  | AdfOrderedListNode
  | AdfTaskListNode
  | AdfCodeBlockNode
  | AdfBlockquoteNode
  | AdfPanelNode
  | AdfRuleNode
  | AdfTableNode

export interface AdfDocument {
  version: 1
  type: 'doc'
  content: AdfBlockNode[]
}
