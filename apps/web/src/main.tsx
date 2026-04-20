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

// Report Core Web Vitals to the browser console in development and to any
// registered analytics endpoint in production.  The import is dynamic so the
// ~3 KB bundle never blocks the initial render.
import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
  const report = (metric: import('web-vitals').Metric) => {
    // Replace this with your analytics send function (e.g. gtag, plausible).
    console.debug('[web-vitals]', metric.name, metric.value, metric)
  }
  onCLS(report)
  onINP(report)
  onLCP(report)
  onFCP(report)
  onTTFB(report)
})
