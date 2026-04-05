import { useState, useCallback, useMemo } from 'react'
import { convertToAdf } from 'md2jira-core'
import type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfMark,
  AdfListItemNode,
  AdfTextNode,
  AdfTableRowNode,
  AdfTableHeaderNode,
  AdfTableCellNode,
} from 'md2jira-core'

type OutputFormat = 'wiki' | 'adf'
type ViewMode = 'preview' | 'code'

interface JiraOutputProps {
  value: string
  format: OutputFormat
  onFormatChange: (format: OutputFormat) => void
  markdown: string
}

function adfInlineToHtml(node: AdfInlineNode): string {
  if (node.type === 'hardBreak') return '<br>'
  let html = node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case 'strong':
          html = `<strong>${html}</strong>`
          break
        case 'em':
          html = `<em>${html}</em>`
          break
        case 'strike':
          html = `<s>${html}</s>`
          break
        case 'code':
          html = `<code>${html}</code>`
          break
        case 'link':
          html = `<a href="${(mark as AdfMark & { attrs: { href: string } }).attrs.href}">${html}</a>`
          break
      }
    }
  }
  return html
}

function adfBlockToHtml(node: AdfBlockNode): string {
  switch (node.type) {
    case 'heading':
      return `<h${node.attrs.level}>${node.content.map(adfInlineToHtml).join('')}</h${node.attrs.level}>`
    case 'paragraph':
      return `<p>${node.content.map(adfInlineToHtml).join('')}</p>`
    case 'bulletList':
      return `<ul>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ul>`
    case 'orderedList':
      return `<ol>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ol>`
    case 'codeBlock':
      return `<pre><code>${node.content.map((t: AdfTextNode) => t.text).join('')}</code></pre>`
    case 'blockquote':
      return `<blockquote>${node.content.map(adfBlockToHtml).join('')}</blockquote>`
    case 'rule':
      return '<hr>'
    case 'table': {
      const rows = node.content.map((row: AdfTableRowNode) => {
        const cells = row.content.map((cell: AdfTableHeaderNode | AdfTableCellNode) => {
          const tag = cell.type === 'tableHeader' ? 'th' : 'td'
          const inner = cell.content.map(adfBlockToHtml).join('')
          return `<${tag}>${inner}</${tag}>`
        })
        return `<tr>${cells.join('')}</tr>`
      })
      return `<table>${rows.join('')}</table>`
    }
    default:
      return ''
  }
}

function adfToHtml(doc: AdfDocument): string {
  return doc.content.map(adfBlockToHtml).join('')
}

export function JiraOutput({ value, format, onFormatChange, markdown }: JiraOutputProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')

  const previewHtml = useMemo(() => {
    try {
      const adfDoc = convertToAdf(markdown)
      return adfToHtml(adfDoc)
    } catch {
      return '<p style="color:#ef4444;">Error rendering preview</p>'
    }
  }, [markdown])

  const handleCopy = useCallback(async () => {
    if (format === 'adf') {
      const blob = new Blob([previewHtml], { type: 'text/html' })
      const textBlob = new Blob([value], { type: 'text/plain' })
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob,
        }),
      ])
    } else {
      await navigator.clipboard.writeText(value)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value, format, previewHtml])

  return (
    <div className="@container flex min-h-0 flex-1 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-2 border-b border-neutral-200 px-3 py-2 @[460px]:flex-row @[460px]:items-center @[460px]:justify-between @[460px]:px-4 dark:border-neutral-800">
        {/* Desktop: left group (Output + tabs) | Mobile: two separate rows */}
        <div className="flex flex-col gap-2 @[460px]:flex-row @[460px]:items-center @[460px]:gap-2">
          {/* Mobile row 1 */}
          <div className="flex items-center justify-between gap-2 @[460px]:justify-start">
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Output
            </span>
            {/* Copy button: mobile only */}
            <button
              onClick={handleCopy}
              className="whitespace-nowrap rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 @[460px]:hidden dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {copied ? 'Copied!' : format === 'adf' ? 'Copy for Jira' : 'Copy'}
            </button>
          </div>
          {/* Mobile row 2 / Desktop: inline after Output */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700">
              <button
                onClick={() => onFormatChange('adf')}
                className={`flex-1 whitespace-nowrap px-2 py-1 transition-colors @[460px]:flex-none ${
                  format === 'adf'
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Jira Cloud
              </button>
              <button
                onClick={() => onFormatChange('wiki')}
                className={`flex-1 whitespace-nowrap px-2 py-1 transition-colors @[460px]:flex-none ${
                  format === 'wiki'
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Wiki Markup
              </button>
            </div>
            <div className="flex flex-1 rounded-md border border-neutral-300 text-xs @[460px]:flex-none dark:border-neutral-700">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex-1 whitespace-nowrap px-2 py-1 transition-colors @[460px]:flex-none ${
                  viewMode === 'preview'
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex-1 whitespace-nowrap px-2 py-1 transition-colors @[460px]:flex-none ${
                  viewMode === 'code'
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Code
              </button>
            </div>
          </div>
        </div>
        {/* Copy button: desktop only */}
        <button
          onClick={handleCopy}
          className="hidden whitespace-nowrap rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 @[460px]:block dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          {copied ? 'Copied!' : format === 'adf' ? 'Copy for Jira' : 'Copy'}
        </button>
      </div>
      {format === 'adf' && viewMode === 'code' && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-500">
          Copies as rich text — paste directly into Jira Cloud comments
        </div>
      )}
      {viewMode === 'code' ? (
        <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-900 dark:text-neutral-100">
          {value}
        </pre>
      ) : (
        <div
          className="jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 dark:text-neutral-100"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  )
}
