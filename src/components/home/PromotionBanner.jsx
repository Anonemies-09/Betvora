import { Sparkles, Gift, Zap, Users, Star } from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'

const ICONS = {
  sparkles: Sparkles,
  gift: Gift,
  zap: Zap,
  users: Users,
  star: Star,
}

export default function PromotionBanner({ promotion }) {
  const Icon = ICONS[promotion.icon] || Sparkles
  const accent = promotion.accent || '#FFC107'
  return (
    <Card className="relative min-h-[8.5rem] overflow-hidden p-5">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${promotion.gradient}`}
        aria-hidden="true"
      />
      <div className="banner-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-navy/35" aria-hidden="true" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-8 flex h-28 w-28 items-center justify-center rounded-2xl border border-white/15"
        style={{ backgroundColor: `${accent}2e`, boxShadow: `0 0 44px ${accent}44` }}
      >
        <Icon className="h-12 w-12" style={{ color: accent }} strokeWidth={1.5} />
      </div>

      <div className="relative">
        <Badge tone="gold" className="bg-navy/60">
          <Sparkles className="h-3 w-3" />
          {promotion.tag}
        </Badge>
        <h3 className="mt-3 max-w-[75%] text-base font-black uppercase leading-tight tracking-tight text-white sm:text-lg">
          {promotion.title}
        </h3>
        <p className="mt-1 text-2xl font-black uppercase tracking-tight text-gold">
          {promotion.subtitle}
        </p>
      </div>
    </Card>
  )
}
