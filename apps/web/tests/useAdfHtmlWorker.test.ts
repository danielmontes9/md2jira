/**
 * useAdfHtmlWorker lifecycle tests
 *
 * In jsdom the Worker URL constructor throws, so every call goes through the
 * synchronous dynamic-import fallback path.  We leverage that to test the
 * observable state transitions without spinning up real threads.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAdfHtmlWorker } from '../src/hooks/useAdfHtmlWorker.js'
import type { AdfDocument } from 'md2jira-core'

// ---------------------------------------------------------------------------
// Minimal ADF fixture
// ---------------------------------------------------------------------------
const SIMPLE_ADF: AdfDocument = {
  version: 1,
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello world' }],
    },
  ],
}

// ---------------------------------------------------------------------------
// Module mock — replace adf-renderer with a controllable spy so tests are fast
// and deterministic.  The default implementation mirrors the real output shape.
// ---------------------------------------------------------------------------
const adfToHtmlSpy = vi.fn(
  (doc: AdfDocument) =>
    `<p>${(doc.content[0] as { content?: { text?: string }[] }).content?.[0]?.text ?? ''}</p>`
)

vi.mock('../src/components/jira-output/adf-renderer.js', () => ({
  get adfToHtml() {
    return adfToHtmlSpy
  },
}))

describe('useAdfHtmlWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    adfToHtmlSpy.mockClear()
    adfToHtmlSpy.mockImplementation(
      (doc: AdfDocument) =>
        `<p>${(doc.content[0] as { content?: { text?: string }[] }).content?.[0]?.text ?? ''}</p>`
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('returns empty string when adfDoc is null', () => {
    const { result } = renderHook(() => useAdfHtmlWorker(null))
    expect(result.current.html).toBe('')
  })

  it('returns rendered HTML for a valid ADF document (sync fallback path)', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.html).toContain('Hello world')
    expect(result.current.workerError).toBe(false)
  })

  it('resets to empty string when adfDoc changes to null', async () => {
    const { result, rerender } = renderHook(
      ({ doc }: { doc: AdfDocument | null }) => useAdfHtmlWorker(doc),
      { initialProps: { doc: SIMPLE_ADF as AdfDocument | null } }
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.html).not.toBe('')
    act(() => rerender({ doc: null }))
    expect(result.current.html).toBe('')
  })

  it('updates HTML when adfDoc changes to a different document', async () => {
    const docA: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }],
    }
    const docB: AdfDocument = {
      version: 1,
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second' }] }],
    }

    const { result, rerender } = renderHook(
      ({ doc }: { doc: AdfDocument }) => useAdfHtmlWorker(doc),
      { initialProps: { doc: docA } }
    )
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.html).toContain('First')

    rerender({ doc: docB })
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.html).toContain('Second')
  })

  it('returns empty string when renderer throws', async () => {
    adfToHtmlSpy.mockImplementationOnce(() => {
      throw new Error('renderer failure')
    })

    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    // The catch branch sets previewHtml to '' — the hook must not crash
    expect(result.current.html).toBe('')
    expect(result.current.workerError).toBe(true)
  })

  it('does not apply stale response after unmount', async () => {
    const { result, unmount } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))
    // Unmount before async import resolves; cancelled flag prevents setState
    unmount()
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    // No crash — result holds whatever state was last committed before unmount
    expect(typeof result.current.html).toBe('string')
  })
})
