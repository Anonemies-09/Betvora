import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDot,
  Radio,
  Dices,
  Gamepad2,
  Gift,
  Zap,
  TrendingUp,
  Plane,
  Users,
  ChevronRight,
  Check,
} from 'lucide-react'
import Button from '../../components/common/Button'
import MatchCard from '../../components/sports/MatchCard'
import Tabs from '../../components/common/Tabs'
import Badge from '../../components/common/Badge'
import AdSlot from '../../components/common/AdSlot'
import BannerCarousel from '../../components/home/BannerCarousel'
import PromotionBanner from '../../components/home/PromotionBanner'
import { useCatalogue } from '../../hooks/useCatalogue'
import { useBanners } from '../../hooks/useBanners'
import { usePromotions } from '../../hooks/usePromotions'
import { useWallet } from '../../context/WalletContext'
import { formatCurrency } from '../../utils/format'

const CATEGORIES = [
  { label: 'Sports', icon: CircleDot, to: '/sports', accent: '#4CAF50' },
  { label: 'Live Betting', icon: Radio, to: '/in-play', accent: '#F44336' },
  { label: 'Casino', icon: Dices, to: '/casino', accent: '#FFC107' },
  { label: 'Aviator', icon: Plane, to: '/aviator', accent: '#F44336' },
  { label: 'Crash Games', icon: TrendingUp, to: '/crash', accent: '#FFD54F' },
  { label: 'Virtuals', icon: Zap, to: '/virtuals', accent: '#1E88E5' },
  { label: 'Esports', icon: Gamepad2, to: '/sports/esports', accent: '#A78BFA' },
  { label: 'Promo', icon: Gift, to: '/promotions', accent: '#E09B00' },
]

const MATCH_TABS = ['Live Now', 'Top Matches', 'Popular', 'A–Z Sports']

const PROMO_CARDS = [
  { title: 'Aviator', action: 'Play Now', to: '/aviator', icon: Plane, accent: '#F44336', extra: 'Cash out in time' },
  { title: 'Crash Games', action: 'Play Now', to: '/crash', icon: TrendingUp, accent: '#FFC107' },
  { title: 'Virtual Sports', action: 'Play Now', to: '/virtuals', icon: Zap, accent: '#1E88E5' },
  { title: 'Casino Games', action: 'Play Now', to: '/casino', icon: Dices, accent: '#FFC107' },
  { title: 'Refer & Earn', action: 'More Info', to: '/profile/referral', icon: Users, accent: '#4CAF50', extra: 'Earn up to 15%' },
  { title: 'Daily Freebet', action: 'Claim Now', to: '/promotions', icon: Gift, accent: '#E09B00' },
]

function WalletPanel({ balance, bonus, currency, onDeposit, onWithdraw }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-royal-600 via-royal to-navy p-5">
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-white/50">Main Wallet</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {formatCurrency(balance, currency)}
            </p>
          </div>
          <button
            onClick={onDeposit}
            aria-label="Add funds"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-white shadow-lg shadow-gold/30 transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-navy/50 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold text-white/45">Bonus Wallet</p>
            <p className="text-sm font-black text-gold">{formatCurrency(bonus, currency)}</p>
          </div>
          <span className="text-[11px] font-semibold text-white/35">Rollover: ×1</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="primary" onClick={onDeposit}>
            <ArrowDownToLine className="h-4 w-4" />
            Deposit
          </Button>
          <Button
            className="border-royal-400 bg-royal-400 text-white hover:bg-royal-600 hover:border-royal-600"
            onClick={onWithdraw}
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  )
}

