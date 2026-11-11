import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Star, Radio, Sparkles, TrendingUp } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Tabs from '../../components/common/Tabs'
import { CASINO_CATEGORIES, CRASH_GAMES, GAME_BANNER } from '../../data/gamesData'
import { useWallet } from '../../context/WalletContext'
import { useAuth } from '../../context/AuthContext'
import * as walletService from '../../services/walletService'
import { formatCurrency } from '../../utils/format'
import { cn } from '../../utils/cn'

const CRASH_IDS = CRASH_GAMES.map((g) => g.id)

function GameModal({ game, open, onClose }) {
  const { currency, refresh } = useWallet()
  const { user } = useAuth()
  const [stake, setStake] = useState(100)
  const [phase, setPhase] = useState('idle') // idle | spinning | win | lose
  const [multiplier, setMultiplier] = useState(1)
  const [error, setError] = useState('')

  const play = async () => {
    if (phase === 'spinning') return
    setError('')
    setPhase('spinning')
    setMultiplier(1)
    try {
      // Take the stake from the real wallet before the result is drawn.
      await walletService.deductForBet(stake, `${game?.name || 'Casino'} spin stake`, user?.id)
    } catch (err) {
      setError(err.message)
      setPhase('idle')
      return
    }
    await new Promise((r) => setTimeout(r, 1400))
    const roll = Math.random()
    const mult = roll < 0.45 ? 0 : roll < 0.7 ? 1.2 : roll < 0.85 ? 2 : roll < 0.95 ? 3.5 : 6
    setMultiplier(mult)
    try {
      if (mult > 0) {
        await walletService.creditGameWinnings(
          Math.round(stake * mult),
          `${game?.name || 'Casino'} win at ${mult}x`,
          user?.id,
        )
      }
      await refresh()
      setPhase(mult === 0 ? 'lose' : 'win')
    } catch (err) {
      setError(err.message)
      setPhase(mult === 0 ? 'lose' : 'win')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={game?.name}
      subtitle={game ? `${game.provider} • RTP ${game.rtp}` : ''}
      footer={
        phase === 'spinning' ? (
          <Button fullWidth size="lg" disabled loading>
            Spinning…
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={play}>
            <Play className="h-4 w-4" />
            {phase === 'idle' ? 'Spin' : 'Play Again'}
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 py-2">
          <span className="text-5xl">{game?.icon}</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {phase === 'win' && (
              <Badge tone="green">+{formatCurrency(Math.round(stake * multiplier), currency)} win</Badge>
            )}
            {phase === 'lose' && <Badge tone="red">Bust — stake lost</Badge>}
            {phase === 'spinning' && <Badge tone="blue">Resolving…</Badge>}
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2">
          {[50, 100, 500, 1000].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStake(value)}
              className={cn(
                'rounded-xl border py-2.5 text-sm font-black transition-colors',
                stake === value
                  ? 'border-gold bg-gold text-navy-800'
                  : 'border-royal-400/40 bg-navy-800 text-white/60 hover:border-gold/50',
              )}
            >
              {formatCurrency(value, currency)}
            </button>
          ))}
        </div>

        <p className="rounded-xl border border-royal-400/30 bg-navy-800/60 px-4 py-3 text-xs leading-relaxed text-white/45">
          Winnings and losses hit your wallet instantly. Play responsibly.
        </p>
      </div>
    </Modal>
  )
}

export default function CasinoPage() {
  const navigate = useNavigate()
  const categories = CASINO_CATEGORIES.map((c) => c.name)
  const [active, setActive] = useState(CASINO_CATEGORIES[0].name)
  const [selected, setSelected] = useState(null)

  const category = CASINO_CATEGORIES.find((c) => c.name === active) || CASINO_CATEGORIES[0]

  const openGame = (game) => {
    if (game.id === 'aviator') {
      navigate('/aviator')
      return
    }
    if (CRASH_IDS.includes(game.id)) {
      navigate('/crash')
      return
    }
    setSelected(game)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-royal-400/40 bg-gradient-to-br from-blue/25 via-royal to-navy p-6 sm:p-8">
        <div className="banner-grid absolute inset-0" />
        <div className="relative">
          <Badge tone="gold">
            <Sparkles className="h-3 w-3" /> New games added weekly
          </Badge>
          <h1 className="mt-3 text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl">
            {GAME_BANNER.title}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">{GAME_BANNER.subtitle}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/aviator')}>Play Aviator</Button>
            <Button variant="outline" onClick={() => navigate('/crash')}>
              <TrendingUp className="h-4 w-4" />
              Crash lobby
            </Button>
            <Button variant="ghost" onClick={() => navigate('/sports')}>
              Browse sports odds
            </Button>
          </div>
        </div>
      </section>

      <Tabs tabs={categories} active={active} onChange={setActive} scrollable />

      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black uppercase italic tracking-tight text-white">{category.name}</h2>
        <span className="hidden text-xs text-white/35 sm:inline">{category.tagline}</span>
        {category.live && (
          <Badge tone="red" dot>
            Live now
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {category.games.map((game) => (
          <Card key={game.id} hoverable onClick={() => openGame(game)} className="group relative flex flex-col p-4">
            <div className="flex items-start justify-between">
              <span className="text-4xl transition-transform duration-200 group-hover:scale-110">{game.icon}</span>
              {game.id === 'gates-of-olympus' && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy-800">
                  <Star className="h-3.5 w-3.5 fill-current" />
                </span>
              )}
            </div>
            <p className="mt-3 truncate text-sm font-black text-white">{game.name}</p>
            <p className="mt-0.5 truncate text-[11px] text-white/35">{game.provider}</p>
            <div className="mt-auto flex items-center justify-between pt-3">
              <span className="rounded-md bg-navy-800 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                {game.rtp}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-white/50 transition-colors group-hover:text-gold">
                <Play className="h-3 w-3" /> Play
              </span>
            </div>
          </Card>
        ))}
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/5 p-5">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-gold" />
          <div>
            <p className="text-sm font-black text-white">Can&apos;t decide?</p>
            <p className="text-xs text-white/45">Start with the crash lobby — rounds resolve every few seconds.</p>
          </div>
        </div>
        <Button onClick={() => navigate('/crash')}>Open Crash Games</Button>
      </section>

      <GameModal game={selected} open={selected !== null} onClose={() => setSelected(null)} />
    </div>
  )
}
