import { useState, useCallback, useRef, useEffect, type RefObject } from 'react'
import type TurndownService from 'turndown'
import DOMPurify from 'dompurify'
import { execCommand } from '../utils/exec-command.js'

interface UseWysiwygEditorOptions {
  previewHtml: string
  onMarkdownChange: ((md: string) => void) | undefined
}

export interface WysiwygEditorState {
  editorRef: RefObject<HTMLDivElement>
  activeBlock: string
  activeFormats: Set<string>
  exec: (cmd: string, arg?: string) => void
  insertHtml: (html: string) => void
  saveRange: () => void
}

export function useWysiwygEditor({
  previewHtml,
  onMarkdownChange,
}: UseWysiwygEditorOptions): WysiwygEditorState {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isEditorUpdateRef = useRef(false)
  const tdRef = useRef<TurndownService | null>(null)
  const [editModeActive, setEditModeActive] = useState(false)

  // Keep a stable ref to the latest onMarkdownChange callback so that
  // scheduleMarkdownUpdate never needs to be recreated when the prop changes.
  const onMarkdownChangeRef = useRef(onMarkdownChange)
  onMarkdownChangeRef.current = onMarkdownChange

  const [activeBlock, setActiveBlock] = useState<string>('p')
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  // Capture the initial HTML so the editor is populated on mount.
  // Using a ref avoids adding previewHtml to the dep array (which would
  // overwrite user edits every time the markdown re-renders).
  const initialHtmlRef = useRef(previewHtml)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(initialHtmlRef.current)
    }
  }, [])

  // Sync editor when markdown changes externally (not while user edits here)
  useEffect(() => {
    if (!editorRef.current) return
    if (isEditorUpdateRef.current) {
      isEditorUpdateRef.current = false
      return
    }
    if (document.activeElement === editorRef.current) return
    editorRef.current.innerHTML = DOMPurify.sanitize(previewHtml)
  }, [previewHtml])

  // Lazy-load TurndownService on first edit mode activation
  useEffect(() => {
    if (!editModeActive || tdRef.current) return
    let cancelled = false
    import('../components/jira-output/turndown-config.js').then(({ createTurndownService }) => {
      if (!cancelled) tdRef.current = createTurndownService()
    })
    return () => {
      cancelled = true
    }
  }, [editModeActive])

  // Cleanup any pending markdown-update timeout on unmount
  useEffect(() => () => clearTimeout(updateTimeoutRef.current), [])

  // Expose a way for JiraOutput to notify us that edit mode turned on
  // We detect this via document.activeElement when saveRange is called
  const updateSelectionState = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || !editorRef.current.contains(sel.anchorNode)) return
    setEditModeActive(true)
    const block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase()
    setActiveBlock(block)
    const fmts = new Set<string>()
    for (const cmd of [
      'bold',
      'italic',
      'underline',
      'strikeThrough',
      'subscript',
      'superscript',
    ]) {
      if (document.queryCommandState(cmd)) fmts.add(cmd)
    }
    setActiveFormats(fmts)
  }, [])

  const saveRange = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    updateSelectionState()
  }, [updateSelectionState])

  const restoreRange = useCallback(() => {
    if (!savedRangeRef.current || !editorRef.current) return
    if (document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current.cloneRange())
    }
  }, [])

  const scheduleMarkdownUpdate = useCallback(() => {
    if (!onMarkdownChangeRef.current || !editorRef.current) return
    clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      if (!editorRef.current || !tdRef.current) return
      isEditorUpdateRef.current = true
      try {
        onMarkdownChangeRef.current!(tdRef.current.turndown(editorRef.current.innerHTML))
      } catch {
        isEditorUpdateRef.current = false
      }
    }, 300)
  }, [])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      restoreRange()
      execCommand(cmd, arg)
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  const insertHtml = useCallback(
    (html: string) => {
      restoreRange()
      execCommand('insertHTML', html)
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  return { editorRef, activeBlock, activeFormats, exec, insertHtml, saveRange }
}
