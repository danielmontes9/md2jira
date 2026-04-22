import { useState, useEffect, useRef, useCallback } from 'react'
import type { AdfDocument } from 'md2jira-core'

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
export function useAdfHtmlWorker(adfDoc: AdfDocument | null): {
  html: string
  workerError: boolean
  retryWorker: () => void
} {
  const [state, setState] = useState({ html: '', workerError: false })
  const [retryCount, setRetryCount] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  // Monotonically increasing request id — used to discard stale worker responses
  const workerReqRef = useRef(0)

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
        // Clear the preview and drop the stale worker if it throws an unhandled
        // error (e.g. malformed ADF payload from an external source).
        w.addEventListener('error', () => {
          setState({ html: '', workerError: true })
          workerRef.current = null
        })
        workerRef.current = w
      }
      const worker = workerRef.current

      const onMessage = (e: MessageEvent<{ id: number; html: string; error?: boolean }>) => {
        if (e.data.id === id) {
          clearTimeout(timeoutId)
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
            if (workerReqRef.current === id)
              setState({ html: adfToHtml(adfDoc), workerError: false })
          })
          .catch(() => setState({ html: '', workerError: true }))
      }, 5_000)
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

  /** Terminates the stalled worker, clears the error, and re-triggers rendering. */
  const retryWorker = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setState({ html: '', workerError: false })
    setRetryCount((c) => c + 1)
  }, [])

  return { html: state.html, workerError: state.workerError, retryWorker }
}
