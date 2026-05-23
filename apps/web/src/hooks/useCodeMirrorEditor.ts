import { useEffect, useRef, useCallback, type RefObject } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
  highlightActiveLineGutter,
  placeholder as cmPlaceholder,
} from '@codemirror/view'
import {
  defaultKeymap,
  history,
  historyKeymap,
  undo as cmUndo,
  redo as cmRedo,
} from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { search, searchKeymap, openSearchPanel } from '@codemirror/search'
import { tags } from '@lezer/highlight'

// ── Themes ─────────────────────────────────────────────────────────────────────

const FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

const lightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#ffffff',
      color: '#171717',
      height: '100%',
      fontSize: '0.875rem',
      fontFamily: FONT,
    },
    '.cm-content': { padding: '1rem', caretColor: '#3b82f6' },
    '.cm-focused': { outline: 'none' },
    '.cm-editor': { height: '100%' },
    '.cm-scroller': { fontFamily: FONT, lineHeight: '1.5rem', overflow: 'auto' },
    '.cm-line': { paddingLeft: '4px' },
    '.cm-gutters': {
      backgroundColor: '#fafafa',
      borderRight: '1px solid #e5e5e5',
      color: '#a3a3a3',
      padding: '0 8px 0 4px',
      minWidth: '2.5rem',
    },
    '.cm-activeLineGutter': { backgroundColor: '#f0f0f0', color: '#525252' },
    // Transparent so the selection layer (z-index: -1) is visible through
    // the active line on the last selected line. The gutter highlight is
    // sufficient to indicate which line the cursor is on.
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-selectionBackground, ::selection': { backgroundColor: '#bfdbfe !important' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: '#93c5fd !important' },
    '.cm-cursor': { borderLeftColor: '#3b82f6', borderLeftWidth: '2px' },
    '.cm-searchMatch': {
      backgroundColor: '#fef08a',
      borderRadius: '2px',
      outline: '1px solid #eab308',
    },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: '#fde047' },
    '.cm-panels': { backgroundColor: '#f5f5f5', borderTop: '1px solid #e5e5e5' },
    '.cm-panel': {
      padding: '6px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexWrap: 'wrap',
    },
    '.cm-panel input[type="text"]': {
      border: '1px solid #d4d4d4',
      borderRadius: '4px',
      padding: '2px 6px',
      outline: 'none',
      backgroundColor: '#ffffff',
      color: '#171717',
      minWidth: '140px',
    },
    '.cm-panel input[type="text"]:focus': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 2px rgba(59,130,246,0.2)',
    },
    '.cm-panel input[type="checkbox"]': { accentColor: '#3b82f6' },
    '.cm-panel button': {
      backgroundColor: '#e5e5e5',
      border: 'none',
      borderRadius: '4px',
      padding: '2px 8px',
      cursor: 'pointer',
      color: '#404040',
      fontSize: '0.8125rem',
    },
    '.cm-panel button:hover': { backgroundColor: '#d4d4d4' },
    '.cm-panel button[name="close"]': { marginLeft: 'auto' },
    '.cm-panel label': { color: '#525252', fontSize: '0.8125rem' },
  },
  { dark: false }
)

