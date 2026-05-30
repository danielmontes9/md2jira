import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useEditorLossyMarks } from './useEditorLossyMarks.js'
import { useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { sanitize } from '../utils/sanitize.js'
import {
  execTiptapCommand,
  getActiveBlock,
  getActiveFormats,
  EMPTY_FORMATS,
} from '../utils/tiptap-commands.js'
import {
  tiptapDocToMarkdown,
  hasColorMarks,
  hasUnderlineMarks,
} from '../utils/tiptap-to-markdown.js'

// Extend TableCell and TableHeader to carry a text-alignment attribute.
// This lets the tiptap-to-markdown serializer output the correct Markdown
// column-alignment markers (`:---:`, `---:`) when cells carry inline styles.
export const AlignedTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          (element.style.textAlign || null) as 'left' | 'center' | 'right' | null,
        renderHTML: (attrs: Record<string, unknown>) => {
          const a = attrs['alignment'] as string | null
          return a ? { style: `text-align: ${a}` } : {}
        },
      },
    }
  },
})

export const AlignedTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          (element.style.textAlign || null) as 'left' | 'center' | 'right' | null,
        renderHTML: (attrs: Record<string, unknown>) => {
          const a = attrs['alignment'] as string | null
          return a ? { style: `text-align: ${a}` } : {}
        },
      },
    }
  },
})

// ── Broken image NodeView ─────────────────────────────────────────────────────
// Defined at module level (not inside useMemo) so the extension class identity
// is stable across re-renders and HMR reloads. The NodeView factory runs
// per-image in the browser; document.createElement is safe here because
// apps/web is browser-only.
const BrokenImageExtension = Image.extend({
  addNodeView() {
    return ({ node }) => {
      // `alt` is mutable so update() can sync it in-place without recreating.
      let alt = node.attrs['alt'] as string | null
      const src = node.attrs['src'] as string | null

      const wrapper = document.createElement('div')
      wrapper.className = 'adf-image-wrapper'

      // ── Broken placeholder — VISIBLE BY DEFAULT ───────────────────────────
      // We show it immediately and hide it only on a successful load. This
      // avoids any race with the 'error' event: Chromium may skip loading (and
      // thus skip firing events) for images with display:none.
      const box = document.createElement('div')
      box.className = 'adf-img-broken'
      // No inline display:none — the CSS rule (display:flex) is in effect.
      // Security: box.innerHTML is set to a static SVG literal only — no user
      // data. The URL is injected exclusively via urlSpan.textContent (not
      // innerHTML) below, which prevents XSS regardless of src content.
      box.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
        '<circle cx="8.5" cy="8.5" r="1.5"/>' +
        '<polyline points="21 15 16 10 5 21"/>' +
        '<line x1="3" y1="3" x2="21" y2="21"/>' +
        '</svg>' +
        '<span class="adf-img-broken__label">Image not found</span>'
      if (src && src !== '#') {
        const urlSpan = document.createElement('span')
        urlSpan.className = 'adf-img-broken__url'
        // textContent (not innerHTML) — safely renders any URL without XSS risk.
        urlSpan.textContent = src
        box.appendChild(urlSpan)
      }

      // Shared mutable reference accessed by the factory closure, update(),
      // and destroy(). null when src is missing or invalid.
      let imgEl: HTMLImageElement | null = null

      const handleLoad = () => {
        // Image decoded successfully — swap: hide placeholder, reveal img.
        box.style.display = 'none'
        if (imgEl) imgEl.style.removeProperty('display')
      }

      if (!src || src === '#') {
        // No valid URL — show placeholder; no <img> element needed.
        wrapper.appendChild(box)
      } else {
        imgEl = document.createElement('img')
        imgEl.alt = alt ?? ''
        imgEl.className = 'adf-image'
        // Start hidden — placeholder is already visible.
        imgEl.style.display = 'none'

        imgEl.addEventListener('load', handleLoad, { once: true })
        // No 'error' handler needed: placeholder is visible by default.

        wrapper.appendChild(imgEl)
        wrapper.appendChild(box)

        imgEl.src = src

        // Handle synchronous cache-hit (browser resolves immediately).
        if (imgEl.complete && imgEl.naturalWidth > 0) {
          handleLoad()
        }
      }

      return {
        dom: wrapper,
        update(newNode: { attrs: Record<string, unknown> }) {
          // Different src → recreate the NodeView for the new image.
          if (newNode.attrs['src'] !== src) return false
          // Same src — sync alt in-place without destroying and recreating.
          const newAlt = (newNode.attrs['alt'] as string | null) ?? ''
          if (imgEl && newAlt !== (alt ?? '')) {
            imgEl.alt = newAlt
            alt = newAlt
          }
          return true
        },
        ignoreMutation: () => true,
        destroy() {
          // Remove the load listener if the image is still in-flight, preventing
          // a stale closure from mutating a detached DOM element.
          if (imgEl) imgEl.removeEventListener('load', handleLoad)
        },
      }
    }
  },
}).configure({ inline: false })

