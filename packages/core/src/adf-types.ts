export interface AdfMark {
  type: 'strong' | 'em' | 'strike' | 'code' | 'link' | 'subsup'
  attrs?: Record<string, string>
}

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
  attrs?: Record<string, unknown>
  content: AdfBlockNode[]
}

export interface AdfTableCellNode {
  type: 'tableCell'
  attrs?: Record<string, unknown>
  content: AdfBlockNode[]
}

export type AdfBlockNode =
  | AdfHeadingNode
  | AdfParagraphNode
  | AdfBulletListNode
  | AdfOrderedListNode
  | AdfCodeBlockNode
  | AdfBlockquoteNode
  | AdfRuleNode
  | AdfTableNode

export interface AdfDocument {
  version: 1
  type: 'doc'
  content: AdfBlockNode[]
}
