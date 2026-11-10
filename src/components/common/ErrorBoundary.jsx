import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center my-6 max-w-xl mx-auto shadow-sm">
          <AlertTriangle size={36} className="mx-auto text-rose-500 mb-2" />
          <h3 className="text-base font-bold text-rose-700 dark:text-rose-300">
            {this.props.title || 'An error occurred while loading this component'}
          </h3>
          <p className="mt-1 text-xs text-muted font-mono max-w-lg mx-auto break-all bg-surface2/60 p-2.5 rounded-lg border border-line">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                if (this.props.onReset) this.props.onReset()
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 text-xs transition cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-surface2 text-ink font-semibold px-4 py-2 text-xs transition cursor-pointer"
            >
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

