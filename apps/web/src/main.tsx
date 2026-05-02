import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'
import { reportError } from './utils/report-error.js'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('[md2jira] Root element #root not found in the DOM. Check index.html.')
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Global uncaught error handlers — complement the per-boundary onError callbacks
// so errors that escape React (e.g. in event handlers, async code, workers) are
// also forwarded to the VITE_ERROR_URL endpoint.
window.addEventListener('error', (e) => {
  const err = e.error instanceof Error ? e.error : new Error(e.message)
  reportError(err)
})
window.addEventListener('unhandledrejection', (e) => {
  const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason))
  reportError(err)
})

// Report Core Web Vitals in all environments.
// In development: logs to console.
// In production: POSTs to VITE_VITALS_URL via sendBeacon if the env var is set.
// Set VITE_VITALS_URL to your analytics endpoint (e.g. /api/vitals or a Plausible URL).
import('web-vitals')
  .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    const vitalsUrl = import.meta.env.VITE_VITALS_URL as string | undefined

    const report = (metric: import('web-vitals').Metric) => {
      if (import.meta.env.DEV) {
        console.debug('[web-vitals]', metric.name, metric.value, metric)
      }
      if (vitalsUrl && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(
          vitalsUrl,
          new Blob([JSON.stringify({ name: metric.name, value: metric.value, id: metric.id })], {
            type: 'application/json',
          })
        )
      }
    }

    onCLS(report)
    onINP(report)
    onLCP(report)
    onFCP(report)
    onTTFB(report)
  })
  .catch(() => {
    // web-vitals is optional — silently ignore load failures (e.g. ad blockers)
  })
