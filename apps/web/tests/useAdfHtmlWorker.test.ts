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

  it('returns empty html when adfDoc is null', () => {
    const { result } = renderHook(() => useAdfHtmlWorker(null))
    expect(result.current.html).toBe('')
  })

  it('returns html after rendering completes', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(result.current.html).toContain('Hello world')
  })
})

// ---------------------------------------------------------------------------
// Worker message-path tests (mocked Worker)
//
// The tests above all rely on jsdom's Worker constructor throwing, which
// routes the hook through the synchronous fallback.  The section below stubs
// the global Worker so the try-block succeeds and we can exercise the
// onMessage handler, the stale-id guard, and the error-response branch.
// ---------------------------------------------------------------------------

describe('useAdfHtmlWorker — Worker message path (mocked Worker)', () => {
  type MessageHandler = (e: MessageEvent<unknown>) => void

  /** Minimal fake Worker that lets tests fire message/error events. */
  interface FakeWorker {
    postMessage: ReturnType<typeof vi.fn>
    terminate: ReturnType<typeof vi.fn>
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
    _fire: (type: 'message' | 'error', data?: unknown) => void
    _handlers: Map<string, MessageHandler[]>
  }

  let fakeWorker: FakeWorker

  beforeEach(() => {
    vi.useFakeTimers()
    adfToHtmlSpy.mockClear()

    const handlers = new Map<string, MessageHandler[]>()

    fakeWorker = {
      _handlers: handlers,
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: vi.fn((type: string, handler: MessageHandler) => {
        const list = handlers.get(type) ?? []
        list.push(handler)
        handlers.set(type, list)
      }),
      removeEventListener: vi.fn((type: string, handler: MessageHandler) => {
        handlers.set(
          type,
          (handlers.get(type) ?? []).filter((h) => h !== handler)
        )
      }),
      _fire(type, data) {
        const event = new MessageEvent(type, { data })
        for (const h of handlers.get(type) ?? []) h(event)
      },
    }

    // Stub the global Worker constructor to return our fake worker.
    vi.stubGlobal('Worker', vi.fn().mockReturnValue(fakeWorker))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('updates html when the worker responds with a matching request id', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))

    // Wait for the effect to run and postMessage to be called
    await act(async () => {
      await Promise.resolve()
    })

    // Grab the id the hook sent to the worker
    const posted = fakeWorker.postMessage.mock.calls[0]![0] as { id: number; doc: AdfDocument }

    // Fire a successful response from the worker
    act(() => {
      fakeWorker._fire('message', { id: posted.id, html: '<p>Worker result</p>' })
    })

    expect(result.current.html).toBe('<p>Worker result</p>')
    expect(result.current.workerError).toBe(false)
  })

  it('discards a stale response whose request id does not match', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))

    await act(async () => {
      await Promise.resolve()
    })

    // Fire a message with the WRONG id — the hook must ignore it
    act(() => {
      fakeWorker._fire('message', { id: 9999, html: '<p>Stale</p>' })
    })

    // html stays empty (initial state) — stale response was discarded
    expect(result.current.html).toBe('')
    expect(result.current.workerError).toBe(false)
  })

  it('sets workerError when the worker responds with an error flag', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))

    await act(async () => {
      await Promise.resolve()
    })

    const posted = fakeWorker.postMessage.mock.calls[0]![0] as { id: number }

    act(() => {
      fakeWorker._fire('message', { id: posted.id, html: '', error: true })
    })

    expect(result.current.html).toBe('')
    expect(result.current.workerError).toBe(true)
  })

  it('retryWorker() becomes a no-op after MAX_RETRIES (3) exhausted retries', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))

    // Wait for initial effect — 1 postMessage call
    await act(async () => {
      await Promise.resolve()
    })
    expect(fakeWorker.postMessage.mock.calls.length).toBe(1)

    // 3 retries — each must trigger a new postMessage (retryCount 0→1→2→3)
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        result.current.retryWorker()
      })
      await act(async () => {
        await Promise.resolve()
      })
    }
    // After 3 retries: initial(1) + 3 retry effects = 4 postMessages total
    expect(fakeWorker.postMessage.mock.calls.length).toBe(4)

    // 4th retryWorker() call — retryCount === MAX_RETRIES (3), must be a no-op
    await act(async () => {
      result.current.retryWorker()
    })
    await act(async () => {
      await Promise.resolve()
    })

    // No additional postMessage — the guard prevented the retry
    expect(fakeWorker.postMessage.mock.calls.length).toBe(4)
  })

  it('falls back to synchronous rendering after the 5 s safety-net timeout fires', async () => {
    const { result } = renderHook(() => useAdfHtmlWorker(SIMPLE_ADF))

    // Wait for the effect to run — postMessage should be called once.
    await act(async () => {
      await Promise.resolve()
    })
    expect(fakeWorker.postMessage.mock.calls.length).toBe(1)

    // Do NOT fire any message from the worker — simulate a completely stalled worker.
    // Advance the timer past the 5 s safety-net threshold so the timeout callback fires.
    await act(async () => {
      vi.advanceTimersByTime(5_001)
    })
    // Flush the dynamic import() promise that the timeout callback triggers.
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    // The timeout fires: terminates the stalled worker, imports adf-renderer synchronously.
    expect(fakeWorker.terminate).toHaveBeenCalled()
    // The synchronous fallback renders HTML via the spy.
    expect(result.current.html).toContain('Hello world')
    expect(result.current.workerError).toBe(false)
  })
})
