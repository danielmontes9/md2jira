import {
  useState,
  useMemo,
  useDeferredValue,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from 'react'
import { convert, convertToAdf } from 'md2jira-core'
import type { AdfDocument } from 'md2jira-core'
import { Header } from './components/Header.js'
import { MarkdownInput } from './components/MarkdownInput.js'
import { JiraOutput } from './components/JiraOutput.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'
import { ToastProvider, useToast } from './context/ToastContext.js'
import { SettingsProvider, useSettings } from './context/SettingsContext.js'
import type { OutputFormat } from './types.js'
import { IconAlertOcticon } from './components/icons.js'
import { useTheme } from './hooks/useTheme.js'
import { useDeepLink } from './hooks/useDeepLink.js'
import { useAdfHtmlWorker } from './hooks/useAdfHtmlWorker.js'
import { useOfflineStatus } from './hooks/useOfflineStatus.js'
import { usePwaUpdate } from './hooks/usePwaUpdate.js'
import { getInitialMarkdown, PLACEHOLDER } from './utils/markdown-url.js'
import { usePanelSplit, SPLIT_MIN, SPLIT_MAX } from './hooks/usePanelSplit.js'
import { reportError } from './utils/report-error.js'
import { useDocumentHistory } from './hooks/useDocumentHistory.js'
import { lazyNamed } from './utils/lazy-named.js'
import { HistorySidebar } from './components/HistorySidebar.js'
import { useT } from './i18n/index.js'

const SettingsModal = lazyNamed(() => import('./components/SettingsModal.js'), 'SettingsModal')

/** Below this character count, convert() runs on every keystroke. */
const LARGE_DOC_THRESHOLD = 10_000
/** Debounce delay in ms applied to documents above LARGE_DOC_THRESHOLD. */
const LARGE_DOC_DEBOUNCE_MS = 150

/** Reads the initial output format from the ?fmt= URL param, then localStorage, then 'adf'. */
function getInitialFormat(search = window.location.search): OutputFormat {
  const urlFmt = new URLSearchParams(search).get('fmt')
  if (urlFmt === 'wiki' || urlFmt === 'adf') return urlFmt
  try {
    const stored = localStorage.getItem('output-format')
    if (stored === 'wiki' || stored === 'adf') return stored
  } catch {
    // localStorage unavailable (sandboxed iframe, privacy mode)
  }
  return 'adf'
}

function AppContent() {
  const [markdown, setMarkdown] = useState(() => getInitialMarkdown(PLACEHOLDER))
  const [format, setFormat] = useState<OutputFormat>(getInitialFormat)
  const handleFormatChange = useCallback((fmt: OutputFormat) => setFormat(fmt), [])
  const { theme, toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { historyEnabled, maxHistoryEntries } = useSettings()
  const addToast = useToast()
  const { history, loadEntry, deleteEntry, deleteEntries, clearHistory, saveNow, renameEntry } =
    useDocumentHistory({
      markdown,
      enabled: historyEnabled,
      maxEntries: maxHistoryEntries,
    })
  const isOffline = useOfflineStatus()
  const { needsUpdate, applyUpdate } = usePwaUpdate()
  const t = useT()

  /** Active panel shown on mobile (below the sm: breakpoint). Desktop always shows both. */
  const [activePanel, setActivePanel] = useState<'input' | 'output'>('input')
  const { split, setSplit, mainRef, handleDragStart, handleDragMove, handleDragEnd } =
    usePanelSplit('panel-split')

  // useDeferredValue keeps the textarea fully responsive by deferring
  // the expensive convert() / convertToAdf() calls until the browser is idle.
  // For large documents an additional debounce prevents running convert() on
  // every keystroke during rapid edits or bulk paste operations.
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown)
  useEffect(() => {
    if (markdown.length <= LARGE_DOC_THRESHOLD) {
      setDebouncedMarkdown(markdown)
      return
    }
    const t = setTimeout(() => setDebouncedMarkdown(markdown), LARGE_DOC_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [markdown])
  const deferredMarkdown = useDeferredValue(debouncedMarkdown)

  // Persist format preference to localStorage whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem('output-format', format)
    } catch {
      // localStorage unavailable — preference not persisted
    }
  }, [format])

  // Debounced URL deep-linking: update ?md= and ?fmt= params after changes.
  // Adaptive debounce: 300 ms for small docs, 800 ms for large docs.
  const { isDeepLinkActive } = useDeepLink(markdown, format)

  // Global Ctrl+S / Cmd+S: save document to history.
  // Registered even when focus is outside CodeMirror (e.g., the output panel).
  useEffect(() => {
    if (!historyEnabled) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [historyEnabled, saveNow])

  // Global keyboard shortcuts for switching output format + toggling history.
  // Alt+Shift+A → Jira Cloud (ADF), Alt+Shift+W → Wiki Markup.
  // Alt+H → toggle history sidebar.
  // Alt+N → new document (saves to history first if history is enabled).
  // Using Shift for format keys prevents conflicts with dead-key / compose
  // sequences on macOS Latino keyboards where Alt+A produces å.
  useEffect(() => {
    const ac = new AbortController()
    document.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        if (e.altKey && !e.shiftKey && e.key === 'h') {
          e.preventDefault()
          setShowHistory((v) => !v)
          return
        }
        if (e.altKey && !e.shiftKey && e.key === 'n') {
          e.preventDefault()
          // Save current content before clearing (saveNow is a no-op on empty/disabled).
          saveNowRef.current()
          setMarkdown('')
          return
        }
        if (!e.altKey || !e.shiftKey) return
        if (e.key === 'A') {
          e.preventDefault()
          setFormat('adf')
        } else if (e.key === 'W') {
          e.preventDefault()
          setFormat('wiki')
        }
      },
      { signal: ac.signal }
    )
    return () => ac.abort()
  }, [])

  // Stable ref for saveNow so the Alt+N global handler never goes stale
  // without needing to re-register the event listener on every markdown change.
  const saveNowRef = useRef(saveNow)
  useEffect(() => {
    saveNowRef.current = saveNow
  }, [saveNow])

  const { jiraOutput, adfDoc, hasConversionError } = useMemo<{
    jiraOutput: string
    adfDoc: AdfDocument | null
    hasConversionError: boolean
  }>(() => {
    try {
      if (format === 'adf') {
        const adf = convertToAdf(deferredMarkdown)
        return {
          jiraOutput: JSON.stringify(adf, null, 2),
          adfDoc: adf,
          hasConversionError: false,
        }
      }
      return { jiraOutput: convert(deferredMarkdown), adfDoc: null, hasConversionError: false }
    } catch {
      return { jiraOutput: '', adfDoc: null, hasConversionError: true }
    }
  }, [deferredMarkdown, format])

  // Renders the ADF document to HTML off-thread using a Web Worker.
  // Shows a warning toast if the worker stalls and the 5 s fallback activates.
  const handleWorkerFallback = useCallback(() => {
    addToast('ADF preview stalled — using fallback renderer.', 'warning')
  }, [addToast])
  const {
    html: previewHtml,
    workerError,
    retryWorker,
  } = useAdfHtmlWorker(adfDoc, handleWorkerFallback)

  // isPending drives the spinner in the output panel header.
  // Only show for large documents (> LARGE_DOC_THRESHOLD) where the 150 ms
  // debounce introduces a real, perceptible delay. For small docs,
  // `markdown !== deferredMarkdown` is true for only one render cycle
  // (useEffect is async) and would flash on every keystroke.
  // Capping on doc size ensures the spinner appears only when meaningful.
  const isPending = markdown.length > LARGE_DOC_THRESHOLD && markdown !== deferredMarkdown

  // isLoadingPreview: the ADF worker has been given a document to render but
  // hasn't returned HTML yet. Shows a full-area spinner in JiraOutputContent
  // on the initial load and when switching back to ADF format.
  const isLoadingPreview = format === 'adf' && adfDoc !== null && previewHtml === '' && !workerError

  return (
    <div className="flex h-screen flex-col bg-neutral-100 dark:bg-neutral-950">
      {/* Skip link — visually hidden until focused, satisfies WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-2 focus-visible:top-2 focus-visible:z-50 focus-visible:rounded focus-visible:bg-white focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-neutral-900 focus-visible:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:focus-visible:bg-neutral-900 dark:focus-visible:text-neutral-100"
      >
        Skip to main content
      </a>
      <Header
        isDeepLinkActive={isDeepLinkActive}
        hasContent={markdown.length > 0}
        onOpenSettings={() => setShowSettings(true)}
        onToggleHistory={() => setShowHistory((v) => !v)}
        historyOpen={showHistory}
        historyEnabled={historyEnabled}
      />
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          {t('offlineBanner')}
        </div>
      )}
      {needsUpdate && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {t('updateAvailable')}
          <button
            type="button"
            onClick={applyUpdate}
            className="ml-1 font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {t('updateNow')}
          </button>
        </div>
      )}
      {hasConversionError && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
        >
          <IconAlertOcticon className="h-4 w-4 shrink-0" />
          {t('conversionError')}
        </div>
      )}
      {workerError && format === 'adf' && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
        >
          <IconAlertOcticon className="h-4 w-4 shrink-0" />
          {t('adfRenderError')}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormat('wiki')}
              className="rounded px-2 py-0.5 text-xs font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {t('switchToWiki')}
            </button>
            <button
              type="button"
              onClick={retryWorker}
              className="rounded px-2 py-0.5 text-xs font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      )}
      {/* Mobile panel tabs — only visible below the sm: breakpoint */}
      <div
        className="flex shrink-0 border-b border-neutral-200 sm:hidden dark:border-neutral-800"
        aria-label="Switch panel"
      >
        <button
          type="button"
          aria-pressed={activePanel === 'input'}
          onClick={() => setActivePanel('input')}
          className={`flex-1 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 ${
            activePanel === 'input'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          {t('markdownPanelLabel')}
        </button>
        <button
          type="button"
          aria-pressed={activePanel === 'output'}
          onClick={() => setActivePanel('output')}
          className={`flex-1 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 ${
            activePanel === 'output'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          {t('jiraOutputPanelLabel')}
        </button>
      </div>
      <main
        ref={mainRef}
        id="main-content"
        aria-label="Main content"
        className="flex flex-1 flex-col gap-2 overflow-auto p-2 sm:flex-row sm:gap-0 sm:overflow-hidden sm:p-0"
      >
        <section
          aria-label="Markdown input"
          style={{ flex: split }}
          className={`flex min-h-0 flex-col sm:min-h-0 sm:min-w-0 sm:overflow-hidden${
            activePanel !== 'input' ? ' hidden sm:flex' : ''
          }`}
        >
          <ErrorBoundary
            onError={(err, info) => reportError(err, info.componentStack ?? undefined)}
          >
            <MarkdownInput
              value={markdown}
              onChange={setMarkdown}
              isDark={theme === 'dark'}
              onSave={saveNow}
              historyEnabled={historyEnabled}
            />
          </ErrorBoundary>
        </section>
        {/* Resize handle — desktop only. Draggable; keyboard: ArrowLeft/Right adjust by 1 %. */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          aria-valuenow={Math.round(split)}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          className="group hidden shrink-0 cursor-col-resize select-none items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:flex sm:w-4"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              setSplit((s) => Math.max(SPLIT_MIN, s - 1))
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              setSplit((s) => Math.min(SPLIT_MAX, s + 1))
            }
          }}
        >
          <div className="h-16 w-1 rounded-full bg-neutral-300 transition-colors group-hover:bg-blue-400 group-active:bg-blue-500 group-focus-visible:bg-blue-400 dark:bg-neutral-700 dark:group-hover:bg-blue-500 dark:group-active:bg-blue-600 dark:group-focus-visible:bg-blue-500" />
        </div>
        <section
          aria-label="Jira output"
          style={{ flex: 100 - split }}
          className={`flex min-h-0 flex-col sm:min-h-0 sm:min-w-0 sm:overflow-hidden${
            activePanel !== 'output' ? ' hidden sm:flex' : ''
          }`}
        >
          <ErrorBoundary
            onError={(err, info) => reportError(err, info.componentStack ?? undefined)}
          >
            <JiraOutput
              value={jiraOutput}
              format={format}
              onFormatChange={handleFormatChange}
              previewHtml={previewHtml}
              isPending={isPending}
              isLoadingPreview={isLoadingPreview}
              onMarkdownChange={setMarkdown}
            />
          </ErrorBoundary>
        </section>
      </main>
      {/* ── History Sidebar (fixed overlay) ── */}
      {showHistory && (
        <HistorySidebar
          history={history}
          currentMarkdown={markdown}
          onLoadEntry={(id) => {
            const c = loadEntry(id)
            if (c != null) {
              setMarkdown(c)
              setShowHistory(false)
            }
          }}
          onDeleteEntry={deleteEntry}
          onDeleteEntries={deleteEntries}
          onClearHistory={clearHistory}
          onClose={() => setShowHistory(false)}
          onRenameEntry={renameEntry}
        />
      )}
      <Suspense fallback={null}>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            theme={theme}
            onToggleTheme={toggleTheme}
            historyCount={history.length}
          />
        )}
      </Suspense>
    </div>
  )
}

export function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SettingsProvider>
  )
}
