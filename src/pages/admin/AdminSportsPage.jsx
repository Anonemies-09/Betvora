import { useEffect, useState } from 'react'
import {
  Plus,
  Play,
  Flag,
  Ban,
  Pencil,
  Trash2,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Dropdown from '../../components/common/Dropdown'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import {
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  startMatch,
  endMatch,
  voidMatch,
} from '../../services/matchService'
import { settleBetsForMatch } from '../../services/betService'
import { isAutoFeedEnabled, setAutoFeedEnabled, autoScheduleFixtures } from '../../services/fixtureService'
import { LEAGUES } from '../../data/catalogue'
import { formatDate, formatTime, formatOdds, flagEmoji } from '../../utils/format'
import { cn } from '../../utils/cn'

function StatusBadge({ match }) {
  if (match.status === 'live')
    return <Badge tone="red" dot>Live {match.minute}&apos;</Badge>
  if (match.status === 'ended')
    return <Badge tone="green">Ended</Badge>
  if (match.status === 'void')
    return <Badge tone="navy">Void</Badge>
  return <Badge tone="blue">Upcoming</Badge>
}

export default function AdminSportsPage() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')

  const [score, setScore] = useState({ home: '', away: '' })
  const [odds, setOdds] = useState({ home: '', draw: '', away: '' })
  const [newMatch, setNewMatch] = useState({ homeTeam: '', awayTeam: '', leagueId: 'epl' })
  const [autoFeed, setAutoFeed] = useState(isAutoFeedEnabled)
  const [generating, setGenerating] = useState(false)

  const load = () =>
    getMatches().then((data) => {
      setMatches(data)
      setLoading(false)
    })

  useEffect(() => {
    load()
  }, [])

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3500)
  }

  const openOdds = (match) => {
    const w = match.markets.winner
    setSelected(match)
    setOdds({ home: String(w.home), draw: String(w.draw ?? ''), away: String(w.away) })
    setModal('odds')
  }

  const openSettle = (match) => {
    setSelected(match)
    setScore({ home: match.score?.home ?? '', away: match.score?.away ?? '' })
    setModal('settle')
  }

  const saveOdds = async () => {
    const w = {
      home: Number(odds.home),
      draw: Number(odds.draw),
      away: Number(odds.away),
    }
    if (!w.home || !w.draw || !w.away) {
      flash('All three odds are required.')
      return
    }
    await updateMatch(selected.id, {
      markets: { ...selected.markets, winner: w },
    })
    setModal(null)
    await load()
    flash('Odds updated.')
  }

  const settle = async () => {
    const home = Number(score.home)
    const away = Number(score.away)
    if (home < 0 || away < 0 || score.home === '' || score.away === '') {
      flash('Enter a valid final score.')
      return
    }
    await endMatch(selected.id, { home, away })
    const settled = await settleBetsForMatch(selected.id)
    setModal(null)
    await load()
    flash(settled ? 'Match settled — pending bets were evaluated.' : 'Match settled — no pending bets to evaluate.')
  }

  const makeVoid = async (match) => {
    if (!window.confirm(`Void ${match.homeTeam} vs ${match.awayTeam}? Pending bets on it are refunded.`)) return
    await voidMatch(match.id)
    await settleBetsForMatch(match.id)
    await load()
    flash('Match voided — stakes refunded.')
  }

  const create = async () => {
    if (!newMatch.homeTeam.trim() || !newMatch.awayTeam.trim()) {
      flash('Both team names are required.')
      return
    }
    await createMatch(newMatch)
    setModal(null)
    setNewMatch({ homeTeam: '', awayTeam: '', leagueId: 'epl' })
    await load()
    flash('Match created.')
  }

  const remove = async (match) => {
    if (!window.confirm(`Delete ${match.homeTeam} vs ${match.awayTeam}?`)) return
    await deleteMatch(match.id)
    await load()
  }

  const leagueOptions = LEAGUES.map((l) => ({ value: l.id, label: `${flagEmoji(l.flag)} ${l.name}` }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Sports & Matches
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Manage fixtures, odds and settlements. Settling a match evaluates pending bets.
          </p>
        </div>
        <Button onClick={() => setModal('new')}>
          <Plus className="h-4 w-4" />
          New Match
        </Button>
      </div>

      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </p>
      )}

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue/20">
            <Zap className="h-5 w-5 text-blue" />
          </span>
          <div>
            <p className="text-sm font-black text-white">Live fixture feed</p>
            <p className="text-xs text-white/40">
              Auto-detects tomorrow&apos;s card across top leagues, or generate it on demand.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            role="switch"
            aria-checked={autoFeed}
            onClick={() => {
              const next = !autoFeed
              setAutoFeed(next)
              setAutoFeedEnabled(next)
            }}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              autoFeed ? 'bg-success' : 'bg-white/10',
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                autoFeed ? 'left-6' : 'left-1',
              )}
            />
          </button>
          <Button
            size="sm"
            variant="secondary"
            loading={generating}
            onClick={async () => {
              setGenerating(true)
              const count = await autoScheduleFixtures(1)
              setAutoFeed(true)
              setAutoFeedEnabled(true)
              setGenerating(false)
              await load()
              flash(`Feed refreshed — ${count} fixtures added for tomorrow.`)
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            Generate Tomorrow&apos;s Fixtures
          </Button>
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-white/40">Loading fixtures…</p>
      ) : matches.length === 0 ? (
        <EmptyState title="No fixtures" text="Create a match to get started." />
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const league = LEAGUES.find((l) => l.id === match.leagueId)
            const w = match.markets.winner
            return (
              <Card key={match.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
                    {flagEmoji(league?.flag)} {league?.name}
                  </span>
                  <span className="ml-auto">
                    <StatusBadge match={match} />
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-white">{match.homeTeam}</p>
                    <p className="text-xs text-white/40">vs</p>
                    <p className="truncate text-base font-black text-white">{match.awayTeam}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {match.status === 'live' && match.score && (
                      <span className="rounded-lg bg-success/15 px-3 py-1.5 text-lg font-black text-success">
                        {match.score.home} - {match.score.away}
                      </span>
                    )}
                    {match.status === 'ended' && (
                      <span className="rounded-lg bg-gold/10 px-3 py-1.5 text-lg font-black text-gold">
                        {match.score.home} - {match.score.away}
                      </span>
                    )}
                    <p className="mt-1 text-[11px] text-white/30">
                      {formatDate(match.startTime, { withYear: true })} • {formatTime(match.startTime)}
                    </p>
                  </div>
                </div>

                <div className={`mt-3 grid gap-1.5 ${'draw' in w ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="rounded-lg bg-navy-800 px-2 py-1.5 text-center">
                    <p className="text-[10px] uppercase text-white/35">Home</p>
                    <p className="text-sm font-black text-gold">{formatOdds(w.home)}</p>
                  </div>
                  {'draw' in w && (
                    <div className="rounded-lg bg-navy-800 px-2 py-1.5 text-center">
                      <p className="text-[10px] uppercase text-white/35">Draw</p>
                      <p className="text-sm font-black text-gold">{formatOdds(w.draw)}</p>
                    </div>
                  )}
                  <div className="rounded-lg bg-navy-800 px-2 py-1.5 text-center">
                    <p className="text-[10px] uppercase text-white/35">Away</p>
                    <p className="text-sm font-black text-gold">{formatOdds(w.away)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {match.status !== 'ended' && match.status !== 'void' && (
                    <>
                      <Button
                        size="sm"
                        variant={match.isLive ? 'secondary' : 'success'}
                        onClick={() => {
                          if (match.isLive) openSettle(match)
                          else startMatch(match.id).then(load)
                        }}
                      >
                        <Play className="h-3.5 w-3.5" />
                        {match.isLive ? 'End & Settle' : 'Set Live'}
                      </Button>
                      {match.isLive && (
                        <Button size="sm" variant="danger" onClick={() => makeVoid(match)}>
                          <Ban className="h-3.5 w-3.5" />
                          Void
                        </Button>
                      )}
                    </>
                  )}
                  {match.status === 'upcoming' && (
                    <Button size="sm" variant="secondary" onClick={() => openSettle(match)}>
                      <Flag className="h-3.5 w-3.5" />
                      Quick Result
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => openOdds(match)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Odds
                  </Button>
                  <button
                    onClick={() => remove(match)}
                    aria-label="Delete match"
                    className="rounded-lg px-2.5 text-white/30 transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modal === 'odds'}
        onClose={() => setModal(null)}
        title="Edit 1X2 Odds"
        subtitle={selected ? `${selected.homeTeam} vs ${selected.awayTeam}` : ''}
        footer={
          <>
            <Button fullWidth onClick={saveOdds}>
              Save Odds
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-3">
          <Input label="Home" type="number" step="0.01" value={odds.home} onChange={(e) => setOdds((o) => ({ ...o, home: e.target.value }))} />
          <Input label="Draw" type="number" step="0.01" value={odds.draw} onChange={(e) => setOdds((o) => ({ ...o, draw: e.target.value }))} />
          <Input label="Away" type="number" step="0.01" value={odds.away} onChange={(e) => setOdds((o) => ({ ...o, away: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        open={modal === 'settle'}
        onClose={() => setModal(null)}
        title="Settle Match"
        subtitle={selected ? `${selected.homeTeam} vs ${selected.awayTeam} — enter the final score.` : ''}
        footer={
          <Button fullWidth variant="success" onClick={settle}>
            <CheckCircle2 className="h-4 w-4" />
            Settle & Evaluate Bets
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={selected?.homeTeam}
            type="number"
            min="0"
            value={score.home}
            onChange={(e) => setScore((s) => ({ ...s, home: e.target.value }))}
          />
          <Input
            label={selected?.awayTeam}
            type="number"
            min="0"
            value={score.away}
            onChange={(e) => setScore((s) => ({ ...s, away: e.target.value }))}
          />
        </div>
        <p className="mt-3 text-xs text-white/40">
          All pending bets referencing this match are settled automatically.
        </p>
      </Modal>

      <Modal
        open={modal === 'new'}
        onClose={() => setModal(null)}
        title="New Match"
        subtitle="Add a fixture to the catalogue."
        footer={
          <Button fullWidth onClick={create}>
            <Plus className="h-4 w-4" />
            Create Match
          </Button>
        }
      >
        <div className="space-y-4">
          <Dropdown
            options={leagueOptions}
            value={newMatch.leagueId}
            onChange={(leagueId) => setNewMatch((m) => ({ ...m, leagueId }))}
          />
          <Input
            label="Home Team"
            placeholder="Manchester City"
            value={newMatch.homeTeam}
            onChange={(e) => setNewMatch((m) => ({ ...m, homeTeam: e.target.value }))}
          />
          <Input
            label="Away Team"
            placeholder="Arsenal"
            value={newMatch.awayTeam}
            onChange={(e) => setNewMatch((m) => ({ ...m, awayTeam: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
