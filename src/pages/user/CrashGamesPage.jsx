import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Ban, Trophy, TrendingUp, Zap, Plane } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { CRASH_GAMES } from '../../data/gamesData'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import * as walletService from '../../services/walletService'
import { formatCurrency, formatOdds } from '../../utils/format'
import { cn } from '../../utils/cn'

function pickCrashPoint() {
  const r = Math.random()
  if (r < 0.68) return 1 + Math.random() * 2.6
  if (r < 0.88) return 3.6 + Math.random() * 8
  if (r < 0.97) return 11.6 + Math.random() * 40
  return 51.6 + Math.random() * 150
}

export default function CrashGamesPage() {
  const { user } = useAuth()
  const { balance, currency, refresh } = useWallet()
  const [stake, setStake] = useState(100)
  const [phase, setPhase] = useState('idle')
  const [mult, setMult] = useState(1)
  const [history, setHistory] = useState([])
  const [lastWin, setLastWin] = useState(0)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const cashInRef = useRef(0)
  const runningRef = useRef(false)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const startRound = async () => {
    if (runningRef.current) return
    setError('')
    try {
      await walletService.deductForBet(stake, 'Crash round stake', user?.id)
      await refresh()
    } catch (err) {
      setError(err.message)
      return
    }
    const crashAt = pickCrashPoint()
    cashInRef.current = stake
    runningRef.current = true
    setPhase('running')
    setMult(1)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setMult((m) => {
        const next = m * 1.014 + 0.0045
        if (next >= crashAt) {
          clearInterval(timerRef.current)
          runningRef.current = false
          setPhase('bust')
          setHistory((h) => [{ mult: crashAt, cashed: false }, ...h].slice(0, 8))
          return crashAt
        }
        return next
      })
    }, 90)
  }

  const cashOut = async () => {
    if (phase !== 'running') return
    clearInterval(timerRef.current)
    runningRef.current = false
    const win = Math.round(cashInRef.current * mult)
    setLastWin(win)
    try {
      await walletService.creditWinnings(win, `Crash cash out at ${mult.toFixed(2)}x`, user?.id)
      await refresh()
    } catch {
      /* ignore */
    }
    setPhase('cashed')
    setHistory((h) => [{ mult, cashed: true }, ...h].slice(0, 8))
  }

  const multColor = mult < 2 ? 'text-white' : mult < 10 ? 'text-gold' : 'text-success'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-royal-400/40 bg-gradient-to-br from-blue/25 via-royal to-navy p-6 sm:p-8">
        <div className="banner-grid absolute inset-0" />
        <div className="relative">
          <Badge tone="gold">
            <TrendingUp className="h-3 w-3" /> Rounds resolve every few seconds
          </Badge>
          <h1 className="mt-3 text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl">
            Crash Games
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/50">
            Watch the multiplier climb and cash out before it busts. Every round settles against
            your real wallet balance.
          </p>
          <Link
            to="/aviator"
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-gold px-5 py-3 text-sm font-bold text-navy-800 transition-colors hover:bg-gold-600"
          >
            <Plane className="h-4 w-4" fill="currentColor" strokeWidth={1} /> Play Aviator
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CRASH_GAMES.map((game) => {
          const inner = (
            <>
              <span className="text-3xl">{game.icon}</span>
              <p className="mt-2 text-xs font-black text-white">{game.name}</p>
              <p className="text-[10px] text-white/35">{game.multiplier}</p>
              <p className="mt-1 text-[10px] font-bold" style={{ color: game.color }}>
                {game.popularity}
              </p>
              {game.id === 'aviator' && (
                <p className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-gold">
                  Play now →
                </p>
              )}
            </>
          )
          return game.id === 'aviator' ? (
            <Link key={game.id} to="/aviator" className="block">
              <Card hoverable className="h-full border-gold/40 p-3">
                {inner}
              </Card>
            </Link>
          ) : (
            <Card key={game.id} className="h-full p-3">
              {inner}
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative overflow-hidden p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Live multiplier</p>
            {phase === 'running' && <Badge tone="red" dot>In round</Badge>}
          </div>

          <div className="relative my-8 flex flex-col items-center justify-center py-10">
            <p className={cn('text-6xl font-black italic tracking-tight sm:text-7xl', multColor)}>
              ×{mult.toFixed(2)}
            </p>
            {phase === 'bust' && (
              <p className="mt-2 rounded-lg bg-danger/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-danger">
                Bust — stake lost
              </p>
            )}
            {phase === 'cashed' && (
              <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-success">
                <Trophy className="h-3.5 w-3.5" /> +{formatCurrency(lastWin, currency)} cashed out
              </p>
            )}
            {phase === 'idle' && (
              <p className="mt-2 text-xs text-white/35">Place a stake to join the next round</p>
            )}
          </div>

          <div className="mx-auto h-24 w-full overflow-hidden rounded-xl border border-royal-400/30 bg-navy-800/70">
            <svg viewBox="0 0 600 100" preserveAspectRatio="none" className="h-full w-full">
              <polyline
                points="0,100 600,8"
                fill="none"
                stroke={phase === 'bust' ? 'var(--color-danger)' : 'var(--color-gold)'}
                strokeWidth="2"
              />
              <polygon points="0,100 600,8 600,100" fill="url(#crashGrad)" opacity="0.25" />
              <defs>
                <linearGradient id="crashGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-blue)" />
                  <stop offset="100%" stopColor="var(--color-gold)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <p className="text-xs font-black uppercase tracking-widest text-white/50">Stake</p>
          <p className="mt-2 text-2xl font-black text-white">{formatCurrency(balance, currency)}</p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[50, 100, 200, 500].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStake(value)}
                className={cn(
                  'rounded-xl border py-2 text-xs font-black transition-colors',
                  stake === value
                    ? 'border-gold bg-gold text-navy-800'
                    : 'border-royal-400/40 bg-navy-800 text-white/60 hover:border-gold/50',
                )}
              >
                {formatCurrency(value, currency)}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2">
            {phase === 'running' ? (
              <Button size="lg" fullWidth variant="success" onClick={cashOut}>
                <Trophy className="h-4 w-4" /> Cash Out ×{mult.toFixed(2)}
              </Button>
            ) : (
              <Button size="lg" fullWidth onClick={startRound}>
                {phase === 'bust' ? (
                  <>
                    <Play className="h-4 w-4" /> Play Again
                  </>
                ) : phase === 'cashed' ? (
                  <>
                    <Zap className="h-4 w-4" /> Next Round
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play Round
                  </>
                )}
              </Button>
            )}
            {phase === 'running' && (
              <Button size="lg" fullWidth variant="danger" disabled onClick={() => {}}>
                <Ban className="h-4 w-4" /> Wait for the round…
              </Button>
            )}
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/35">Recent rounds</p>
            {history.length === 0 ? (
              <p className="mt-2 text-xs text-white/30">
                Rounds you play will show up here.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {history.map((h, i) => (
                  <span
                    key={`${h.mult}-${i}`}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11px] font-black',
                      h.cashed ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
                    )}
                  >
                    ×{formatOdds(h.mult)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
