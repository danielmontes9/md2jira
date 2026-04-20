import { useState, useMemo, useDeferredValue } from 'react'
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

export function App() {
  const [markdown, setMarkdown] = useState(() => getInitialMarkdown(PLACEHOLDER))
  const [format, setFormat] = useState<OutputFormat>('adf')
  const { theme, toggleTheme } = useTheme()

  // useDeferredValue keeps the textarea fully responsive by deferring
  // the expensive convert() / convertToAdf() calls until the browser is idle.
  const deferredMarkdown = useDeferredValue(markdown)

  // Debounced URL deep-linking: update ?md= param 500ms after the user stops typing.
  useDeepLink(markdown)

  const isPending = markdown !== deferredMarkdown
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
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>md2jira-previewer</h2>
            <p>
              Convert Markdown to Jira Wiki Markup and Atlassian Document Format (ADF). Please
              enable JavaScript to use this tool.
            </p>
          </div>
        </noscript>
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:flex-row sm:overflow-hidden">
          <section aria-label="Markdown input" className="flex min-h-64 flex-1 flex-col sm:min-h-0">
            <ErrorBoundary>
              <MarkdownInput value={markdown} onChange={setMarkdown} />
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
