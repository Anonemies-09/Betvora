import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { bootstrapFirestore } from './services/firestoreService'
import { neutralizeStrayAdScripts } from './services/adsService'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Global safety net: clear corrupted caches and reload on unrecoverable errors.
if (typeof window !== 'undefined') {
  const heal = () => {
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith('betvora_')) continue
        try {
          JSON.parse(localStorage.getItem(key))
        } catch {
          localStorage.removeItem(key)
        }
      }
    } catch {
      /* ignore */
    }
  }
  window.addEventListener('error', (event) => {
    heal()
    // eslint-disable-next-line no-console
    console.error('[global error]', event?.error || event?.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    heal()
    // eslint-disable-next-line no-console
    console.error('[unhandled rejection]', event?.reason)
  })
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Hydrate the public match catalogue, promotions and banners from Firestore.
// Fire-and-forget so it never blocks first paint.
bootstrapFirestore()

// Extensions can inject ad scripts after the page starts loading; keep the
// app free of them whenever ads are not configured.
neutralizeStrayAdScripts()
if (typeof window !== 'undefined') {
  const hasAddedScript = (mutations) =>
    mutations.some((m) => Array.from(m.addedNodes).some((n) => n.nodeType === 1 && n.tagName === 'SCRIPT'))
  new MutationObserver((mutations) => {
    if (hasAddedScript(mutations)) neutralizeStrayAdScripts()
  }).observe(document.documentElement, { childList: true, subtree: true })
}
