import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

/**
 * Last-resort recovery boundary. If a render throws, we try to heal the most
 * common causes (corrupted localStorage caches) and offer a one-tap reload
 * instead of leaving the user on a blank screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, healed: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    try {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info?.componentStack)
    } catch {
      /* ignore */
    }
    this.heal()
  }

  heal = () => {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (!key.startsWith('betvora_')) continue
        try {
          JSON.parse(localStorage.getItem(key))
        } catch {
          localStorage.removeItem(key)
        }
      }
    } catch {
      /* storage may be unavailable */
    }
    this.setState({ healed: true })
  }

  handleReload = () => {
    try {
      window.location.reload()
    } catch {
      /* ignore */
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <h1 className="mt-5 text-xl font-black text-white">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            BETVORA hit an unexpected error. Corrupted local data was cleared
            automatically. Reload to continue — your account and balance are safe
            on the server.
          </p>
          <div className="mt-6">
            <Button fullWidth onClick={this.handleReload}>
              <RefreshCw className="h-4 w-4" />
              Reload BETVORA
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-left text-[10px] text-white/40">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
