import { useState, useCallback, useRef, type RefObject } from 'react'

/**
 * Manages editor selection range, active block state, and active inline-format state.
 *
 * @param editorRef     - Ref to the contentEditable div.
 * @param onFirstInteraction - Called once when the user has an active selection inside
 *   the editor (used by the parent hook to trigger Turndown lazy-loading).
 */
export function useEditorSelection(
  editorRef: RefObject<HTMLDivElement | null>,
  onFirstInteraction?: () => void
): {
  activeBlock: string
  activeFormats: Set<string>
  saveRange: () => void
  restoreRange: () => void
} {
  const savedRangeRef = useRef<Range | null>(null)
  const [activeBlock, setActiveBlock] = useState<string>('p')
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())

  const updateSelectionState = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || !editorRef.current.contains(sel.anchorNode)) return
    onFirstInteraction?.()
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
  }, [editorRef, onFirstInteraction])

  const saveRange = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
    updateSelectionState()
  }, [editorRef, updateSelectionState])

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
  }, [editorRef])

  return { activeBlock, activeFormats, saveRange, restoreRange }
}
