import { useState, useCallback, useEffect, useMemo, useDeferredValue } from 'react'
import { convert, convertToAdf } from 'md2jira-core'
import { adfToHtml } from './components/jira-output/adf-renderer.js'
import { Header } from './components/Header.js'
import { MarkdownInput } from './components/MarkdownInput.js'
import { JiraOutput } from './components/JiraOutput.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'
import { ToastProvider } from './context/ToastContext.js'
import type { OutputFormat } from './types.js'
import { IconAlertOcticon } from './components/icons.js'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage may throw in sandboxed iframes or when storage is disabled
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Max URL-safe encoded length (~1500 chars encoded ≈ ~1000 chars raw markdown).
// Beyond this limit we skip updating the ?md= param to avoid exceeding browser URL limits.
const URL_MD_MAX_ENCODED = 1500

function encodeMarkdown(md: string): string {
  // Standard btoa uses `+` and `/` which are not URL-safe and get mangled by
  // messaging apps (Slack, Teams). Replace them with `-` and `_` (base64url)
  // and strip padding `=` so the URL is clean.
  return btoa(encodeURIComponent(md)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeMarkdown(encoded: string): string {
  // Guard against decoding arbitrarily large URL params (DoS / memory pressure)
  if (encoded.length > URL_MD_MAX_ENCODED * 2) return ''
  try {
    // Restore base64url → standard base64 before decoding
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    return decodeURIComponent(atob(b64))
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
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // localStorage may not be available in sandboxed iframes
    }
  }, [theme])

  // Debounced URL deep-linking: update ?md= param 500ms after the user stops typing.
  // Uses requestIdleCallback (with setTimeout fallback) so the URL update never
  // interferes with rendering or typing responsiveness.
  useEffect(() => {
    const handle = setTimeout(() => {
      const updateUrl = () => {
        const url = new URL(window.location.href)
        if (!markdown) {
          url.searchParams.delete('md')
        } else {
          const encoded = encodeMarkdown(markdown)
          if (encoded.length <= URL_MD_MAX_ENCODED) {
            url.searchParams.set('md', encoded)
          } else {
            url.searchParams.delete('md')
          }
        }
        window.history.replaceState(null, '', url.toString())
      }
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(updateUrl)
      } else {
        updateUrl()
      }
    }, 500)
    return () => clearTimeout(handle)
  }, [markdown])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const isPending = markdown !== deferredMarkdown
  const { jiraOutput, hasConversionError, previewHtml } = useMemo(() => {
    try {
      if (format === 'adf') {
        const adf = convertToAdf(deferredMarkdown)
        return {
          jiraOutput: JSON.stringify(adf, null, 2),
          hasConversionError: false,
          previewHtml: adfToHtml(adf),
        }
      }
      return {
        jiraOutput: convert(deferredMarkdown),
        hasConversionError: false,
        previewHtml: '',
      }
    } catch {
      return { jiraOutput: '', hasConversionError: true, previewHtml: '' }
    }
  }, [deferredMarkdown, format])

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
            <MarkdownInput value={markdown} onChange={setMarkdown} />
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
