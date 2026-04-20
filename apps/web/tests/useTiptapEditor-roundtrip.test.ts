/**
 * Tests for the WYSIWYG edit-roundtrip path in useTiptapEditor:
 *
 *   user edits in TipTap
 *     → onUpdate fires
 *       → debounce (debounceMs)
 *         → tiptapDocToMarkdown(editor.state.doc)
 *           → onMarkdownChange(md)
 *
 * Turndown has been replaced by a direct ProseMirror doc→Markdown serializer,
 * so there is no longer a dynamic import to mock.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTiptapEditor } from '../src/hooks/useTiptapEditor.js'

describe('useTiptapEditor — edit roundtrip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls onMarkdownChange after user edits (debounce + PM serializer roundtrip)', async () => {
    const cb = vi.fn()
    const { result } = renderHook(() =>
      useTiptapEditor({
        previewHtml: '<p>initial</p>',
        onMarkdownChange: cb,
        debounceMs: 50, // short debounce so tests finish quickly
      })
    )

    // The editor starts as non-editable (read-only preview). Enable editing first,
    // as JiraOutput does when the user enters WYSIWYG edit mode.
    await act(async () => {
      result.current.editor?.setEditable(true)
    })

    // Simulate a user edit — insertHtml triggers the editor's onUpdate callback
    await act(async () => {
      result.current.insertHtml('<p>edited by user</p>')
    })

    // Wait for debounce (50 ms) + microtask flush
    await waitFor(() => expect(cb).toHaveBeenCalled(), { timeout: 3000 })

    const [calledWith] = cb.mock.calls[0] as [string]
    expect(typeof calledWith).toBe('string')
    // The PM serializer returns Markdown — verify the text content is present
    expect(calledWith).toContain('edited by user')
  })

  it('does not call onMarkdownChange when previewHtml is synced externally', async () => {
    const cb = vi.fn()
    const { rerender } = renderHook(
      (opts: { previewHtml: string; onMarkdownChange: ((md: string) => void) | undefined }) =>
        useTiptapEditor(opts),
      { initialProps: { previewHtml: '<p>initial</p>', onMarkdownChange: cb } }
    )

    // Change previewHtml from outside — this simulates the ADF pipeline update
    await act(async () => {
      rerender({ previewHtml: '<p>updated by pipeline</p>', onMarkdownChange: cb })
      // Flush all microtasks
      await Promise.resolve()
      await Promise.resolve()
    })

    // A small delay to confirm no deferred call arrives
    await new Promise((r) => setTimeout(r, 100))

    // The external sync must NOT trigger onMarkdownChange (would cause infinite loop)
    expect(cb).not.toHaveBeenCalled()
  })

  it('does not throw when onMarkdownChange is undefined', async () => {
    const { result } = renderHook(() =>
      useTiptapEditor({
        previewHtml: '<p>initial</p>',
        onMarkdownChange: undefined,
        debounceMs: 50,
      })
    )

    await act(async () => {
      result.current.insertHtml('<p>edit</p>')
    })

    // Short wait — no callback provided, should not throw
    await new Promise((r) => setTimeout(r, 150))
  })
})
