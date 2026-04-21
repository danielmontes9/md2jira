import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'
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

// Report Core Web Vitals to the browser console in development only.
// Replace the console.debug call with your analytics function (e.g. gtag)
// if you want production metrics, and remove the DEV guard.
if (import.meta.env.DEV) {
  import('web-vitals')
    .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (metric: import('web-vitals').Metric) => {
        console.debug('[web-vitals]', metric.name, metric.value, metric)
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
}
