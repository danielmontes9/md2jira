import { useState, useCallback, useEffect, useMemo } from 'react'
import { convert, convertToAdf } from 'md2jira-core'
import { Header } from './components/Header.js'
import { MarkdownInput } from './components/MarkdownInput.js'
import { JiraOutput } from './components/JiraOutput.js'

type OutputFormat = 'wiki' | 'adf'
type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
  const [markdown, setMarkdown] = useState(PLACEHOLDER)
  const [format, setFormat] = useState<OutputFormat>('adf')
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const jiraOutput = useMemo(() => {
    try {
      if (format === 'adf') {
        return JSON.stringify(convertToAdf(markdown), null, 2)
      }
      return convert(markdown)
    } catch {
      return '// Error converting markdown'
    }
  }, [markdown, format])

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-neutral-950">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <noscript>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">md2jira-previewer</h2>
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
          <JiraOutput
            value={jiraOutput}
            format={format}
            onFormatChange={setFormat}
            markdown={markdown}
          />
        </section>
      </main>
    </div>
  )
}
