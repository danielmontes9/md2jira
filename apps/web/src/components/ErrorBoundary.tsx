import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
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
