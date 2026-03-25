export function Header() {
  return (
    <header className="flex items-center justify-center border-b border-neutral-800 px-6 py-4">
      <h1 className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
        md2jira-previewer
      </h1>
      <span className="ml-3 text-sm text-neutral-400">
        Markdown to Jira Wiki Markup
      </span>
    </header>
  )
}
