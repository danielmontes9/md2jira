import { useCallback, useRef, useEffect, type MutableRefObject, type RefObject } from 'react'
import type TurndownService from 'turndown'

/**
 * Manages lazy-loading of TurndownService and debounced markdown-sync scheduling.
 *
 * Turndown is loaded only after the first user interaction in the WYSIWYG editor
 * (indicated by `editModeActive` becoming true), avoiding the bundle weight until needed.
 */
export function useMarkdownSync(
  editorRef: RefObject<HTMLDivElement | null>,
  onMarkdownChangeRef: RefObject<((md: string) => void) | undefined>,
  editModeActive: boolean
): {
  scheduleMarkdownUpdate: () => void
  isEditorUpdateRef: MutableRefObject<boolean>
} {
  const tdRef = useRef<TurndownService | null>(null)
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const isEditorUpdateRef = useRef(false)

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
  }, [editorRef, onMarkdownChangeRef])

  return { scheduleMarkdownUpdate, isEditorUpdateRef }
}
