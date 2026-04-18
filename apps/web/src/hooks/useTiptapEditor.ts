import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import DOMPurify from 'dompurify'

interface UseTiptapEditorOptions {
  previewHtml: string
  onMarkdownChange: ((md: string) => void) | undefined
  /** Debounce delay in ms for HTML→Markdown sync. @default 300 */
  debounceMs?: number
}

export interface TiptapEditorState {
  /** The TipTap editor instance. null until initialization completes. */
  editor: Editor | null
  /** Current block type name (e.g. 'paragraph', 'heading'). */
  activeBlock: string
  /** Set of currently active inline format names. */
  activeFormats: Set<string>
  /** Execute a formatting command by name. */
  exec: (cmd: string, arg?: string) => void
  /** Insert sanitized HTML at the current cursor position. */
  insertHtml: (html: string) => void
}

/** Maps legacy execCommand names to TipTap chain commands. */
function execTiptapCommand(editor: Editor, cmd: string, arg?: string): void {
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

function getActiveBlock(editor: Editor): string {
  for (let level = 1; level <= 6; level++) {
    if (editor.isActive('heading', { level })) return `h${level}`
  }
  if (editor.isActive('codeBlock')) return 'pre'
  if (editor.isActive('blockquote')) return 'blockquote'
  return 'p'
}

function getActiveFormats(editor: Editor): Set<string> {
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

export function useTiptapEditor({
  previewHtml,
  onMarkdownChange,
  debounceMs = 300,
}: UseTiptapEditorOptions): TiptapEditorState {
  const onMarkdownChangeRef = useRef(onMarkdownChange)
  onMarkdownChangeRef.current = onMarkdownChange

  // Flag to prevent infinite update loop: when we set editor content from
  // external previewHtml, the onUpdate callback fires — we must ignore it.
  const isExternalUpdateRef = useRef(false)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  // Lazy-loaded TurndownService for HTML→Markdown conversion
  const tdRef = useRef<import('turndown') | null>(null)
  const tdLoadingRef = useRef(false)

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        // We use the table, taskList, horizontalRule extensions separately
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        // StarterKit v3 bundles Underline; disable it here to prevent duplicate
        // extension registration with the explicit Underline import below,
        // which is required so chain.toggleUnderline() resolves correctly.
        underline: false,
      }),
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content: DOMPurify.sanitize(previewHtml),
    editable: false,
    onUpdate: ({ editor: ed }) => {
      if (isExternalUpdateRef.current) return
      const cb = onMarkdownChangeRef.current
      if (!cb) return

      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = setTimeout(() => {
        if (!onMarkdownChangeRef.current) return
        // Lazy-load Turndown
        if (!tdRef.current) {
          if (tdLoadingRef.current) return
          tdLoadingRef.current = true
          import('../components/jira-output/turndown-config.js')
            .then(({ createTurndownService }) => {
              tdRef.current = createTurndownService()
              tdLoadingRef.current = false
              // Re-trigger the update now that Turndown is ready
              const html = ed.getHTML()
              const md = tdRef.current!.turndown(html)
              isExternalUpdateRef.current = true
              onMarkdownChangeRef.current?.(md)
              queueMicrotask(() => {
                isExternalUpdateRef.current = false
              })
            })
            .catch(() => {
              tdLoadingRef.current = false
            })
          return
        }
        try {
          const html = ed.getHTML()
          const md = tdRef.current.turndown(html)
          isExternalUpdateRef.current = true
          onMarkdownChangeRef.current?.(md)
          queueMicrotask(() => {
            isExternalUpdateRef.current = false
          })
        } catch {
          // Turndown conversion failed — don't crash the editor
        }
      }, debounceMs)
    },
  })

  // Cleanup debounce timeout on unmount
  useEffect(() => () => clearTimeout(updateTimeoutRef.current), [])

  // Sync external previewHtml into editor (only when not editing)
  useEffect(() => {
    if (!editor) return
    if (isExternalUpdateRef.current) {
      isExternalUpdateRef.current = false
      return
    }
    // Don't overwrite content while the user is focused in the editor
    if (editor.isFocused) return
    const sanitized = DOMPurify.sanitize(previewHtml)
    isExternalUpdateRef.current = true
    editor.commands.setContent(sanitized)
    queueMicrotask(() => {
      isExternalUpdateRef.current = false
    })
  }, [previewHtml, editor])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      if (!editor) return
      execTiptapCommand(editor, cmd, arg)
    },
    [editor]
  )

  const insertHtml = useCallback(
    (html: string) => {
      if (!editor) return
      const sanitized = DOMPurify.sanitize(html)
      editor.chain().focus().insertContent(sanitized).run()
    },
    [editor]
  )

  const activeBlock = editor ? getActiveBlock(editor) : 'p'
  const activeFormats = editor ? getActiveFormats(editor) : new Set<string>()

  return {
    editor,
    activeBlock,
    activeFormats,
    exec,
    insertHtml,
  }
}
