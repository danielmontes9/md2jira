interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
}

export function MarkdownInput({ value, onChange }: MarkdownInputProps) {
  return (
    <div className="flex flex-1 flex-col rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="text-sm font-medium text-neutral-400">Markdown</span>
      </div>
      <textarea
        className="flex-1 resize-none bg-transparent p-4 font-mono text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your Markdown here..."
        spellCheck={false}
      />
    </div>
  )
}
