import { useState, useRef, useCallback } from 'react'
import type { PointerEvent as ReactPointerEvent, SetStateAction } from 'react'

/** Minimum percentage the input panel can occupy (desktop split). */
export const SPLIT_MIN = 20
/** Maximum percentage the input panel can occupy (desktop split). */
export const SPLIT_MAX = 80

/**
 * Manages the two-panel split ratio on desktop.
 *
 * - Reads the initial split from localStorage under `storageKey` and persists
 *   every change so the ratio survives page reloads.
 * - Provides pointer-capture drag handlers for the resize divider element.
 * - Returns a ref to attach to the main container (needed to convert the
 *   pointer X coordinate into a percentage).
 */
export function usePanelSplit(storageKey: string, initial = 50) {
  const [split, setSplitRaw] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        const parsed = parseFloat(stored)
        if (!Number.isNaN(parsed) && parsed >= SPLIT_MIN && parsed <= SPLIT_MAX) return parsed
      }
    } catch {
      // localStorage unavailable (sandboxed iframe, privacy mode)
    }
    return initial
  })

  const mainRef = useRef<HTMLElement>(null)
  const isDragging = useRef(false)

  /** Wrapped setter that also persists the new value to localStorage. */
  const setSplit = useCallback(
    (value: SetStateAction<number>) => {
      setSplitRaw((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        try {
          localStorage.setItem(storageKey, String(next))
        } catch {
          // localStorage unavailable — preference not persisted
        }
        return next
      })
    },
    [storageKey],
  )

  const handleDragStart = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
  }, [])

  const handleDragMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || !mainRef.current) return
      const rect = mainRef.current.getBoundingClientRect()
      setSplit(Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, ((e.clientX - rect.left) / rect.width) * 100)))
    },
    [setSplit],
  )

  const handleDragEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  return { split, setSplit, mainRef, handleDragStart, handleDragMove, handleDragEnd }
}