const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#171717',
      color: '#f5f5f5',
      height: '100%',
      fontSize: '0.875rem',
      fontFamily: FONT,
    },
    '.cm-content': { padding: '1rem', caretColor: '#60a5fa' },
    '.cm-focused': { outline: 'none' },
    '.cm-editor': { height: '100%' },
    '.cm-scroller': { fontFamily: FONT, lineHeight: '1.5rem', overflow: 'auto' },
    '.cm-line': { paddingLeft: '4px' },
    '.cm-gutters': {
      backgroundColor: '#0a0a0a',
      borderRight: '1px solid #262626',
      color: '#525252',
      padding: '0 8px 0 4px',
      minWidth: '2.5rem',
    },
    '.cm-activeLineGutter': { backgroundColor: '#1a1a1a', color: '#a3a3a3' },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-selectionBackground, ::selection': { backgroundColor: '#1d3461 !important' },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: '#1e3a5f !important' },
    '.cm-cursor': { borderLeftColor: '#60a5fa', borderLeftWidth: '2px' },
    '.cm-searchMatch': {
      backgroundColor: '#713f12',
      borderRadius: '2px',
      outline: '1px solid #92400e',
    },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: '#92400e' },
    '.cm-panels': { backgroundColor: '#1a1a1a', borderTop: '1px solid #262626' },
    '.cm-panel': {
      padding: '6px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexWrap: 'wrap',
    },
    '.cm-panel input[type="text"]': {
      border: '1px solid #404040',
      borderRadius: '4px',
      padding: '2px 6px',
      outline: 'none',
      backgroundColor: '#262626',
      color: '#f5f5f5',
      minWidth: '140px',
    },
    '.cm-panel input[type="text"]:focus': {
      borderColor: '#60a5fa',
      boxShadow: '0 0 0 2px rgba(96,165,250,0.2)',
    },
    '.cm-panel input[type="checkbox"]': { accentColor: '#60a5fa' },
    '.cm-panel button': {
      backgroundColor: '#333333',
      border: 'none',
      borderRadius: '4px',
      padding: '2px 8px',
      cursor: 'pointer',
      color: '#e5e5e5',
      fontSize: '0.8125rem',
    },
    '.cm-panel button:hover': { backgroundColor: '#444444' },
    '.cm-panel button[name="close"]': { marginLeft: 'auto' },
    '.cm-panel label': { color: '#a3a3a3', fontSize: '0.8125rem' },
  },
  { dark: true }
)

// ── Highlight styles ───────────────────────────────────────────────────────────

const lightHighlight = HighlightStyle.define([
  { tag: tags.heading1, color: '#1d4ed8', fontWeight: '700' },
  { tag: tags.heading2, color: '#2563eb', fontWeight: '700' },
  { tag: tags.heading3, color: '#3b82f6', fontWeight: '600' },
  { tag: [tags.heading4, tags.heading5, tags.heading6], color: '#60a5fa', fontWeight: '600' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#737373' },
  { tag: tags.monospace, color: '#be123c', fontFamily: FONT },
  { tag: tags.link, color: '#2563eb' },
  { tag: tags.url, color: '#0284c7' },
  { tag: tags.quote, color: '#6b7280', fontStyle: 'italic' },
  { tag: tags.meta, color: '#9333ea' },
  { tag: tags.processingInstruction, color: '#9333ea' },
  { tag: tags.punctuation, color: '#9ca3af' },
  { tag: tags.comment, color: '#9ca3af' },
])

const darkHighlight = HighlightStyle.define([
  { tag: tags.heading1, color: '#93c5fd', fontWeight: '700' },
  { tag: tags.heading2, color: '#60a5fa', fontWeight: '700' },
  { tag: tags.heading3, color: '#3b82f6', fontWeight: '600' },
  { tag: [tags.heading4, tags.heading5, tags.heading6], color: '#2563eb', fontWeight: '600' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#6b7280' },
  { tag: tags.monospace, color: '#fda4af', fontFamily: FONT },
  { tag: tags.link, color: '#93c5fd' },
  { tag: tags.url, color: '#7dd3fc' },
  { tag: tags.quote, color: '#9ca3af', fontStyle: 'italic' },
  { tag: tags.meta, color: '#c084fc' },
  { tag: tags.processingInstruction, color: '#c084fc' },
  { tag: tags.punctuation, color: '#6b7280' },
  { tag: tags.comment, color: '#6b7280' },
])

// ── Markdown keybindings ───────────────────────────────────────────────────────

/** Wrap the current selection (or cursor position) with `wrapper` on both sides. */
function wrapWith(wrapper: string) {
  return (view: EditorView): boolean => {
    const { from, to } = view.state.selection.main
    const selected = view.state.sliceDoc(from, to)
    const insertion = `${wrapper}${selected}${wrapper}`
    view.dispatch({
      changes: { from, to, insert: insertion },
      selection: { anchor: from === to ? from + wrapper.length : from + insertion.length },
    })
    return true
  }
}

/** Apply a transform to the text of the line at the cursor. */
function transformLine(fn: (text: string) => string) {
  return (view: EditorView): boolean => {
    const pos = view.state.selection.main.head
    const line = view.state.doc.lineAt(pos)
    const newText = fn(line.text)
    const cursorOffset = Math.min(pos - line.from, newText.length)
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: newText },
      selection: { anchor: line.from + cursorOffset },
    })
    return true
  }
}

