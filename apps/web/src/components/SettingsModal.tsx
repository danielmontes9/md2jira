import { useState, useId, Suspense } from 'react'
import { Modal } from './Modal.js'
import { useSettings } from '../context/SettingsContext.js'
import { useT } from '../i18n/index.js'
import { IconClose, IconInfoCircle } from './icons.js'
import { lazyNamed } from '../utils/lazy-named.js'

const InfoModal = lazyNamed(() => import('./InfoModal.js'), 'InfoModal')

interface SettingsModalProps {
  onClose: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  /** Current number of saved history entries, for display purposes. */
  historyCount?: number
}

export function SettingsModal({ onClose, theme, onToggleTheme, historyCount }: SettingsModalProps) {
  const {
    historyEnabled,
    toggleHistory,
    maxHistoryEntries,
    setMaxHistoryEntries,
    locale,
    setLocale,
  } = useSettings()
  const t = useT()
  const titleId = useId()
  const langId = useId()
  const themeToggleId = useId()
  const historyToggleId = useId()
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <>
      <Modal onClose={onClose} ariaLabelledBy={titleId}>
        <div className="flex w-full max-w-lg flex-col gap-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
            <h2
              id={titleId}
              className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {t('settingsTitle')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              aria-label={t('closeSettings')}
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-0 overflow-y-auto max-h-[70dvh]">
            {/* 1. Language */}
            <section className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span
                    id={langId}
                    className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    {t('settingsLanguageLabel')}
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('settingsLanguageDescription')}
                  </p>
                </div>
                <div
                  role="radiogroup"
                  aria-labelledby={langId}
                  className="flex rounded-md border border-neutral-300 text-xs dark:border-neutral-700"
                >
                  {(['en', 'es', 'pt', 'fr'] as const).map((l, i) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={locale === l}
                      onClick={() => setLocale(l)}
                      className={`px-3 py-1 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                        i === 0
                          ? 'rounded-l-md'
                          : i === 3
                            ? 'rounded-r-md border-l border-neutral-300 dark:border-neutral-700'
                            : 'border-l border-neutral-300 dark:border-neutral-700'
                      } ${
                        locale === l
                          ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                    >
                      {{ en: 'English', es: 'Espa\u00f1ol', pt: 'Portugu\u00eas', fr: 'Fran\u00e7ais' }[l]}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Dark mode */}
            <section className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor={themeToggleId}
                    className="cursor-pointer text-sm font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    {t('darkModeLabel')}
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('darkModeDescription')}
                  </p>
                </div>
                <button
                  id={themeToggleId}
                  role="switch"
                  type="button"
                  aria-checked={theme === 'dark'}
                  onClick={onToggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                      theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* 3. Save document history */}
            <section className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <label
                    htmlFor={historyToggleId}
                    className="cursor-pointer text-sm font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    {t('historyLabel')}
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('historyDescription')}
                  </p>
                </div>
                <button
                  id={historyToggleId}
                  role="switch"
                  type="button"
                  aria-checked={historyEnabled}
                  onClick={toggleHistory}
                  className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    historyEnabled ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                      historyEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* 2b. Max saved documents — only visible when history is enabled */}
            {historyEnabled && (
              <section className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {t('maxEntriesLabel')}
                      {historyCount !== undefined && (
                        <span className="ml-1.5 text-xs font-normal text-neutral-400 dark:text-neutral-500">
                          ({historyCount} {t('historySavedCount')})
                        </span>
                      )}
                    </span>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t('settingsMaxEntriesDescription')}
                    </p>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={t('maxEntriesLabel')}
                    className="flex rounded-md border border-neutral-300 text-xs dark:border-neutral-700"
                  >
                    {([10, 25, 50] as const).map((n, i) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={maxHistoryEntries === n}
                        onClick={() => setMaxHistoryEntries(n)}
                        className={`px-3 py-1 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                          i === 0 ? 'rounded-l-md' : ''
                        } ${i === 2 ? 'rounded-r-md' : ''} ${
                          i > 0 ? 'border-l border-neutral-300 dark:border-neutral-700' : ''
                        } ${
                          maxHistoryEntries === n
                            ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 3. About */}
            <section className="px-5 py-4">
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="flex w-full items-center gap-2 text-sm text-neutral-700 hover:text-blue-600 dark:text-neutral-300 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
              >
                <IconInfoCircle className="h-4 w-4 shrink-0" />
                {t('settingsAbout')}
              </button>
            </section>
          </div>
        </div>
      </Modal>
      <Suspense fallback={null}>
        {infoOpen && <InfoModal onClose={() => setInfoOpen(false)} />}
      </Suspense>
    </>
  )
}