function WelcomeBanner({ currency, claimed, onClaim }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-royal-600 via-royal-400 to-navy">
      <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0">
          <Badge tone="gold">100% Welcome Bonus</Badge>
          <h2 className="mt-2 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
            Match your first deposit, up to {formatCurrency(100000, currency)}
          </h2>
          <p className="mt-1 text-xs text-white/50">
            Bonus credit lands instantly and is yours to bet across any sport.
          </p>
          <Button size="sm" className="mt-4" onClick={onClaim} disabled={claimed}>
            {claimed ? (
              <>
                <Check className="h-4 w-4" /> Bonus Claimed
              </>
            ) : (
              'Claim Bonus'
            )}
          </Button>
        </div>
        <div className="hidden shrink-0 text-center sm:block">
          <p className="text-3xl font-black text-gold">100%</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Bonus match
          </p>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { balance, bonus, currency, claimBonus } = useWallet()
  const { banners } = useBanners({ activeOnly: true })
  const { promotions } = usePromotions({ activeOnly: true })
  const [tab, setTab] = useState('Live Now')
  const [bonusClaimed, setBonusClaimed] = useState(() => {
    try {
      return localStorage.getItem('betvora_bonus_claimed') === 'true'
    } catch {
      return false
    }
  })

  const handleClaim = async () => {
    try {
      await claimBonus()
      setBonusClaimed(true)
    } catch {
      setBonusClaimed(true)
    }
  }

  const catalogue = useCatalogue()
  const liveMatches = catalogue.filter((m) => m.isLive)
  const topMatches = catalogue.filter((m) => m.featured)
  const popularMatches = catalogue.filter((m) => !m.isLive).slice(0, 5)
  const azMatches = [...catalogue].sort((a, b) =>
    a.homeTeam.localeCompare(b.homeTeam),
  )

  const visible =
    tab === 'Live Now'
      ? liveMatches
      : tab === 'Top Matches'
        ? topMatches
        : tab === 'Popular'
          ? popularMatches
          : azMatches

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <BannerCarousel banners={banners} />

      <WalletPanel
        balance={balance}
        bonus={bonus}
        currency={currency}
        onDeposit={() => navigate('/wallet')}
        onWithdraw={() => navigate('/wallet')}
      />

      <WelcomeBanner
        currency={currency}
        claimed={bonusClaimed}
        onClaim={handleClaim}
      />

      {promotions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">
              Hot Promotions
            </h2>
            <button
              onClick={() => navigate('/promotions')}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold transition-colors hover:text-gold-600"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {promotions.slice(0, 2).map((promo) => (
              <button
                key={promo.id}
                onClick={() => navigate('/promotions')}
                className="text-left"
              >
                <PromotionBanner promotion={promo} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-white/60">
          Quick Access
        </h2>
        <div className="no-scrollbar -mx-4 grid grid-flow-col auto-cols-[4.75rem] gap-3 overflow-x-auto px-4 pb-1">
          {CATEGORIES.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/5 bg-royal px-2 py-3.5 transition-all duration-150 hover:border-gold/40 hover:bg-royal-600"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${item.accent}1f`, color: item.accent }}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-bold leading-tight text-white/70">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Tabs tabs={MATCH_TABS} active={tab} onChange={setTab} />
        <div className="mt-4 space-y-3">
          {visible.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => navigate(`/match/${match.id}`)}
            />
          ))}
        </div>
        {tab === 'Live Now' && liveMatches.length > 0 && (
          <button
            onClick={() => navigate('/in-play')}
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-bold text-gold transition-colors hover:text-gold-600"
          >
            View all live matches <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-white/60">
          More Ways to Play
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {PROMO_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.to)}
              className="rounded-2xl border border-white/5 bg-royal p-4 text-left transition-all duration-150 hover:border-gold/40 hover:bg-royal-600"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${card.accent}1f`, color: card.accent }}
              >
                <card.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-black text-white">{card.title}</p>
              {card.extra && <p className="mt-0.5 text-xs text-white/45">{card.extra}</p>}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-gold">
                {card.action} <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <AdSlot slot="home_bottom" className="mx-auto w-full max-w-2xl" />
    </div>
  )
}
