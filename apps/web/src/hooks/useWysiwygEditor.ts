import { useState, useCallback, useRef, useEffect, useMemo, type RefObject } from 'react'
import type TurndownService from 'turndown'
import { convertToAdf } from 'md2jira-core'
import { adfToHtml } from '../components/jira-output/adf-renderer.js'

interface UseWysiwygEditorOptions {
  markdown: string
  onMarkdownChange: ((md: string) => void) | undefined
}

export interface WysiwygEditorState {
  editorRef: RefObject<HTMLDivElement>
  activeBlock: string
  activeFormats: Set<string>
  previewHtml: string
  exec: (cmd: string, arg?: string) => void
  insertHtml: (html: string) => void
  saveRange: () => void
}

export function useWysiwygEditor({
  markdown,
  onMarkdownChange,
}: UseWysiwygEditorOptions): WysiwygEditorState {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isEditorUpdateRef = useRef(false)
  const tdRef = useRef<TurndownService | null>(null)
  const [editModeActive, setEditModeActive] = useState(false)

  const [activeBlock, setActiveBlock] = useState<string>('p')
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  const previewHtml = useMemo(() => {
    try {
      return adfToHtml(convertToAdf(markdown))
    } catch {
      return '<p style="color:#ef4444;">Error rendering preview</p>'
    }
  }, [markdown])

  // Initialize editor on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = previewHtml
    }
  }, []) // intentional: runs once on mount to set initial HTML

  // Sync editor when markdown changes externally (not while user edits here)
  useEffect(() => {
    if (!editorRef.current) return
    if (isEditorUpdateRef.current) {
      isEditorUpdateRef.current = false
      return
    }
    if (document.activeElement === editorRef.current) return
    editorRef.current.innerHTML = previewHtml
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
    if (!onMarkdownChange || !editorRef.current) return
    clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      if (!editorRef.current || !tdRef.current) return
      isEditorUpdateRef.current = true
      try {
        onMarkdownChange(tdRef.current.turndown(editorRef.current.innerHTML))
      } catch {
        isEditorUpdateRef.current = false
      }
    }, 300)
  }, [onMarkdownChange])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      restoreRange()
      document.execCommand(cmd, false, arg ?? '')
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  const insertHtml = useCallback(
    (html: string) => {
      restoreRange()
      document.execCommand('insertHTML', false, html)
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  return { editorRef, activeBlock, activeFormats, previewHtml, exec, insertHtml, saveRange }
}
