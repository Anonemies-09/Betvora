import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ADSENSE } from '../../config/ads'
import {
  isAdEligibleRoute,
  isAdSenseConfigured,
  isPersonalizedAllowed,
  loadAdsenseScript,
  getAdConsent,
} from '../../services/adsService'
import { cn } from '../../utils/cn'

export default function AdSlot({ slot, format = 'auto', fullWidthResponsive = true, className }) {
  const location = useLocation()
  const pushedRef = useRef(false)
  const consent = getAdConsent()

  const eligible =
    isAdSenseConfigured() && Boolean(consent && consent.granted === true) && isAdEligibleRoute(location.pathname)

  useEffect(() => {
    if (!eligible) return
    loadAdsenseScript()
    if (pushedRef.current) return
    pushedRef.current = true
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {
      /* no-op */
    }
  }, [eligible, location.pathname])

  if (!eligible) return null

  const personalized = isPersonalizedAllowed()

  return (
    <div className={cn('mt-6 rounded-2xl border border-white/5 bg-royal/40 p-3', className)}>
      <p className="mb-2 text-center text-[10px] font-black uppercase tracking-widest text-white/30">
        Advertisement
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE.clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        data-npa={personalized ? undefined : '1'}
      />
    </div>
  )
}
