import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) { return { error } }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 'var(--space-huge) var(--space-xxl)',
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text-secondary)',
        }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>Something went wrong</p>
          <p style={{ fontSize: 14, marginBottom: 24, color: 'var(--color-error)' }}>{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase',
              padding: '8px 20px', borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
