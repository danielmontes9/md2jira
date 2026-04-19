/**
 * Escapes HTML special characters so a string is safe to embed in HTML.
 * Handles the five characters required by the HTML spec: & < > " '
 *
 * Worker-safe: this function has zero DOM or browser-API dependencies and is
 * imported by adf-renderer.ts, which runs inside apps/web/src/workers/adf-worker.ts.
 * Do NOT add imports from window, document, or any browser-only module here.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
