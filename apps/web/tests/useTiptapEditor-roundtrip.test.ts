/**
 * Tests for the WYSIWYG edit-roundtrip path in useTiptapEditor:
 *
 *   user edits in TipTap
 *     → onUpdate fires
 *       → debounce (debounceMs)
 *         → lazy Turndown import
 *           → html → Markdown
 *             → onMarkdownChange(md)
 *
 * The Turndown module is mocked at the module level so the async dynamic
 * import inside useTiptapEditor resolves synchronously in tests.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTiptapEditor } from '../src/hooks/useTiptapEditor.js'

// Mock the lazy-loaded Turndown module so there is no real network/FS import
// in the test environment. The factory must be declared at module level so
// Vitest's hoisting can intercept the dynamic import() inside the hook.
vi.mock('../src/components/jira-output/turndown-config.js', () => ({
  createTurndownService: () => ({
    turndown: (html: string) => `mocked-md: ${html}`,
  }),
}))

describe('useTiptapEditor — edit roundtrip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls onMarkdownChange after user edits (debounce + Turndown roundtrip)', async () => {
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

    // Wait for debounce (50 ms) + async microtask chain (dynamic import → turndown → callback)
    await waitFor(() => expect(cb).toHaveBeenCalled(), { timeout: 3000 })

    const [calledWith] = cb.mock.calls[0] as [string]
    expect(typeof calledWith).toBe('string')
    // The mocked Turndown prepends "mocked-md:" so we know it went through
    expect(calledWith).toContain('mocked-md:')
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
