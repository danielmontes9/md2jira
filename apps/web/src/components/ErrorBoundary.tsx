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
  }

  private static MAX_RETRIES = 3

  private handleRetry = () => {
    this.setState((prev) => ({ hasError: false, message: '', retryCount: prev.retryCount + 1 }))
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
              onClick={this.handleRetry}
              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
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
