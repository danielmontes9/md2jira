import { useState, Fragment, Suspense, memo, useCallback } from 'react'
import { IconInfoCircle, IconSun, IconMoon, IconGitHub } from './icons.js'

import { lazyNamed } from '../utils/lazy-named.js'

const InfoModal = lazyNamed(() => import('./InfoModal.js'), 'InfoModal')

const GITHUB_URL = 'https://github.com/danielmontes9/md2jira'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const Header = memo(function Header({ theme, onToggleTheme }: HeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [bmacError, setBmacError] = useState(false)
  const handleBmacError = useCallback(() => setBmacError(true), [])

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
            aria-label="Support the project — Buy me a coffee"
            className="shrink-0 sm:order-1"
          >
            {bmacError ? (
              <span className="inline-flex h-7 items-center rounded bg-yellow-400 px-3 text-xs font-medium text-yellow-900 sm:h-10 sm:px-4 sm:text-sm">
                ☕ Buy me a coffee
              </span>
            ) : (
              <img
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                width="160"
                height="40"
                className="h-7 w-auto sm:h-10"
                loading="lazy"
                onError={handleBmacError}
              />
            )}
          </a>
          <div className="flex items-center gap-1 sm:order-3 sm:shrink-0">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 transition-colors hover:border-yellow-400 hover:text-yellow-500 sm:flex dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-yellow-500 dark:hover:text-yellow-400"
              aria-label="Star on GitHub"
            >
              Star on GitHub
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="View project on GitHub"
            >
              <IconGitHub className="h-5 w-5" />
            </a>
            <button
              onClick={() => setInfoOpen(true)}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="About this project"
              aria-expanded={infoOpen}
            >
              <IconInfoCircle />
            </button>
            <button
              onClick={onToggleTheme}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </div>
      </header>
      <Suspense fallback={null}>
        {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
      </Suspense>
    </Fragment>
  )
})
