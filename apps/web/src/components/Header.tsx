import { useState, useEffect, Fragment } from 'react'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

function InfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="8.01" />
              <line x1="12" y1="12" x2="12" y2="16" />
            </svg>
          </div>
          <div>
            <h2
              id="info-modal-title"
              className="text-base font-bold text-neutral-900 dark:text-neutral-100"
            >
              md2jira
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Open-source Markdown → Jira converter
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          md2jira converts Markdown documents into <strong>Jira Wiki Markup</strong> and{' '}
          <strong>Atlassian Document Format (ADF)</strong>. Paste your Markdown on the left, get
          Jira-ready content on the right — copy and paste directly into any Jira Cloud issue,
          comment, or description.
        </p>

        {/* Packages */}
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Packages
          </p>
          {[
            {
              name: 'md2jira-core',
              description:
                'Pure TypeScript conversion engine. Zero browser dependencies — works in Node.js, browsers, and VSCode extensions.',
              href: 'https://github.com/danielmontes9/md2jira/tree/main/packages/core',
              badge: 'core',
            },
            {
              name: 'md2jira-cli',
              description: 'Command-line tool to convert Markdown files from your terminal.',
              href: 'https://github.com/danielmontes9/md2jira/tree/main/packages/cli',
              badge: 'cli',
            },
            {
              name: 'md2jira-previewer',
              description: 'This web app — live two-panel converter built with React 18 + Vite.',
              href: 'https://github.com/danielmontes9/md2jira/tree/main/apps/web',
              badge: 'web',
            },
          ].map(({ name, description, href, badge }) => (
            <a
              key={badge}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50 dark:border-neutral-800 dark:hover:border-blue-800 dark:hover:bg-blue-950"
            >
              <span className="mt-0.5 shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {badge}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="mt-0.5 shrink-0 text-neutral-300 dark:text-neutral-600"
                aria-hidden="true"
              >
                <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.75.75 0 0 1-1.5 0V2.56l-3.97 3.97a.75.75 0 0 1-1.06-1.06l3.97-3.97h-1.836a.75.75 0 0 1 0-1.5z" />
              </svg>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">MIT License</span>
          <a
            href="https://github.com/danielmontes9/md2jira"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </div>
  )
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <Fragment>
      <header className="flex flex-col gap-y-2 border-b border-neutral-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-2 sm:px-6 sm:py-4 dark:border-neutral-800">
        {/* Row 1 (mobile) / Center (desktop) */}
        <h1 className="text-center sm:order-2 sm:min-w-0 sm:flex-1 truncate bg-linear-to-r from-blue-800 to-blue-300 bg-clip-text text-base font-bold text-transparent sm:text-2xl">
          md2jira-previewer
          <span className="ml-2 hidden text-sm font-normal text-neutral-500 sm:inline dark:text-neutral-400">
            Markdown to Jira Wiki Markup & ADF
          </span>
        </h1>

        {/* Row 2 (mobile only): Subtitle */}
        <p className="text-center text-sm text-neutral-500 sm:hidden dark:text-neutral-400">
          Markdown to Jira Wiki Markup &amp; ADF
        </p>

        {/* Row 3 (mobile) / Left + Right (desktop) */}
        <div className="flex items-center justify-between sm:contents">
          <a
            href="https://www.buymeacoffee.com/danielmontes9"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 sm:order-1"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              width="160"
              height="40"
              className="h-7 w-auto sm:h-10"
              loading="lazy"
            />
          </a>
          <div className="flex items-center gap-1 sm:order-3 sm:shrink-0">
            <a
              href="https://github.com/danielmontes9/md2jira"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 transition-colors hover:border-yellow-400 hover:text-yellow-500 sm:flex dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-yellow-500 dark:hover:text-yellow-400"
              aria-label="Star on GitHub"
            >
              Star on GitHub
            </a>
            <a
              href="https://github.com/danielmontes9/md2jira"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="View project on GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <button
              onClick={() => setInfoOpen(true)}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="About this project"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="8.01" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
            </button>
            <button
              onClick={onToggleTheme}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
    </Fragment>
  )
}