/** Enter handler: auto-continue list items, or clear empty list markers. */
function handleListEnter(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  if (from !== to) return false
  const line = view.state.doc.lineAt(from)
  // Only handle when cursor is at line end
  if (from !== line.to) return false

  const text = line.text
  const emptyTask = /^(\s*)([-*]) \[[ x]\]\s*$/.test(text)
  const emptyBullet = /^(\s*)([-*]) $/.test(text)
  const emptyNumbered = /^(\s*)(\d+)\. $/.test(text)

  if (emptyTask || emptyBullet || emptyNumbered) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: '' },
      selection: { anchor: line.from },
    })
    return true
  }

  const taskMatch = text.match(/^(\s*)([-*]) \[[ x]\] .+$/)
  if (taskMatch) {
    const ins = `\n${taskMatch[1] ?? ''}${taskMatch[2] ?? '-'} [ ] `
    view.dispatch({ changes: { from, to, insert: ins }, selection: { anchor: from + ins.length } })
    return true
  }

  const bulletMatch = text.match(/^(\s*)([-*]) .+$/)
  if (bulletMatch) {
    const ins = `\n${bulletMatch[1] ?? ''}${bulletMatch[2] ?? '-'} `
    view.dispatch({ changes: { from, to, insert: ins }, selection: { anchor: from + ins.length } })
    return true
  }

  const numberedMatch = text.match(/^(\s*)(\d+)\. .+$/)
  if (numberedMatch) {
    const nextNum = parseInt(numberedMatch[2] ?? '1') + 1
    const ins = `\n${numberedMatch[1] ?? ''}${nextNum}. `
    view.dispatch({ changes: { from, to, insert: ins }, selection: { anchor: from + ins.length } })
    return true
  }

  return false
}

/** Duplicate the current line below the cursor. */
function duplicateLine(view: EditorView): boolean {
  const pos = view.state.selection.main.head
  const line = view.state.doc.lineAt(pos)
  const ins = `\n${line.text}`
  view.dispatch({
    changes: { from: line.to, to: line.to, insert: ins },
    selection: { anchor: line.to + ins.length },
  })
  return true
}

