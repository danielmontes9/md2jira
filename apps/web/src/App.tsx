import { useState, useCallback } from 'react'
import { convert, convertToAdf } from '@md2jira-previewer/core'
import { Header } from './components/Header.js'
import { MarkdownInput } from './components/MarkdownInput.js'
import { JiraOutput } from './components/JiraOutput.js'

type OutputFormat = 'wiki' | 'adf'

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

  const jiraOutput = useCallback(() => {
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
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        <div className="flex flex-1 flex-col">
          <MarkdownInput value={markdown} onChange={setMarkdown} />
        </div>
        <div className="flex flex-1 flex-col">
          <JiraOutput
            value={jiraOutput()}
            format={format}
            onFormatChange={setFormat}
            markdown={markdown}
          />
        </div>
      </main>
    </div>
  )
}
