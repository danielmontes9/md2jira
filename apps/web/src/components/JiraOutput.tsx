import { useState, useCallback } from 'react'

interface JiraOutputProps {
  value: string
}

export function JiraOutput({ value }: JiraOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-sm font-medium text-neutral-400">Jira Wiki Markup</span>
        <button
          onClick={handleCopy}
          className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-100">
        {value}
      </pre>
    </div>
  )
}
