interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex flex-col gap-y-2 border-b border-neutral-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-2 sm:px-6 sm:py-4 dark:border-neutral-800">
      {/* Row 1 (mobile) / Center (desktop) */}
      <h1 className="text-center sm:order-2 sm:min-w-0 sm:flex-1 truncate bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-base font-bold text-transparent sm:text-2xl">
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
            href="https://github.com/danielmontes9/md2jira-previewer"
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
  )
}
