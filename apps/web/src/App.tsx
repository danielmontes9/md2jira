import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react'
import { convert, convertToAdf } from 'md2jira-core'
import { Header } from './components/Header.js'
import { MarkdownInput } from './components/MarkdownInput.js'
import { JiraOutput } from './components/JiraOutput.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'

type OutputFormat = 'wiki' | 'adf'
type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Max URL-safe encoded length (~1500 chars encoded ≈ ~1000 chars raw markdown).
// Beyond this limit we skip updating the ?md= param to avoid exceeding browser URL limits.
const URL_MD_MAX_ENCODED = 1500

function encodeMarkdown(md: string): string {
  return btoa(encodeURIComponent(md))
}

function decodeMarkdown(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded))
  } catch {
    return ''
  }
}

function getInitialMarkdown(placeholder: string): string {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('md')
  if (encoded) {
    const decoded = decodeMarkdown(encoded)
    if (decoded) return decoded
  }
  return placeholder
}

const PLACEHOLDER = `# My Issue

Some **bold** text, _italic_, and ~~strikethrough~~.

## Details

| Field | Value |
|-------|-------|
| Status | In Progress |
| Priority | **High** |

- Item 1
- Item 2
  - Nested item

\`\`\`js
console.log("hello")
\`\`\`

> A blockquote

[Jira Docs](https://confluence.atlassian.com/jira)
`

export function App() {
  const [markdown, setMarkdown] = useState(() => getInitialMarkdown(PLACEHOLDER))
  const [format, setFormat] = useState<OutputFormat>('adf')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // useDeferredValue keeps the textarea fully responsive by deferring
  // the expensive convert() / convertToAdf() calls until the browser is idle.
  const deferredMarkdown = useDeferredValue(markdown)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Debounced URL deep-linking: update ?md= param 500ms after the user stops typing
  useEffect(() => {
    const handle = setTimeout(() => {
      const encoded = encodeMarkdown(markdown)
      const url = new URL(window.location.href)
      if (encoded.length <= URL_MD_MAX_ENCODED) {
        url.searchParams.set('md', encoded)
      } else {
        // Document too large — remove the param to avoid truncated/broken URLs
        url.searchParams.delete('md')
      }
      window.history.replaceState(null, '', url.toString())
    }, 500)
    return () => clearTimeout(handle)
  }, [markdown])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const { jiraOutput, hasConversionError } = useMemo(() => {
    try {
      const output =
        format === 'adf'
          ? JSON.stringify(convertToAdf(deferredMarkdown), null, 2)
          : convert(deferredMarkdown)
      return { jiraOutput: output, hasConversionError: false }
    } catch {
      return { jiraOutput: '', hasConversionError: true }
    }
  }, [deferredMarkdown, format])

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-neutral-950">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      {hasConversionError && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.5a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5.5zm-.75 6a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z" />
          </svg>
          Conversion error — check your Markdown for unsupported syntax.
        </div>
      )}
      <noscript>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>md2jira-previewer</h2>
          <p>
            Convert Markdown to Jira Wiki Markup and Atlassian Document Format (ADF). Please enable
            JavaScript to use this tool.
          </p>
        </div>
      </noscript>
      <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:flex-row sm:overflow-hidden">
        <section aria-label="Markdown input" className="flex min-h-64 flex-1 flex-col sm:min-h-0">
          <MarkdownInput value={markdown} onChange={setMarkdown} />
        </section>
        <section aria-label="Jira output" className="flex min-h-64 flex-1 flex-col sm:min-h-0">
          <ErrorBoundary>
            <JiraOutput
              value={jiraOutput}
              format={format}
              onFormatChange={setFormat}
              markdown={markdown}
              onMarkdownChange={setMarkdown}
            />
          </ErrorBoundary>
        </section>
      </main>
    </div>
  )
}
