/**
 * Web Worker — runs adfToHtml() off the main thread.
 *
 * Accepts messages of shape { id: number; doc: AdfDocument } and posts back
 * { id: number; html: string }. The `id` field lets App.tsx discard stale
 * responses when a new conversion starts before the previous one completes.
 *
 * The function is pure (no DOM access), making it safe to run off-thread.
 * `sanitizeUrl` uses `new URL()` which is available in Web Worker scope.
 */
import { adfToHtml } from '../components/jira-output/adf-renderer.js'
import type { AdfDocument } from 'md2jira-core'

interface AdfWorkerRequest {
  id: number
  doc: AdfDocument
}

self.onmessage = (e: MessageEvent<AdfWorkerRequest>) => {
  const { id, doc } = e.data
  const html = adfToHtml(doc)
  self.postMessage({ id, html })
}
