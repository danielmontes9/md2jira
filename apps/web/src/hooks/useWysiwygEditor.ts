import { useState, useCallback, useRef, useEffect, type RefObject } from 'react'
import DOMPurify from 'dompurify'
import { execCommand } from '../utils/exec-command.js'
import { useEditorSelection } from './useEditorSelection.js'
import { useMarkdownSync } from './useMarkdownSync.js'

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
  const [editModeActive, setEditModeActive] = useState(false)

  // Keep a stable ref to the latest onMarkdownChange callback so that
  // scheduleMarkdownUpdate never needs to be recreated when the prop changes.
  const onMarkdownChangeRef = useRef(onMarkdownChange)
  onMarkdownChangeRef.current = onMarkdownChange

  // Selection range management and active-format tracking
  const { activeBlock, activeFormats, saveRange, restoreRange } = useEditorSelection(
    editorRef,
    useCallback(() => setEditModeActive(true), [])
  )

  // Turndown lazy-loading and debounced markdown sync
  const { scheduleMarkdownUpdate, isEditorUpdateRef } = useMarkdownSync(
    editorRef,
    onMarkdownChangeRef,
    editModeActive
  )

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
  }, [previewHtml, isEditorUpdateRef])

  const exec = useCallback(
    (cmd: string, arg?: string) => {
      restoreRange()
      execCommand(cmd, arg)
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  // Security: sanitize all HTML before insertion to prevent XSS from pasted or
  // externally-generated content. (OWASP A03: Injection)
  const insertHtml = useCallback(
    (html: string) => {
      restoreRange()
      execCommand('insertHTML', DOMPurify.sanitize(html))
      scheduleMarkdownUpdate()
    },
    [restoreRange, scheduleMarkdownUpdate]
  )

  return { editorRef, activeBlock, activeFormats, exec, insertHtml, saveRange }
}