interface UseTiptapEditorOptions {
  previewHtml: string
  onMarkdownChange: ((md: string) => void) | undefined
  /** Debounce delay in ms for HTML→Markdown sync. @default 300 */
  debounceMs?: number
  /** When false, the TipTap editor is not created (saves resources). @default true */
  shouldCreate?: boolean
  /**
   * Called at most once per editing session when the serializer detects color
   * marks that will be silently stripped by the Jira conversion pipeline.
   * Reset when all color marks are removed from the document.
   */
  onColorWarning?: () => void
  /**
   * Called at most once per editing session when the serializer detects
   * underline marks. Markdown has no underline syntax, so underline formatting
   * will be lost in the Jira output. Reset when all underline marks are removed.
   */
  onUnderlineWarning?: () => void
}

export interface TiptapEditorState {
  /** The TipTap editor instance. null until initialization completes. */
  editor: Editor | null
  /** Current block type name (e.g. 'paragraph', 'heading'). */
  activeBlock: string
  /** Set of currently active inline format names. */
  activeFormats: Set<string>
  /** Currently active text color, or undefined if none. */
  activeColor: string | undefined
  /** True when the cursor is inside a table cell. */
  isInTable: boolean
  /** True when the doc contains underline or color marks that will be stripped in Jira output. */
  hasLossyMarks: boolean
  /** Execute a formatting command by name. */
  exec: (cmd: string, arg?: string) => void
  /** Insert sanitized HTML at the current cursor position. */
  insertHtml: (html: string) => void
}

