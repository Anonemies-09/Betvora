import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, History, Plane, ShieldCheck, Volume2, VolumeX, Wallet } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import AviatorPlane from '../../components/games/AviatorPlane'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import * as walletService from '../../services/walletService'
import { isMuted, play as playSound, setMuted, unlock as unlockAudio } from '../../services/aviatorAudio'
import { formatCurrency, formatOdds } from '../../utils/format'
import {
  crashPointFromSeed,
  flightPoint,
  multiplierAt,
  randomSeed,
  readAviatorHistory,
  readAviatorSettings,
  saveAviatorRound,
  saveAviatorSettings,
} from '../../utils/aviator'
import { cn } from '../../utils/cn'

const WAIT_SECONDS = 6
const NEXT_ROUND_DELAY = 4000
const MIN_STAKE = 10
const MAX_STAKE = 100000
const PRESETS = [50, 100, 200, 500]
const START_POINT = { x: 14, y: 86 }

function crashTone(value) {
  if (value >= 10) return 'bg-gold text-navy-800'
  if (value >= 2) return 'bg-royal-400 text-white'
  return 'bg-blue/60 text-white'
}

function FlightCanvas({ phase, mult, crashAt, trail }) {
  const last = trail[trail.length - 1] || START_POINT
  const prev = trail[trail.length - 2] || START_POINT
  const angle = (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI
  // Keep the airliner's pitch natural: aircraft climb at a gentler angle than
  // the graph line, so damp the path angle and clamp it.
  const pitch = Math.max(-30, Math.min(10, angle * 0.5))
  const points = trail.map((p) => `${p.x},${p.y}`).join(' ')
  const crashed = phase === 'crashed'
  const waiting = phase === 'waiting'

  return (
    <div
      className={cn(
        'relative aspect-[16/11] w-full overflow-hidden rounded-2xl border border-royal-400/30 bg-gradient-to-b from-navy-800 via-navy to-black/60 sm:aspect-[16/8]',
        crashed && 'animate-crash-shake',
      )}
    >
      <div className="banner-grid absolute inset-0 opacity-40" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {[20, 40, 60, 80].map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.2"
          />
        ))}
        {[20, 40, 60, 80].map((x) => (
          <line
            key={x}
            x1={x}
            x2={x}
            y1="0"
            y2="100"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.2"
          />
        ))}
        {trail.length > 1 && (
          <>
            <polygon
              points={`${points} ${last.x},100 6,100`}
              fill="url(#aviatorArea)"
              opacity="0.35"
            />
            <polyline
              points={points}
              fill="none"
              stroke={crashed ? 'var(--color-danger)' : 'var(--color-gold)'}
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        <defs>
          <linearGradient id="aviatorArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {!waiting && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `${last.x}%`,
            top: `${last.y}%`,
            transform: `translate(-50%, -50%) rotate(${pitch}deg)`,
          }}
        >
          <AviatorPlane
            className={cn(
              'h-10 w-20 drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] transition-opacity sm:h-12 sm:w-24',
              crashed && 'opacity-50 saturate-50',
            )}
          />
        </div>
      )}

      {crashed && <div className="pointer-events-none absolute inset-0 z-10 bg-danger/10" />}

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-1.5">
          {trail.length > 1 && !waiting && (
            <span
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-black tabular-nums',
                crashTone(mult),
              )}
            >
              ×{formatOdds(mult)}
            </span>
          )}
        </div>
        {phase === 'flying' && (
          <Badge tone="red" dot>
            In flight
          </Badge>
        )}
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center">
        {waiting ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
              Next round in
            </p>
            <p className="mt-1 text-5xl font-black text-white sm:text-6xl">{Math.max(0, mult)}</p>
            <p className="mt-1 text-xs text-white/40">Place your bet now</p>
          </>
        ) : crashed ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-danger/80">
              Flew away at
            </p>
            <p className="mt-1 text-6xl font-black italic tracking-tight text-danger sm:text-7xl">
              ×{formatOdds(crashAt ?? mult)}
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
              Current multiplier
            </p>
            <p
              className={cn(
                'mt-1 text-6xl font-black italic tracking-tight tabular-nums sm:text-8xl',
                mult < 2 ? 'text-white' : mult < 10 ? 'text-gold' : 'text-success',
              )}
            >
              ×{formatOdds(mult)}
            </p>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
        <span>Aviator</span>
        <span>Cash out before the plane leaves</span>
      </div>
    </div>
  )
}

