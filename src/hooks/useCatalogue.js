import { useEffect, useState } from 'react'
import { readMatches } from '../services/matchService'
import { hydratePublicData } from '../services/cloudSync'

const FEED_EVENT = 'betvora:feed-updated'

// Live catalogue: seeded from the static card (incl. auto-detected fixtures)
// and kept in sync with every admin edit via the feed event. Polls the cloud
// every 30s so odds/scores edited on another device show up here too.
export function useCatalogue() {
  const [matches, setMatches] = useState(() => readMatches())

  useEffect(() => {
    const refresh = () => setMatches(readMatches())
    window.addEventListener(FEED_EVENT, refresh)
    const interval = setInterval(async () => {
      try {
        const hydrated = await hydratePublicData()
        if (hydrated) {
          notifyCatalogueUpdated()
          setMatches(readMatches())
        }
      } catch {
        /* ignore transient network errors */
      }
    }, 30000)
    return () => {
      window.removeEventListener(FEED_EVENT, refresh)
      clearInterval(interval)
    }
  }, [])

  return matches
}

export function notifyCatalogueUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FEED_EVENT))
  }
}