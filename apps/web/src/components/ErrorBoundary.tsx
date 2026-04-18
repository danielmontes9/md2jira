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
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Always log to console so the error appears in CI/DevTools.
    console.error('[ErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' })
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
          <button
            onClick={this.handleRetry}
            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
