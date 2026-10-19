import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f9fafb',
          fontFamily: "'DM Sans', -apple-system, sans-serif",
          textAlign: 'center',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 16,
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, margin: '0 0 24px', lineHeight: 1.5 }}>
            An unexpected error occurred while displaying this page. Tap below to return home.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(34,197,94,.3)',
            }}
          >
            Return to Home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
