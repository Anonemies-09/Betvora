import { useState } from 'react'
import { Link } from 'react-router-dom'

export const COOKIE_CONSENT_KEY = 'betvora_cookie_consent'

function readConsent() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY))
  } catch {
    return null
  }
}

export default function ConsentNotice() {
  const [consent, setConsent] = useState(readConsent)

  if (consent) return null

  const decide = (advertising) => {
    const choice = {
      essential: true,
      analytics: false,
      advertising,
      ts: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(choice))
    setConsent(choice)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-navy-800/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1 text-xs leading-relaxed text-white/60">
          <p className="font-black uppercase tracking-widest text-white/80">Cookies on BETVORA</p>
          <p className="mt-1">
            We use essential cookies to keep the site running and your session signed in. With
            your OK we also use non-essential cookies for analytics and advertising. Read our{' '}
            <Link to="/cookies" className="font-semibold text-gold hover:text-gold-600">
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-semibold text-gold hover:text-gold-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => decide(false)}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Essential only
          </button>
          <button
            onClick={() => decide(true)}
            className="rounded-lg bg-gold px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gold-600"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
