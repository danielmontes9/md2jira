import { useState, Fragment, memo, useCallback, useRef, useEffect } from 'react'
import {
  IconGitHub,
  IconLink,
  IconLinkOff,
  IconSettings,
  IconPrint,
  IconChevronDown,
  IconHistory,
} from './icons.js'
import { ShareModal } from './Modal.js'

import { useT } from '../i18n/index.js'

const GITHUB_URL = 'https://github.com/danielmontes9/md2jira'

interface HeaderProps {
  isDeepLinkActive?: boolean
  hasContent?: boolean
  onOpenSettings?: () => void
  onToggleHistory?: () => void
  historyOpen?: boolean
  /** When false, the history button appears dimmed and its tooltip explains how to enable it. */
  historyEnabled?: boolean
}

export const Header = memo(function Header({
  isDeepLinkActive = false,
  hasContent = false,
  onOpenSettings = () => {},
  onToggleHistory = () => {},
  historyOpen = false,
  historyEnabled = false,
}: HeaderProps) {
  const [bmacError, setBmacError] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  /* v8 ignore next 2 -- BMaC image onError: only fires on external image load failure */
  const handleBmacError = useCallback(() => setBmacError(true), [])
  const t = useT()

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showExportMenu) return
    const ac = new AbortController()
    document.addEventListener(
      'mousedown',
      (e: MouseEvent) => {
        if (!menuRef.current?.contains(e.target as Node)) setShowExportMenu(false)
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [showExportMenu])

  return (
    <Fragment>
      <header className="flex flex-col gap-y-2 border-b border-neutral-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-2 sm:px-6 sm:py-4 dark:border-neutral-800">
        {/* Row 1 (mobile) / Center (desktop) */}
        <h1 className="text-center sm:order-2 sm:min-w-0 sm:flex-1 truncate bg-linear-to-r from-blue-800 to-blue-300 bg-clip-text text-base font-bold text-transparent sm:text-2xl">
          md2jira-previewer
          <span className="ml-2 hidden text-sm font-normal text-neutral-500 sm:inline dark:text-neutral-400">
            {t('appSubtitle')}
          </span>
        </h1>

        {/* Row 2 (mobile only): Subtitle */}
        <p className="text-center text-sm text-neutral-500 sm:hidden dark:text-neutral-400">
          {t('appSubtitle')}
        </p>

        {/* Row 3 (mobile) / Left + Right (desktop) */}
        <div className="flex items-center justify-between sm:contents">
          <a
            href="https://www.buymeacoffee.com/danielmontes9"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('supportProject')}
            className="shrink-0 sm:order-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {bmacError ? (
              <span className="inline-flex h-7 items-center rounded bg-yellow-400 px-3 text-xs font-medium text-yellow-900 sm:h-10 sm:px-4 sm:text-sm">
                {t('buyMeACoffee')}
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
              className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 transition-colors hover:border-yellow-400 hover:text-yellow-500 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-yellow-500 dark:hover:text-yellow-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('starOnGitHub')}
            >
              {t('starOnGitHub')}
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('viewOnGitHub')}
            >
              <IconGitHub className="h-5 w-5" />
            </a>
            {/* Unified Share & Export dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => hasContent && setShowExportMenu((v) => !v)}
                disabled={!hasContent}
                aria-label={t('shareOrExport')}
                aria-haspopup="true"
                aria-expanded={showExportMenu}
                title={hasContent ? t('shareOrExport') : t('noContentToShare')}
                className={`flex items-center gap-0.5 rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                  hasContent
                    ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                    : 'cursor-not-allowed text-neutral-300 dark:text-neutral-600'
                }`}
              >
                <IconLink className="h-5 w-5" />
                <IconChevronDown />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                  {/* Share link */}
                  {isDeepLinkActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowShare(true)
                        setShowExportMenu(false)
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                    >
                      <IconLink className="h-4 w-4 shrink-0" />
                      {t('shareLink')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title={t('docTooLargeForUrl')}
                      className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2.5 text-left text-sm text-neutral-400 dark:text-neutral-500"
                    >
                      <IconLinkOff className="h-4 w-4 shrink-0" />
                      <span>{t('shareLink')}</span>
                      <span className="ml-auto text-xs text-amber-500 dark:text-amber-400">
                        {t('tooLarge')}
                      </span>
                    </button>
                  )}
                  {/* Export PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      /* v8 ignore next -- window.print() is untestable in jsdom */
                      window.print()
                      setShowExportMenu(false)
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-neutral-100 px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                  >
                    <IconPrint className="h-4 w-4 shrink-0" />
                    {t('exportPdf')}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onToggleHistory}
              aria-label={historyOpen ? t('closeHistory') : t('documentHistory')}
              aria-pressed={historyOpen}
              title={historyEnabled ? t('documentHistory') : t('historyDisabledHint')}
              className={`rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                historyOpen
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : historyEnabled
                    ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                    : 'text-neutral-300 hover:bg-neutral-100 hover:text-neutral-400 dark:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-600'
              }`}
            >
              <IconHistory className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('openSettings')}
              aria-haspopup="dialog"
            >
              <IconSettings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      {showShare && <ShareModal url={window.location.href} onClose={() => setShowShare(false)} />}
    </Fragment>
  )
})
