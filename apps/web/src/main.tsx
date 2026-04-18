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
