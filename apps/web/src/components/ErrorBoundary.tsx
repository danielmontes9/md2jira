import { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** Optional error reporter — called in componentDidCatch. Integrate Sentry or similar here. */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  message: string
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '', retryCount: 0 }
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Always log to console so the error appears in CI/DevTools.
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
    // Auto-retry only for transient errors (chunk-load failures, network errors).
    // Deterministic render bugs should NOT be auto-retried — they would just loop.
    if (
      this.state.retryCount < ErrorBoundary.MAX_RETRIES &&
      ErrorBoundary.isTransientError(error)
    ) {
      const delay = Math.pow(2, this.state.retryCount) * 500
      clearTimeout(this.autoRetryTimer)
      this.autoRetryTimer = setTimeout(this.handleRetry, delay)
    }
  }

  private static MAX_RETRIES = 3
  /** After this many ms without errors, reset retryCount so the user can retry again. */
  private static RESET_TIMEOUT_MS = 30_000
  /** Returns true for errors that are likely transient (chunk-load, network). */
  private static isTransientError(error: Error): boolean {
    const msg = error.message
    return (
      error.name === 'ChunkLoadError' ||
      /loading (chunk|module|css)/i.test(msg) ||
      /failed to fetch/i.test(msg) ||
      /networkerror/i.test(msg)
    )
  }
  private resetTimer: ReturnType<typeof setTimeout> | undefined
  private autoRetryTimer: ReturnType<typeof setTimeout> | undefined

  private handleRetry = () => {
    this.setState((prev) => ({ hasError: false, message: '', retryCount: prev.retryCount + 1 }))
  }

  override componentDidUpdate(_prevProps: Props, prevState: State): void {
    // When we recover from an error (hasError becomes false), cancel the
    // auto-retry timer (retry already fired) and start a timer to reset
    // retryCount so the user gets fresh retries if errors recur later.
    if (prevState.hasError && !this.state.hasError) {
      clearTimeout(this.autoRetryTimer)
      clearTimeout(this.resetTimer)
      this.resetTimer = setTimeout(() => {
        this.setState({ retryCount: 0 })
      }, ErrorBoundary.RESET_TIMEOUT_MS)
    }
  }

  override componentWillUnmount(): void {
    clearTimeout(this.resetTimer)
    clearTimeout(this.autoRetryTimer)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-sm text-red-600 dark:text-red-400"
        >
          <span>Render error: {this.state.message}</span>
          {this.state.retryCount < ErrorBoundary.MAX_RETRIES ? (
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500"
            >
              Retry ({ErrorBoundary.MAX_RETRIES - this.state.retryCount} remaining)
            </button>
          ) : (
            <span className="text-xs text-red-400">
              Maximum retries reached. Please reload the page.
            </span>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
