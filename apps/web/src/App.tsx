import { useState, useMemo, useDeferredValue, useEffect } from 'react'
import { convert, convertToAdf } from 'md2jira-core'
import type { AdfDocument } from 'md2jira-core'
import { Header } from './components/Header.js'
import { MarkdownInput } from './components/MarkdownInput.js'
import { JiraOutput } from './components/JiraOutput.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'
import { ToastProvider } from './context/ToastContext.js'
import type { OutputFormat } from './types.js'
import { IconAlertOcticon } from './components/icons.js'
import { useTheme } from './hooks/useTheme.js'
import { useDeepLink } from './hooks/useDeepLink.js'
import { useAdfHtmlWorker } from './hooks/useAdfHtmlWorker.js'
import { useOfflineStatus } from './hooks/useTheme.js'
import { getInitialMarkdown, PLACEHOLDER } from './utils/markdown-url.js'

/** Below this character count, convert() runs on every keystroke. */
const LARGE_DOC_THRESHOLD = 10_000
/** Debounce delay in ms applied to documents above LARGE_DOC_THRESHOLD. */
const LARGE_DOC_DEBOUNCE_MS = 150

/** Reads the initial output format from the ?fmt= URL param, then localStorage, then 'adf'. */
function getInitialFormat(): OutputFormat {
  const urlFmt = new URLSearchParams(window.location.search).get('fmt')
  if (urlFmt === 'wiki' || urlFmt === 'adf') return urlFmt
  try {
    const stored = localStorage.getItem('output-format')
    if (stored === 'wiki' || stored === 'adf') return stored
  } catch {
    // localStorage unavailable (sandboxed iframe, privacy mode)
  }
  return 'adf'
}

export function App() {
  const [markdown, setMarkdown] = useState(() => getInitialMarkdown(PLACEHOLDER))
  const [format, setFormat] = useState<OutputFormat>(getInitialFormat)
  const { theme, toggleTheme } = useTheme()
  const isOffline = useOfflineStatus()

  // useDeferredValue keeps the textarea fully responsive by deferring
  // the expensive convert() / convertToAdf() calls until the browser is idle.
  // For large documents an additional debounce prevents running convert() on
  // every keystroke during rapid edits or bulk paste operations.
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown)
  useEffect(() => {
    if (markdown.length <= LARGE_DOC_THRESHOLD) {
      setDebouncedMarkdown(markdown)
      return
    }
    const t = setTimeout(() => setDebouncedMarkdown(markdown), LARGE_DOC_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [markdown])
  const deferredMarkdown = useDeferredValue(debouncedMarkdown)

  // Persist format preference to localStorage whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem('output-format', format)
    } catch {
      // localStorage unavailable — preference not persisted
    }
  }, [format])

  // Debounced URL deep-linking: update ?md= and ?fmt= params 500ms after changes.
  const { isDeepLinkActive } = useDeepLink(markdown, format)

  const { jiraOutput, adfDoc, hasConversionError } = useMemo<{
    jiraOutput: string
    adfDoc: AdfDocument | null
    hasConversionError: boolean
  }>(() => {
    try {
      if (format === 'adf') {
        const adf = convertToAdf(deferredMarkdown)
        return {
          jiraOutput: JSON.stringify(adf, null, 2),
          adfDoc: adf,
          hasConversionError: false,
        }
      }
      return { jiraOutput: convert(deferredMarkdown), adfDoc: null, hasConversionError: false }
    } catch {
      return { jiraOutput: '', adfDoc: null, hasConversionError: true }
    }
  }, [deferredMarkdown, format])

  // Renders the ADF document to HTML off-thread using a Web Worker.
  const { html: previewHtml, workerError, retryWorker } = useAdfHtmlWorker(adfDoc)

  // isPending drives the spinner in the output panel header.
  // Only show for large documents (> LARGE_DOC_THRESHOLD) where the 150 ms
  // debounce introduces a real, perceptible delay. For small docs,
  // `markdown !== deferredMarkdown` is true for only one render cycle
  // (useEffect is async) and would flash on every keystroke.
  // Capping on doc size ensures the spinner appears only when meaningful.
  const isPending = markdown.length > LARGE_DOC_THRESHOLD && markdown !== deferredMarkdown

  return (
    <ToastProvider>
      <div className="flex h-screen flex-col bg-white dark:bg-neutral-950">
        {/* Skip link — visually hidden until focused, satisfies WCAG 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-2 focus-visible:top-2 focus-visible:z-50 focus-visible:rounded focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-neutral-900 focus-visible:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:focus-visible:bg-neutral-900 dark:focus-visible:text-neutral-100"
        >
          Skip to main content
        </a>
        <Header theme={theme} onToggleTheme={toggleTheme} />
        {isOffline && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            You’re offline — the app is running from cache. Conversions still work.
          </div>
        )}
        {hasConversionError && (
          <div
            role="alert"
            className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
          >
            <IconAlertOcticon className="h-4 w-4 shrink-0" />
            Conversion error — check your Markdown for unsupported syntax.
          </div>
        )}
        {workerError && format === 'adf' && (
          <div
            role="alert"
            className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
          >
            <IconAlertOcticon className="h-4 w-4 shrink-0" />
            Preview rendering failed — the ADF output could not be displayed.
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormat('wiki')}
                className="rounded px-2 py-0.5 text-xs font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Switch to Wiki Markup
              </button>
              <button
                type="button"
                onClick={retryWorker}
                className="rounded px-2 py-0.5 text-xs font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <main
          id="main-content"
          aria-label="Main content"
          className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:flex-row sm:overflow-hidden"
        >
          <section aria-label="Markdown input" className="flex min-h-64 flex-1 flex-col sm:min-h-0">
            <ErrorBoundary>
              <MarkdownInput
                value={markdown}
                onChange={setMarkdown}
                isDeepLinkActive={isDeepLinkActive}
              />
            </ErrorBoundary>
          </section>
          <section aria-label="Jira output" className="flex min-h-64 flex-1 flex-col sm:min-h-0">
            <ErrorBoundary>
              <JiraOutput
                value={jiraOutput}
                format={format}
                onFormatChange={setFormat}
                previewHtml={previewHtml}
                isPending={isPending}
                onMarkdownChange={setMarkdown}
              />
            </ErrorBoundary>
          </section>
        </main>
      </div>
    </ToastProvider>
  )
}
