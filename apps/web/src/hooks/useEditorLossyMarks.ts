import { useRef } from 'react'
import type { Node } from '@tiptap/pm/model'
import { hasColorMarks, hasUnderlineMarks } from '../utils/tiptap-to-markdown.js'

interface UseEditorLossyMarksOptions {
  /**
   * Called at most once per editing session when the serializer detects color
   * marks that will be silently stripped by the Jira conversion pipeline.
   * Reset when all color marks are removed from the document.
   */
  onColorWarning?: (() => void) | undefined
  /**
   * Called at most once per editing session when the serializer detects
   * underline marks. Markdown has no underline syntax, so underline formatting
   * will be lost in the Jira output. Reset when all underline marks are removed.
   */
  onUnderlineWarning?: (() => void) | undefined
}

/**
 * Tracks whether the TipTap document contains color or underline marks that
 * will be silently stripped by the Jira conversion pipeline (no color or
 * underline syntax in Jira Wiki Markup / ADF).
 *
 * Fires each callback at most once per "session" — i.e. while marks are
 * continuously present. Resets when all marks of that type are removed so the
 * warning fires again if the user re-applies the format.
 *
 * Extracted from useTiptapEditor so the warning logic is independently
 * testable without constructing a full TipTap editor instance.
 */
export function useEditorLossyMarks({
  onColorWarning,
  onUnderlineWarning,
}: UseEditorLossyMarksOptions): { checkLossyMarks: (doc: Node) => void } {
  // Stable refs so checkLossyMarks always reads the latest callbacks without
  // being recreated on every render (mirrors the pattern used in useTiptapEditor
  // for onMarkdownChangeRef).
  const onColorWarningRef = useRef(onColorWarning)
  onColorWarningRef.current = onColorWarning
  const colorWarnedRef = useRef(false)

  const onUnderlineWarningRef = useRef(onUnderlineWarning)
  onUnderlineWarningRef.current = onUnderlineWarning
  const underlineWarnedRef = useRef(false)

  /**
   * Inspects the ProseMirror document and fires warning callbacks as needed.
   * Call this inside the TipTap `onUpdate` handler after each user edit.
   */
  function checkLossyMarks(doc: Node): void {
    const docHasColor = hasColorMarks(doc)
    if (docHasColor && !colorWarnedRef.current) {
      colorWarnedRef.current = true
      onColorWarningRef.current?.()
    } else if (!docHasColor) {
      // Reset so the warning fires again if color is re-applied later.
      colorWarnedRef.current = false
    }

    const docHasUnderline = hasUnderlineMarks(doc)
    if (docHasUnderline && !underlineWarnedRef.current) {
      underlineWarnedRef.current = true
      onUnderlineWarningRef.current?.()
    } else if (!docHasUnderline) {
      underlineWarnedRef.current = false
    }
  }

  return { checkLossyMarks }
}
