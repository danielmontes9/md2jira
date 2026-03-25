import { useState, useCallback, useMemo } from 'react'
import { convertToAdf } from '@md2jira-previewer/core'
import type { AdfDocument, AdfBlockNode, AdfInlineNode, AdfMark } from '@md2jira-previewer/core'

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
      return `<ul>${node.content.map((item) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ul>`
    case 'orderedList':
      return `<ol>${node.content.map((item) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ol>`
    case 'codeBlock':
      return `<pre><code>${node.content.map((t) => t.text).join('')}</code></pre>`
    case 'blockquote':
      return `<blockquote>${node.content.map(adfBlockToHtml).join('')}</blockquote>`
    case 'rule':
      return '<hr>'
    case 'table': {
      const rows = node.content.map((row) => {
        const cells = row.content.map((cell) => {
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
    <div className="flex flex-1 flex-col rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-400">Output</span>
          <div className="flex rounded-md border border-neutral-700 text-xs">
            <button
              onClick={() => onFormatChange('adf')}
              className={`px-2 py-1 transition-colors ${
                format === 'adf'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Jira Cloud
            </button>
            <button
              onClick={() => onFormatChange('wiki')}
              className={`px-2 py-1 transition-colors ${
                format === 'wiki'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Wiki Markup
            </button>
          </div>
          <div className="flex rounded-md border border-neutral-700 text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 transition-colors ${
                viewMode === 'preview'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-2 py-1 transition-colors ${
                viewMode === 'code'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Code
            </button>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
        >
          {copied
            ? 'Copied!'
            : format === 'adf'
              ? 'Copy for Jira'
              : 'Copy'}
        </button>
      </div>
      {format === 'adf' && viewMode === 'code' && (
        <div className="border-b border-neutral-800 bg-neutral-950 px-4 py-1.5 text-xs text-neutral-500">
          Copies as rich text — paste directly into Jira Cloud comments
        </div>
      )}
      {viewMode === 'code' ? (
        <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-100">
          {value}
        </pre>
      ) : (
        <div
          className="jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-100"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  )
}
