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
  const { html: previewHtml, workerError, retryWorker, isRendering } = useAdfHtmlWorker(adfDoc)

  // isPending drives the spinner in the output panel header.
  // Wiki format: pending while deferred markdown conversion hasn't caught up.
  // ADF format: also pending while the Web Worker is rendering the preview.
  const isPending = markdown !== deferredMarkdown || (format === 'adf' && isRendering)

  return (
    <ToastProvider>
      <div className="flex h-screen flex-col bg-white dark:bg-neutral-950">
        <Header theme={theme} onToggleTheme={toggleTheme} />
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
            <button
              type="button"
              onClick={retryWorker}
              className="ml-auto rounded px-2 py-0.5 text-xs font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Retry
            </button>
          </div>
        )}
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:flex-row sm:overflow-hidden">
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