export function useTiptapEditor({
  previewHtml,
  onMarkdownChange,
  debounceMs = 300,
  shouldCreate = true,
  onColorWarning,
  onUnderlineWarning,
}: UseTiptapEditorOptions): TiptapEditorState {
  const onMarkdownChangeRef = useRef(onMarkdownChange)
  onMarkdownChangeRef.current = onMarkdownChange

  const { checkLossyMarks } = useEditorLossyMarks({ onColorWarning, onUnderlineWarning })

  // Flag to prevent infinite update loop: when we set editor content from
  // external previewHtml, the onUpdate callback fires — we must ignore it.
  const isExternalUpdateRef = useRef(false)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  // Stable reference to the current editor — keeps exec/insertHtml stable across renders
  const editorRef = useRef<Editor | null>(null)

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
      AlignedTableHeader,
      AlignedTableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      BrokenImageExtension,
    ],
    []
  )

  const editor = useEditor({
    extensions,
    content: sanitize(previewHtml),
    editable: false,
    editorProps: {
      attributes: {
        // aria-label must live on the ProseMirror div (role="textbox") itself,
        // not on the EditorContent wrapper, to satisfy axe aria-input-field-name.
        'aria-label': 'Jira content editor',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isExternalUpdateRef.current) return
      // Only sync back to Markdown when the user is actively editing.
      // This prevents the initial setContent('') (while previewHtml is still
      // loading from the worker) from firing onMarkdownChange with an empty
      // document and erasing the PLACEHOLDER / user content.
      if (!ed.isEditable) return
      const cb = onMarkdownChangeRef.current
      if (!cb) return

      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = setTimeout(() => {
        if (!onMarkdownChangeRef.current) return
        try {
          const doc = ed.state.doc
          checkLossyMarks(doc)

          const md = tiptapDocToMarkdown(doc)
          isExternalUpdateRef.current = true
          onMarkdownChangeRef.current(md)
          queueMicrotask(() => {
            isExternalUpdateRef.current = false
          })
        } catch {
          // Serialization failed — don't crash the editor
        }
      }, debounceMs)
    },
  })
  // useEditor() is still called unconditionally to satisfy React hooks rules;
  // TipTap v3 does not expose a shouldCreate option in UseEditorOptions.
  const activeEditor = shouldCreate ? editor : null

  // Keep ref in sync so exec/insertHtml always see the latest editor instance
  // without needing to list it as a useCallback dependency.
  editorRef.current = activeEditor

  // Sync external previewHtml into editor (only when not editing)
  // Uses activeEditor (not the raw editor) so we skip the sync when shouldCreate=false.
  useEffect(() => {
    if (!activeEditor) return
    if (isExternalUpdateRef.current) {
      isExternalUpdateRef.current = false
      return
    }
    // Don't overwrite content while the user is focused in the editor
    if (activeEditor.isFocused) return
    const sanitized = sanitize(previewHtml)
    isExternalUpdateRef.current = true
    activeEditor.commands.setContent(sanitized)
    queueMicrotask(() => {
      isExternalUpdateRef.current = false
    })
  }, [previewHtml, activeEditor])

  // Cancel any pending debounced HTML→Markdown conversion when the active editor
  // changes (e.g. format switches from ADF to wiki) or when the hook unmounts.
  // This also prevents the callback from firing after unmount — isMountedRef is
  // not needed because clearTimeout is guaranteed to run before any pending timer fires.
  useEffect(() => () => clearTimeout(updateTimeoutRef.current), [activeEditor])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      if (!editorRef.current) return
      execTiptapCommand(editorRef.current, cmd, arg)
    },
    [] // stable — uses editorRef so no dependency on editor instance
  )

  const insertHtml = useCallback(
    (html: string) => {
      if (!editorRef.current) return
      const sanitized = sanitize(html)
      editorRef.current.chain().focus().insertContent(sanitized).run()
    },
    [] // stable — uses editorRef so no dependency on editor instance
  )

  const activeBlock = activeEditor ? getActiveBlock(activeEditor) : 'p'

  // Stabilize the Set reference: only create a new Set when the active formats
  // actually change, so React.memo consumers (e.g. EditorToolbar) can skip re-renders.
  const prevFormatsKeyRef = useRef('')
  const stableFormatsRef = useRef(EMPTY_FORMATS)
  const rawFormats = activeEditor ? getActiveFormats(activeEditor) : EMPTY_FORMATS
  const formatsKey = Array.from(rawFormats).join(',')
  if (formatsKey !== prevFormatsKeyRef.current) {
    prevFormatsKeyRef.current = formatsKey
    stableFormatsRef.current = rawFormats
  }
  const activeFormats = stableFormatsRef.current

  const activeColor = activeEditor
    ? (activeEditor.getAttributes('textStyle').color as string | undefined)
    : undefined

  const isInTable = activeEditor?.isActive('table') ?? false
  const hasLossyMarks = useMemo(
    () =>
      activeEditor
        ? hasColorMarks(activeEditor.state.doc) || hasUnderlineMarks(activeEditor.state.doc)
        : false,
    // activeEditor.state.doc is a new immutable reference on every ProseMirror transaction,
    // so this memoizes correctly: recomputes on doc changes, skips parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEditor?.state.doc]
  )

  return {
    editor: activeEditor,
    activeBlock,
    activeFormats,
    activeColor,
    isInTable,
    hasLossyMarks,
    exec,
    insertHtml,
  }
}
