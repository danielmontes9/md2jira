/**
 * Pure TipTap command utilities extracted from useTiptapEditor.ts.
 *
 * All functions here are framework-agnostic (no hooks, no React) and can be
 * unit-tested without rendering a component tree.
 */
import type { Editor } from '@tiptap/react'

/** Stable empty Set reference — shared across renders to avoid unnecessary re-renders. */
export const EMPTY_FORMATS = new Set<string>()

/** Maps legacy execCommand-style names to TipTap chain commands. */
export function execTiptapCommand(editor: Editor, cmd: string, arg?: string): void {
  const chain = editor.chain().focus()

  switch (cmd) {
    case 'bold':
      chain.toggleBold().run()
      break
    case 'italic':
      chain.toggleItalic().run()
      break
    case 'underline':
      chain.toggleUnderline().run()
      break
    case 'strikeThrough':
      chain.toggleStrike().run()
      break
    case 'subscript':
      chain.toggleSubscript().run()
      break
    case 'superscript':
      chain.toggleSuperscript().run()
      break
    case 'insertUnorderedList':
      chain.toggleBulletList().run()
      break
    case 'insertOrderedList':
      chain.toggleOrderedList().run()
      break
    case 'insertHorizontalRule':
      chain.setHorizontalRule().run()
      break
    case 'undo':
      chain.undo().run()
      break
    case 'redo':
      chain.redo().run()
      break
    case 'removeFormat':
      chain.unsetAllMarks().run()
      break
    case 'foreColor':
      if (arg) chain.setColor(arg).run()
      else chain.unsetColor().run()
      break
    case 'formatBlock':
      if (arg) {
        const tag = arg.toUpperCase()
        if (tag === 'P') {
          chain.setParagraph().run()
        } else {
          const match = /^H(\d)$/.exec(tag)
          if (match) {
            const level = parseInt(match[1]!) as 1 | 2 | 3 | 4 | 5 | 6
            chain.toggleHeading({ level }).run()
          }
        }
      }
      break
    case 'toggleTaskList':
      chain.toggleTaskList().run()
      break
    case 'insertTable':
      chain.insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()
      break
    case 'toggleBlockquote':
      chain.toggleBlockquote().run()
      break
    case 'toggleCode':
      chain.toggleCode().run()
      break
    case 'toggleCodeBlock':
      chain.toggleCodeBlock().run()
      break
    case 'insertText':
      if (arg) chain.insertContent(arg).run()
      break
    default:
      // Unknown command — ignore
      break
  }
}

/** Returns the active block type name for the current selection. */
export function getActiveBlock(editor: Editor): string {
  for (let level = 1; level <= 6; level++) {
    if (editor.isActive('heading', { level })) return `h${level}`
  }
  if (editor.isActive('codeBlock')) return 'pre'
  if (editor.isActive('blockquote')) return 'blockquote'
  return 'p'
}

/** Returns the set of currently active inline format names. */
export function getActiveFormats(editor: Editor): Set<string> {
  const fmts = new Set<string>()
  if (editor.isActive('bold')) fmts.add('bold')
  if (editor.isActive('italic')) fmts.add('italic')
  if (editor.isActive('underline')) fmts.add('underline')
  if (editor.isActive('strike')) fmts.add('strikeThrough')
  if (editor.isActive('subscript')) fmts.add('subscript')
  if (editor.isActive('superscript')) fmts.add('superscript')
  if (editor.isActive('code')) fmts.add('code')
  if (editor.isActive('bulletList')) fmts.add('insertUnorderedList')
  if (editor.isActive('orderedList')) fmts.add('insertOrderedList')
  if (editor.isActive('taskList')) fmts.add('toggleTaskList')
  if (editor.isActive('blockquote')) fmts.add('toggleBlockquote')
  return fmts
}
