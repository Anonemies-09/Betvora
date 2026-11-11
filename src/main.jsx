import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { bootstrapFirestore } from './services/firestoreService'
import { neutralizeStrayAdScripts } from './services/adsService'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

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
