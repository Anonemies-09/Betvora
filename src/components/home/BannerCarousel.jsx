// Auto-rotating hero carousel for the authenticated home page.
// Slides come from bannerService (admin-managed). Pauses on hover/touch,
// advances every 5s, supports swipe + dots + arrows.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Activity,
  Zap,
  Users,
  Sparkles,
  Gift,
  Star,
} from 'lucide-react'
import Badge from '../common/Badge'

const ICONS = {
  trophy: Trophy,
  activity: Activity,
  zap: Zap,
  users: Users,
  sparkles: Sparkles,
  gift: Gift,
  star: Star,
}

const ROTATE_MS = 5000

function BannerArt({ icon, accent }) {
  const Icon = ICONS[icon] || Sparkles
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full blur-2xl"
        style={{ backgroundColor: `${accent}30` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-14 -right-10 hidden rotate-12 sm:block"
      >
        <div
          className="flex h-40 w-40 items-center justify-center rounded-[2rem] border border-white/20"
          style={{
            backgroundColor: `${accent}26`,
            boxShadow: `0 0 60px ${accent}44`,
          }}
        >
          <Icon className="h-20 w-20" style={{ color: accent }} strokeWidth={1.5} />
        </div>
      </div>
    </>
  )
}

export default function BannerCarousel({ banners }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  const go = useCallback(
    (dir) => {
      if (!banners.length) return
      setIndex((i) => (i + dir + banners.length) % banners.length)
    },
    [banners.length],
  )

  useEffect(() => {
    if (!banners.length || paused) return undefined
    timer.current = setTimeout(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, ROTATE_MS)
    return () => clearTimeout(timer.current)
  }, [index, paused, banners.length])

  if (!banners.length) return null
  const banner = banners[index]

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
    >
      <div className={`bg-gradient-to-r ${banner.gradient} relative`}>
        <div className="banner-grid absolute inset-0" />
        <BannerArt icon={banner.icon} accent={banner.accent} />

        <div className="relative flex min-h-[11rem] items-center p-6 sm:min-h-[12.5rem] sm:p-8">
          <div className="max-w-[70%]">
            <Badge tone="gold">{banner.badge}</Badge>
            <h2 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight text-white drop-shadow sm:text-3xl">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
                {banner.subtitle}
              </p>
            )}
            <button
              onClick={() => navigate(banner.ctaLink || '/promotions')}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-black text-navy shadow-lg transition-transform active:scale-95"
            >
              {banner.ctaLabel || 'Learn More'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {banners.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-2 flex items-center">
              <button
                onClick={() => go(-1)}
                aria-label="Previous banner"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/60 text-white backdrop-blur transition hover:bg-navy/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-2 flex items-center">
              <button
                onClick={() => go(1)}
                aria-label="Next banner"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/60 text-white backdrop-blur transition hover:bg-navy/80"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to banner ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
