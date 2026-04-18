import { useCallback, useRef, useEffect, type MutableRefObject } from 'react'
import type TurndownService from 'turndown'

/**
 * Manages lazy-loading of TurndownService and debounced markdown-sync scheduling.
 *
 * Turndown is loaded only after the first user interaction in the WYSIWYG editor
 * (indicated by `editModeActive` becoming true), avoiding the bundle weight until needed.
 */
export function useMarkdownSync(
  editorRef: MutableRefObject<HTMLDivElement | null>,
  // MutableRefObject (not ReadonlyRefObject) so React 19 upgrade is non-breaking.
  onMarkdownChangeRef: MutableRefObject<((md: string) => void) | undefined>,
  editModeActive: boolean,
  /** Debounce delay in milliseconds before the HTML→Markdown conversion fires. @default 300 */
  debounceMs = 300
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
      // Capture refs inside the timeout: the component may have unmounted or the
      // callback ref may have been cleared by the time the timeout fires.
      const onMarkdownChange = onMarkdownChangeRef.current
      if (!editorRef.current || !tdRef.current || !onMarkdownChange) return
      isEditorUpdateRef.current = true
      try {
        onMarkdownChange(tdRef.current.turndown(editorRef.current.innerHTML))
      } catch {
        isEditorUpdateRef.current = false
      }
    }, debounceMs)
  }, [editorRef, onMarkdownChangeRef, debounceMs])

  return { scheduleMarkdownUpdate, isEditorUpdateRef }
}
