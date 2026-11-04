import { useEffect, useState } from 'react'
import { Zap, RefreshCw, TrendingUp } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { VIRTUAL_SPORTS } from '../../data/gamesData'
import { useWallet } from '../../context/WalletContext'
import { formatCurrency, formatOdds } from '../../utils/format'

const DEFAULT_SECONDS = { vfootball: 240, vhorses: 180, vgreyhounds: 90, vtennis: 120, vbasketball: 180, vcricket: 300, vcycling: 60 }

function VirtualRaceCard({ sport }) {
  const { currency } = useWallet()
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS[sport.id])
  const [outcome, setOutcome] = useState(null)
  const [odds] = useState(() => ({
    home: 1.5 + Math.random() * 3,
    away: 1.5 + Math.random() * 3,
    draw: 2.5 + Math.random() * 4,
  }))

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setOutcome(outcome)
          return DEFAULT_SECONDS[sport.id]
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const simulate = () => {
    const roll = Math.random()
    setOutcome(roll < 0.42 ? 'home' : roll < 0.78 ? 'away' : 'draw')
  }

  return (
    <Card hoverable className="relative flex flex-col overflow-hidden p-5">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: sport.accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase italic tracking-tight text-white">{sport.name}</p>
          <p className="mt-1 max-w-[22ch] text-xs leading-relaxed text-white/40">{sport.detail}</p>
        </div>
        <span className="text-4xl">{sport.icon}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-gold" />
        <span className="text-xs font-bold text-white/60">
          Next event in{' '}
          <span className="font-black text-gold">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
        </span>
        <span className="ml-auto rounded-md bg-navy-800 px-1.5 py-0.5 text-[10px] font-bold text-white/40">
          {sport.raceLen}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[
          { key: 'home', label: 'Runner 1' },
          { key: 'draw', label: 'Runner 2' },
          { key: 'away', label: 'Runner 3' },
        ].map((slot) => (
          <div
            key={slot.key}
            className={outcome === slot.key ? 'rounded-lg border border-gold bg-gold/10 px-2 py-2 text-center' : 'rounded-lg bg-navy-800 px-2 py-2 text-center'}
          >
            <p className="text-[10px] uppercase tracking-wide text-white/35">{slot.label}</p>
            <p className="text-sm font-black text-gold">{formatOdds(odds[slot.key])}</p>
          </div>
        ))}
      </div>

      {outcome && (
        <p className="mt-3 text-center text-xs font-bold text-success">
          Result settled: {outcome === 'home' ? 'Runner 1 wins' : outcome === 'draw' ? 'Dead heat — draw' : 'Runner 2 wins'}
        </p>
      )}

      <Button size="sm" variant={outcome ? 'secondary' : 'success'} className="mt-3" onClick={simulate}>
        {outcome ? (
          <>
            <RefreshCw className="h-3.5 w-3.5" /> Re-run
          </>
        ) : (
          <>
            <TrendingUp className="h-3.5 w-3.5" /> Simulate Event
          </>
        )}
      </Button>
      <p className="mt-2 text-center text-[10px] text-white/25">Demo payout pool: {formatCurrency(250000, currency)}</p>
    </Card>
  )
}

export default function VirtualSportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-royal-400/40 bg-gradient-to-br from-blue/25 via-royal to-navy p-6 sm:p-8">
        <div className="banner-grid absolute inset-0" />
        <div className="relative">
          <Badge tone="gold">
            <Zap className="h-3 w-3" /> Results every few minutes
          </Badge>
          <h1 className="mt-3 text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl">
            Virtual Sports
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">
            Simulated sport running faster than real time. Watch odds refresh, settle your pick,
            and stack winners all day long — on the same demo wallet.
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VIRTUAL_SPORTS.map((sport) => (
          <VirtualRaceCard key={sport.id} sport={sport} />
        ))}
      </div>
    </div>
  )
}
