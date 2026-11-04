import { useEffect, useState } from 'react'
import { readMatches } from '../services/matchService'

const FEED_EVENT = 'betvora:feed-updated'

// Live catalogue: seeded from the static card (incl. auto-detected fixtures)
// and kept in sync with every admin edit via the feed event.
export function useCatalogue() {
  const [matches, setMatches] = useState(() => readMatches())

  useEffect(() => {
    const refresh = () => setMatches(readMatches())
    window.addEventListener(FEED_EVENT, refresh)
    return () => window.removeEventListener(FEED_EVENT, refresh)
  }, [])

  return matches
}

export function notifyCatalogueUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FEED_EVENT))
  }
}
