'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-darker to-space-darkest flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gradient-to-br from-space-mid/50 to-space-dark/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🤯</div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-white/70 mb-6 leading-relaxed">
              Don't worry, we've logged the issue. Try refreshing the page or come back in a moment!
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <summary className="text-red-300 cursor-pointer text-sm font-semibold mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-xs text-red-200 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

