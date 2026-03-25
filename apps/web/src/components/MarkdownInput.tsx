interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownInput({ value, onChange }: MarkdownInputProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Markdown</span>
      </div>
      <textarea
        className="flex-1 resize-none bg-transparent p-4 font-mono text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your Markdown here..."
        spellCheck={false}
      />
    </div>
  )
}