export default function AviatorPage() {
  const { user } = useAuth()
  const { balance, currency, refresh } = useWallet()
  const [initialSettings] = useState(() => readAviatorSettings(user?.id))

  const [phase, setPhase] = useState('waiting')
  const [countdown, setCountdown] = useState(WAIT_SECONDS)
  const [mult, setMult] = useState(WAIT_SECONDS)
  const [trail, setTrail] = useState([START_POINT])
  const [soundOn, setSoundOn] = useState(() => !isMuted())
  const [stake, setStake] = useState(initialSettings.stake || 100)
  const [autoCashout, setAutoCashout] = useState(initialSettings.auto || '')
  const [betQueued, setBetQueued] = useState(false)
  const [roundStake, setRoundStake] = useState(0)
  const [cashedAt, setCashedAt] = useState(null)
  const [crashAt, setCrashAt] = useState(null)
  const [seed, setSeed] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState(() => readAviatorHistory(user?.id))
  const [lastFinished, setLastFinished] = useState(null)
  const [lastRound, setLastRound] = useState(null)

  const roundRef = useRef(null)
  const tickRef = useRef(null)
  const nextRef = useRef(null)
  const multRef = useRef(1)

  const cashOutRef = useRef(() => {})

  useEffect(() => {
    saveAviatorSettings(user?.id, { stake, auto: autoCashout })
  }, [stake, autoCashout, user?.id])

  // Browsers only allow audio after a gesture; unlock on the first one.
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Countdown blips during the last three seconds.
  useEffect(() => {
    if (phase === 'waiting' && countdown > 0 && countdown <= 3) playSound('tick')
  }, [phase, countdown])

  useEffect(
    () => () => {
      clearInterval(tickRef.current)
      clearTimeout(nextRef.current)
    },
    [],
  )

  // Round start countdown.
  useEffect(() => {
    if (phase !== 'waiting') return undefined
    if (countdown <= 0) {
      beginRound()
      return undefined
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, countdown])

  // Space bar cashes out during a round.
  useEffect(() => {
    const onKey = (event) => {
      if (event.code !== 'Space') return
      if (phase !== 'flying' || !roundRef.current || roundRef.current.cashed) return
      event.preventDefault()
      cashOutRef.current(multRef.current)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  function startWaiting() {
    clearInterval(tickRef.current)
    clearTimeout(nextRef.current)
    roundRef.current = null
    setPhase('waiting')
    setCountdown(WAIT_SECONDS)
    setMult(WAIT_SECONDS)
    setCrashAt(null)
    setCashedAt(null)
    setRoundStake(0)
    setTrail([START_POINT])
    multRef.current = 1
  }

  function beginRound() {
    if (roundRef.current && !roundRef.current.ended) return
    const roundSeed = randomSeed()
    const roundCrash = crashPointFromSeed(roundSeed)
    const target = Number(autoCashout)
    const auto = Number.isFinite(target) && target >= 1.01 ? target : null
    const activeStake = betQueued ? stake : 0

    setError('')
    setSeed(roundSeed)
    setCrashAt(null)
    setMult(1)
    setTrail([START_POINT])
    setCashedAt(null)
    setRoundStake(activeStake)
    setBetQueued(false)
    setPhase('flying')
    playSound('takeoff')

    roundRef.current = {
      seed: roundSeed,
      crashAt: roundCrash,
      stake: activeStake,
      auto,
      cashed: false,
      cashedAt: null,
      ended: false,
      funded: activeStake === 0,
      startedAt: performance.now(),
    }
    multRef.current = 1

    if (activeStake > 0) {
      const round = roundRef.current
      walletService
        .deductForBet(activeStake, 'Aviator round stake', user?.id)
        .then(() => {
          round.funded = true
          refresh()
        })
        .catch(() => {
          round.stake = 0
          round.funded = false
          if (roundRef.current === round) {
            setRoundStake(0)
            setError('Could not start the round with that stake. Check your balance.')
          }
        })
    }

    clearInterval(tickRef.current)
    tickRef.current = setInterval(tick, 60)
  }

  function tick() {
    const round = roundRef.current
    if (!round || round.ended) return
    const elapsed = performance.now() - round.startedAt
    const live = multiplierAt(elapsed)
    const shown = Math.min(live, round.crashAt)
    multRef.current = shown
    setMult(shown)
    setTrail((points) => {
      const next = flightPoint(shown, elapsed)
      const last = points[points.length - 1]
      if (last && Math.abs(last.x - next.x) < 0.5 && Math.abs(last.y - next.y) < 0.5) return points
      return [...points, next].slice(-320)
    })

    if (
      !round.cashed &&
      round.auto &&
      round.auto <= round.crashAt &&
      shown >= round.auto
    ) {
      cashOut(round.auto)
    }

    if (live >= round.crashAt) endRound(round.crashAt)
  }

  async function cashOut(multiplier) {
    const round = roundRef.current
    if (!round || round.cashed || round.stake <= 0 || round.ended || !round.funded) return
    const value = Math.max(1, Math.min(multiplier, round.crashAt))
    round.cashed = true
    round.cashedAt = value
    const payout = Math.round(round.stake * value * 100) / 100
    setCashedAt(value)
    setLastRound({ won: true, multiplier: value, payout, stake: round.stake })
    playSound('cashout')
    try {
      await walletService.creditWinnings(
        payout,
        `Aviator cash out at ${value.toFixed(2)}x`,
        user?.id,
      )
      await refresh()
    } catch {
      setError('Payout could not be credited automatically. Contact support.')
    }
  }
  cashOutRef.current = cashOut

  function endRound(crash) {
    const round = roundRef.current
    if (!round || round.ended) return
    round.ended = true
    clearInterval(tickRef.current)
    setPhase('crashed')
    setMult(crash)
    setCrashAt(crash)
    setRoundStake(0)
    playSound('crash')

    const entry = {
      id: `av${Date.now()}`,
      seed: round.seed,
      crash,
      stake: round.stake,
      cashedAt: round.cashed ? round.cashedAt : null,
      profit: round.cashed
        ? Math.round((round.stake * round.cashedAt - round.stake) * 100) / 100
        : -round.stake,
      at: new Date().toISOString(),
    }
    setLastFinished({ seed: round.seed, crash })
    if (round.stake > 0) {
      setHistory(saveAviatorRound(user?.id, entry))
      setLastRound(entry)
    }
    nextRef.current = setTimeout(startWaiting, NEXT_ROUND_DELAY)
  }

  function placeBet() {
    setError('')
    if (betQueued) {
      setBetQueued(false)
      return
    }
    const value = Number(stake)
    if (!Number.isFinite(value) || value < MIN_STAKE) {
      setError(`Minimum stake is ${formatCurrency(MIN_STAKE, currency)}.`)
      return
    }
    if (value > MAX_STAKE) {
      setError(`Maximum stake is ${formatCurrency(MAX_STAKE, currency)}.`)
      return
    }
    if (value > balance) {
      setError('Insufficient balance. Make a deposit to keep playing.')
      return
    }
    setBetQueued(true)
    unlockAudio()
    playSound('bet')
  }

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    setMuted(!next)
    if (next) {
      unlockAudio()
      playSound('bet')
    }
  }

  const cashedOut = cashedAt !== null
  const inRound = roundStake > 0
  const canCashOut = phase === 'flying' && inRound && !cashedOut
  const queuedForNext = betQueued && (phase === 'flying' || phase === 'crashed')
  const potential = Math.round(Number(stake) * mult * 100) / 100
  const recentCrashes = history.slice(0, 12)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/crash"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Crash lobby
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl">
            <Plane className="h-7 w-7 text-gold" fill="currentColor" strokeWidth={1} /> Aviator
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/45">
            Rounds take off every few seconds. Cash out before the plane flies away — every payout
            is settled on your real wallet balance.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute game sounds' : 'Unmute game sounds'}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors',
              soundOn
                ? 'border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
                : 'border-white/10 bg-white/5 text-white/40 hover:text-white/70',
            )}
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{soundOn ? 'Sound on' : 'Sound off'}</span>
          </button>
          {recentCrashes.length === 0 && (
            <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-white/35">
              No rounds played yet
            </span>
          )}
          {recentCrashes.map((round) => (
            <span
              key={round.id}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-black tabular-nums',
                crashTone(round.crash),
              )}
              title={`Seed ${round.seed}`}
            >
              ×{formatOdds(round.crash)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden p-3 sm:p-4">
            <FlightCanvas
              phase={phase}
              mult={phase === 'waiting' ? countdown : mult}
              crashAt={crashAt}
              trail={trail}
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-gold" />
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                Your recent rounds
              </p>
            </div>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-white/35">
                Your Aviator rounds will appear here once you place your first bet.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-white/5">
                {history.slice(0, 6).map((round) => (
                  <div
                    key={round.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums',
                          crashTone(round.crash),
                        )}
                      >
                        ×{formatOdds(round.crash)}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(round.at).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white/40">
                        Stake {formatCurrency(round.stake, currency)}
                      </span>
                      <span className="text-white/50">
                        {round.cashedAt ? `Out ×${formatOdds(round.cashedAt)}` : 'No cash out'}
                      </span>
                      <span
                        className={cn(
                          'font-black tabular-nums',
                          round.profit > 0 ? 'text-success' : round.profit < 0 ? 'text-danger' : 'text-white/50',
                        )}
                      >
                        {round.profit > 0 ? '+' : ''}
                        {formatCurrency(round.profit, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                Bet slip
              </p>
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 text-xs font-bold text-gold transition-colors hover:text-gold-600"
              >
                <Wallet className="h-3.5 w-3.5" />
                {formatCurrency(balance, currency)}
              </Link>
            </div>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-white/35">
              Stake
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={MIN_STAKE}
                  max={MAX_STAKE}
                  step="10"
                  value={stake}
                  onChange={(event) => setStake(event.target.value)}
                  disabled={inRound}
                  aria-label="Stake amount"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStake((value) => Math.max(MIN_STAKE, Math.round(Number(value) * 2) || MIN_STAKE))}
                disabled={inRound}
              >
                ×2
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStake((value) => Math.max(MIN_STAKE, Math.round(Number(value) / 2) || MIN_STAKE))}
                disabled={inRound}
              >
                ½
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {PRESETS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStake(value)}
                  disabled={inRound}
                  className={cn(
                    'rounded-xl border py-2 text-xs font-black transition-colors disabled:opacity-40',
                    Number(stake) === value
                      ? 'border-gold bg-gold text-navy-800'
                      : 'border-royal-400/40 bg-navy-800 text-white/60 hover:border-gold/50',
                  )}
                >
                  {formatCurrency(value, currency)}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-white/35">
              Auto cash out at
            </label>
            <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
              <Input
                type="number"
                min="1.01"
                step="0.1"
                placeholder="Optional, e.g. 2.00"
                value={autoCashout}
                onChange={(event) => setAutoCashout(event.target.value)}
              />
              <div className="flex gap-1.5">
                {[1.5, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAutoCashout(String(value))}
                    className={cn(
                      'rounded-lg border px-2 text-xs font-black transition-colors',
                      Number(autoCashout) === value
                        ? 'border-gold bg-gold text-navy-800'
                        : 'border-royal-400/40 bg-navy-800 text-white/60 hover:border-gold/50',
                    )}
                  >
                    {value.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {canCashOut ? (
                <Button
                  size="lg"
                  fullWidth
                  variant="success"
                  onClick={() => cashOut(multRef.current)}
                >
                  Cash out {formatCurrency(roundStake * mult, currency)} at ×{formatOdds(mult)}
                </Button>
              ) : (
                <Button
                  size="lg"
                  fullWidth
                  variant={betQueued ? 'secondary' : 'primary'}
                  onClick={placeBet}
                  disabled={canCashOut}
                >
                  {betQueued
                    ? `Cancel bet ${formatCurrency(stake, currency)}`
                    : phase === 'flying'
                      ? 'Bet next round'
                      : `Place bet ${formatCurrency(stake, currency)}`}
                </Button>
              )}

              {canCashOut && (
                <p className="text-center text-[11px] font-semibold text-white/30">
                  Press space to cash out
                </p>
              )}
              {queuedForNext && (
                <p className="text-center text-[11px] font-semibold text-gold">
                  Bet queued for the next round
                </p>
              )}
              {phase === 'crashed' && !queuedForNext && (
                <p className="text-center text-[11px] font-semibold text-white/30">
                  Next round starts in a few seconds
                </p>
              )}
            </div>

            {inRound && !cashedOut && (
              <div className="mt-3 rounded-xl border border-royal-400/30 bg-navy-800/60 px-3.5 py-2.5 text-xs text-white/50">
                In play: {formatCurrency(roundStake, currency)} · current value{' '}
                <span className="font-black text-white">
                  {formatCurrency(potential, currency)}
                </span>
              </div>
            )}
            {inRound && cashedOut && (
              <div className="mt-3 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-xs text-success">
                Cashed out at ×{formatOdds(cashedAt)} ·{' '}
                {formatCurrency(roundStake * cashedAt, currency)} credited. The round continues
                without you.
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                Provably fair
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Each round is generated from a fresh random seed. The crash point is derived from
              that seed with a public formula, so any finished round can be checked afterwards.
            </p>
            <div className="mt-3 rounded-xl border border-white/5 bg-navy-800 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Last round seed
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="truncate text-xs text-gold">
                  {lastFinished?.seed || seed || 'Waiting for first round…'}
                </code>
                <button
                  type="button"
                  aria-label="Copy seed"
                  disabled={!lastFinished?.seed}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(lastFinished.seed)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    } catch {
                      setError('Copy is not available on this device.')
                    }
                  }}
                  className="rounded-lg p-1.5 text-white/40 transition-colors hover:text-gold disabled:opacity-30"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {lastFinished && (
                <p className="mt-1 text-[11px] text-white/35">
                  Crashed at ×{formatOdds(lastFinished.crash)} ·{' '}
                  {copied ? 'Copied' : 'Tap copy to save it'}
                </p>
              )}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-white/30">
              Multiplier at time t: e^(0.14 · t). Crash point: derived from the first 13 hex digits
              of the seed; 1 in 33 seeds bust instantly. Play responsibly — only stake what you can
              afford to lose.
            </p>
          </Card>

          {lastRound?.won && (
            <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              Cashed out at ×{formatOdds(lastRound.multiplier)} for{' '}
              {formatCurrency(lastRound.payout, currency)}.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
