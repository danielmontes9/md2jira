/**
 * Lightweight production error reporter.
 *
 * POSTs render errors caught by ErrorBoundary (and any other call site) to
 * VITE_ERROR_URL via navigator.sendBeacon — the same fire-and-forget pattern
 * used by the web-vitals reporter in main.tsx.
 *
 * In development: logs a debug message to the console regardless of config.
 * In production:  reports to VITE_ERROR_URL when set; silently drops when unset.
 *
 * Set VITE_ERROR_URL in .env.production (or .env.example) to enable:
 *   VITE_ERROR_URL=https://your-error-collector.example.com/errors
 *
 * Worker-safe: this function only uses navigator.sendBeacon (available in
 * Workers) and import.meta.env (resolved at build time).  Do NOT add DOM or
 * React imports here.
 */
/**
 * Strips the `?md=` query parameter from a URL string to avoid leaking
 * user-authored Markdown content to error-reporting endpoints.
 * All other params (e.g. `?fmt=`) are preserved.
 */
function redactUrl(href: string): string {
  try {
    const u = new URL(href)
    u.searchParams.delete('md')
    return u.toString()
  } catch {
    // Malformed URL — return only the origin as a safe fallback.
    return typeof window !== 'undefined' ? window.location.origin : ''
  }
}

export function reportError(error: Error, componentStack?: string): void {
  if (import.meta.env.DEV) {
    // Surface the full stack in local development without cluttering production logs.
    console.debug('[report-error]', error.name, error.message, componentStack ?? '')
  }

  const errorUrl = import.meta.env.VITE_ERROR_URL
  if (!errorUrl || typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return
  }

  try {
    navigator.sendBeacon(
      errorUrl,
      new Blob(
        [
          JSON.stringify({
            name: error.name,
            message: error.message,
            stack: error.stack,
            componentStack,
            // Redact the ?md= param — it contains user-authored Markdown encoded in
            // base64 and must not be sent to third-party error collectors.
            // Only origin + pathname + safe params (?fmt=) are retained.
            url: typeof window !== 'undefined' ? redactUrl(window.location.href) : '',
            timestamp: Date.now(),
          }),
        ],
        { type: 'application/json' }
      )
    )
  } catch {
    // sendBeacon can throw in sandboxed iframes or when called during page unload.
    // Silently swallow — error reporting must never break the app.
  }
}
