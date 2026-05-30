import { useState, useEffect, useRef, useCallback } from 'react'
import type { AdfDocument } from 'md2jira-core'

/** Maximum number of consecutive render failures before retryWorker becomes a no-op. */
const MAX_RETRIES = 3

/**
 * Renders an ADF document to HTML using an off-thread Web Worker.
 *
 * - The worker is created lazily on first use and reused across renders.
 * - A per-request id lets us discard stale responses if a new conversion
 *   arrives before the previous one completes.
 * - A 5 s safety-net timeout terminates a stalled worker and falls back to
 *   a synchronous dynamic import of `adf-renderer`.
 * - Falls back immediately to synchronous rendering when module Workers are
 *   not available (e.g. jsdom unit-test environments).
 */
export function useAdfHtmlWorker(
  adfDoc: AdfDocument | null,
  onFallback?: () => void
): {
  html: string
  workerError: boolean
  retryWorker: () => void
} {
  const [state, setState] = useState({ html: '', workerError: false })
  const [retryCount, setRetryCount] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const onFallbackRef = useRef(onFallback)
  onFallbackRef.current = onFallback
  // Monotonically increasing request id — used to discard stale worker responses
  const workerReqRef = useRef(0)
  // Ref for the stall-timeout id so the worker error handler can cancel it
  // without needing access to the effect-local `timeoutId` variable.
  const staleTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  // Always-current adfDoc so the worker load-error handler can render it
  // immediately without waiting for the 5 s stall timeout.
  const adfDocRef = useRef<AdfDocument | null>(null)
  adfDocRef.current = adfDoc
  // Set to true after the worker has replied at least once. The stall toast is
  // suppressed on the very first timeout because Vite dev-mode module workers
  // can take >5 s to warm up on first load — that is not a real stall.
  const workerHasRespondedRef = useRef(false)

  useEffect(() => {
    if (!adfDoc) {
      setState({ html: '', workerError: false })
      return
    }
    const id = ++workerReqRef.current

    try {
      if (!workerRef.current) {
        const w = new Worker(new URL('../workers/adf-worker.ts', import.meta.url), {
          type: 'module',
        })
        // Worker failed to load (module resolution error in Vite dev, MIME type
        // issue, etc.) — cancel the stall timeout and fall back to the synchronous
        // renderer immediately. No toast: this is a load error, not a stall.
        w.addEventListener('error', () => {
          clearTimeout(staleTimeoutRef.current)
          workerRef.current = null
          const doc = adfDocRef.current
          if (!doc) return
          import('../components/jira-output/adf-renderer.js')
            .then(({ adfToHtml }) => {
              setState({ html: adfToHtml(doc), workerError: false })
            })
            .catch(() => setState({ html: '', workerError: true }))
        })
        workerRef.current = w
      }
      const worker = workerRef.current

      const onMessage = (e: MessageEvent<{ id: number; html: string; error?: boolean }>) => {
        if (e.data.id === id) {
          clearTimeout(timeoutId)
          workerHasRespondedRef.current = true
          if (e.data.error) {
            setState({ html: '', workerError: true })
          } else {
            setState({ html: e.data.html, workerError: false })
          }
        }
      }
      // 5 s safety net: if the worker stalls (e.g. pathologically large doc),
      // terminate it and fall back to synchronous rendering.
      const timeoutId = setTimeout(() => {
        worker.removeEventListener('message', onMessage)
        workerRef.current?.terminate()
        workerRef.current = null
        import('../components/jira-output/adf-renderer.js')
          .then(({ adfToHtml }) => {
            if (workerReqRef.current === id) {
              setState({ html: adfToHtml(adfDoc), workerError: false })
              // Only show the toast if the worker had previously worked — the first
              // timeout is most likely Vite dev-mode warmup, not a real stall.
              if (workerHasRespondedRef.current) {
                onFallbackRef.current?.()
              }
            }
          })
          .catch(() => setState({ html: '', workerError: true }))
      }, 5_000)
      // Expose the timeout to the worker error handler so it can cancel immediately.
      staleTimeoutRef.current = timeoutId
      worker.addEventListener('message', onMessage)
      worker.postMessage({ id, doc: adfDoc })
      return () => {
        clearTimeout(timeoutId)
        worker.removeEventListener('message', onMessage)
      }
    } catch {
      // Worker URL construction or instantiation failed (e.g. jsdom unit tests,
      // or browsers without module-worker support) — render synchronously instead.
      // The `cancelled` flag prevents calling setPreviewHtml after the component
      // unmounts or after a newer request supersedes this one.
      let cancelled = false
      import('../components/jira-output/adf-renderer.js')
        .then(({ adfToHtml }) => {
          if (!cancelled && workerReqRef.current === id)
            setState({ html: adfToHtml(adfDoc), workerError: false })
        })
        .catch(() => {
          if (!cancelled) setState({ html: '', workerError: true })
        })
      return () => {
        cancelled = true
      }
    }
  }, [adfDoc, retryCount])

  // Terminate the worker when the hook unmounts to free resources.
  useEffect(() => () => workerRef.current?.terminate(), [])

  /** Terminates the stalled worker, clears the error, and re-triggers rendering.
   * Capped at MAX_RETRIES to prevent an infinite retry loop on persistent failures. */
  const retryWorker = useCallback(() => {
    if (retryCount >= MAX_RETRIES) return
    workerRef.current?.terminate()
    workerRef.current = null
    setState({ html: '', workerError: false })
    setRetryCount((c) => c + 1)
  }, [retryCount])

  return { html: state.html, workerError: state.workerError, retryWorker }
}
