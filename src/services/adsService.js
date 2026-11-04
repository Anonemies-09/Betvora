import { ADSENSE } from '../config/ads'

export const AD_ELIGIBLE_PATHS = [
  '/home',
  '/in-play',
  '/my-bets',
  '/wallet',
  '/promotions',
]

const PREFIX_PATHS = ['/sports', '/match']

export function isAdSenseConfigured() {
  return Boolean(ADSENSE.clientId)
}

export function isAdEligibleRoute(pathname) {
  if (AD_ELIGIBLE_PATHS.includes(pathname)) return true
  return PREFIX_PATHS.some((prefix) => pathname.startsWith(`${prefix}/`))
}

export function loadAdsenseScript() {
  if (typeof window === 'undefined') return
  if (!isAdSenseConfigured()) return
  if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) return
  const script = document.createElement('script')
  script.async = true
  script.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
    ADSENSE.clientId
  script.crossOrigin = 'anonymous'
  script.dataset.betvoraAds = 'true'
  document.head.appendChild(script)
}

// Some browser extensions inject Google's ad runtime (adsbygoogle / mf.js)
// into every page they touch. When this app has no AdSense client configured,
// those scripts have no params to work with and throw "Params are not set" in
// the console. Remove them and clear the queue so the app stays clean.
export function neutralizeStrayAdScripts() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (isAdSenseConfigured()) return
  const selectors = [
    'script[src*="pagead2.googlesyndication.com"]',
    'script[src*="googlesyndication.com/pagead/js"]',
    'script[src*="/pagead/js/mf.js"]',
    'script[src*="pagead.js"]',
  ]
  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (el.dataset.betvoraAds === 'true') continue
      el.remove()
    }
  }
  try {
    if (Array.isArray(window.adsbygoogle)) {
      window.adsbygoogle = undefined
    }
  } catch {
    /* no-op */
  }
}

const CONSENT_KEY = 'betvora_ad_consent'

export function getAdConsent() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function hasAdConsent() {
  const consent = getAdConsent()
  return Boolean(consent && consent.granted === true)
}

export function isPersonalizedAllowed() {
  const consent = getAdConsent()
  return Boolean(consent && consent.granted === true && consent.personalized === true)
}

export function setAdConsent({ granted = true, personalized = false }) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ granted, personalized, ts: Date.now() }),
  )
}

export function clearAdConsent() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CONSENT_KEY)
}