const markdownKeymap = [
  // Formatting
  { key: 'Mod-b', run: wrapWith('**') },
  { key: 'Mod-i', run: wrapWith('_') },
  {
    key: 'Mod-k',
    run: (view: EditorView): boolean => {
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const ins = `[${selected}](url)`
      view.dispatch({
        changes: { from, to, insert: ins },
        selection: { anchor: from + selected.length + 3, head: from + selected.length + 6 },
      })
      return true
    },
  },
  { key: 'Mod-Shift-k', run: wrapWith('`') },
  { key: 'Mod-Shift-x', run: wrapWith('~~') },
  // Line transforms
  {
    key: 'Mod-Shift-h',
    run: transformLine((text) => {
      const match = text.match(/^(#{1,6}) /)
      if (!match?.[0] || !match?.[1]) return `# ${text}`
      if (match[1].length >= 3) return text.replace(/^#{1,6} /, '')
      return `${'#'.repeat(match[1].length + 1)} ${text.substring(match[0].length)}`
    }),
  },
  {
    key: 'Mod-Shift-l',
    run: transformLine((text) => (text.startsWith('- ') ? text.substring(2) : `- ${text}`)),
  },
  {
    key: 'Mod-Shift-o',
    run: transformLine((text) =>
      /^\d+\. /.test(text) ? text.replace(/^\d+\. /, '') : `1. ${text}`
    ),
  },
  {
    key: 'Mod-Shift-q',
    run: transformLine((text) => (text.startsWith('> ') ? text.substring(2) : `> ${text}`)),
  },
  {
    key: 'Mod-Shift-c',
    run: (view: EditorView): boolean => {
      const { from, to } = view.state.selection.main
      const ins = '```\n\n```'
      view.dispatch({ changes: { from, to, insert: ins }, selection: { anchor: from + 4 } })
      return true
    },
  },
  // Structure
  {
    key: 'Mod-Enter',
    run: (view: EditorView): boolean => {
      const pos = view.state.selection.main.head
      const line = view.state.doc.lineAt(pos)
      view.dispatch({
        changes: { from: line.to, to: line.to, insert: '\n' },
        selection: { anchor: line.to + 1 },
      })
      return true
    },
  },
  { key: 'Mod-d', run: duplicateLine },
  { key: 'Enter', run: handleListEnter },
  // Tab: 2 spaces
  {
    key: 'Tab',
    run: (view: EditorView): boolean => {
      const { from, to } = view.state.selection.main
      view.dispatch({ changes: { from, to, insert: '  ' }, selection: { anchor: from + 2 } })
      return true
    },
  },
  {
    key: 'Shift-Tab',
    run: (view: EditorView): boolean => {
      const pos = view.state.selection.main.head
      const line = view.state.doc.lineAt(pos)
      const dedented = line.text.replace(/^ {1,2}/, '')
      if (dedented === line.text) return false
      const removed = line.text.length - dedented.length
      const newPos = Math.max(line.from, pos - removed)
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: dedented },
        selection: { anchor: newPos },
      })
      return true
    },
  },
]

// ── Hook ───────────────────────────────────────────────────────────────────────

interface UseCodeMirrorOptions {
  containerRef: RefObject<HTMLDivElement | null>
  value: string
  onChange: (value: string) => void
  isDark: boolean
  placeholderText?: string
  onSave?: () => void
}

interface UseCodeMirrorReturn {
  undo: () => void
  redo: () => void
  openSearch: () => void
}

export function useCodeMirrorEditor({
  containerRef,
  value,
  onChange,
  isDark,
  placeholderText = 'Paste your Markdown here...',
  onSave,
}: UseCodeMirrorOptions): UseCodeMirrorReturn {
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  // Tracks whether the last doc change originated inside CodeMirror.
  // Used to break the onChange→setState→prop→setDoc cycle.
  const internalChangeRef = useRef(false)

  const themeCompartment = useRef(new Compartment())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        internalChangeRef.current = true
        onChangeRef.current(update.state.doc.toString())
        internalChangeRef.current = false
      }
    })

    const themeExt = themeCompartment.current.of([
      isDark ? darkTheme : lightTheme,
      syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
    ])

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        markdown(),
        search({ top: false }),
        themeExt,
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              onSaveRef.current?.()
              return true
            },
          },
          ...markdownKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...defaultKeymap,
        ]),
        cmPlaceholder(placeholderText),
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: container })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // deps intentionally omitted: this effect creates the editor once on mount.
    // `value` and `isDark` are accessed via refs in the listeners above, so they
    // do not need to be listed here. Re-creating the view on every change would
    // destroy and rebuild the entire editor, losing cursor position and history.
  }, []) // intentionally runs once on mount

  // Sync external value changes (file import, URL param, history restore, etc.)
  useEffect(() => {
    const view = viewRef.current
    if (!view || internalChangeRef.current) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  // Swap theme when dark mode toggles
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: themeCompartment.current.reconfigure([
        isDark ? darkTheme : lightTheme,
        syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
      ]),
    })
  }, [isDark])

  const undo = useCallback(() => {
    const view = viewRef.current
    if (view) cmUndo(view)
  }, [])

  const redo = useCallback(() => {
    const view = viewRef.current
    if (view) cmRedo(view)
  }, [])

  const openSearch = useCallback(() => {
    const view = viewRef.current
    if (view) openSearchPanel(view)
  }, [])

  return { undo, redo, openSearch }
}
