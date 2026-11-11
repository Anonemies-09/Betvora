import { useEffect, useMemo, useState } from 'react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import AdSlot from '../../components/common/AdSlot'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { getMyBets } from '../../services/betService'
import { formatCurrency, formatOdds, formatDate, getBetNumber } from '../../utils/format'
import { Download, Search } from 'lucide-react'

const STATUS_STYLES = {
  pending: { tone: 'navy', dot: true, label: 'Pending' },
  won: { tone: 'green', dot: true, label: 'Won' },
  lost: { tone: 'red', dot: true, label: 'Lost' },
  cancelled: { tone: 'navy', dot: true, label: 'Cancelled' },
}

function BetCard({ bet }) {
  const status = STATUS_STYLES[bet.status]
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-white/60">
          {getBetNumber(bet.id)} • {bet.type}
        </span>
        <Badge tone={status.tone} dot>{status.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-white/30">{formatDate(bet.placedAt, { withYear: true })}</p>

      <div className="mt-3 space-y-2.5 border-y border-white/5 py-3">
        {bet.selections.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">
                {s.market}
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {s.homeTeam} vs {s.awayTeam}
              </p>
              <p className="text-xs text-white/50">{s.outcome}</p>
            </div>
            <span className="shrink-0 rounded-md bg-gold/10 px-2 py-1 text-sm font-black text-gold">
              {formatOdds(s.odds)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-white/40">Stake</p>
          <p className="font-bold text-white">{formatCurrency(bet.stake)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40">Total Odds</p>
          <p className="font-black text-gold">{formatOdds(bet.totalOdds)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">Potential</p>
          <p className="font-bold text-white">{formatCurrency(bet.potentialWin)}</p>
        </div>
      </div>
    </Card>
  )
}

export default function MyBetsPage() {
  const [bets, setBets] = useState([])
  const [tab, setTab] = useState('Open')
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    let active = true
    getMyBets().then((data) => {
      if (active) setBets(data)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const base =
      tab === 'Open'
        ? bets.filter((b) => b.status === 'pending')
        : tab === 'Settled'
          ? bets.filter((b) => ['won', 'lost', 'cancelled', 'cashed_out'].includes(b.status))
          : []
    const fromTime = fromDate ? new Date(fromDate).getTime() : 0
    const toTime = toDate ? new Date(toDate).getTime() + 86400000 : Infinity
    return base.filter((bet) => {
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const haystack = [
          getBetNumber(bet.id),
          bet.type,
          bet.status,
          ...bet.selections.map((s) => `${s.homeTeam} ${s.awayTeam} ${s.outcome} ${s.market}`),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      const placed = new Date(bet.placedAt).getTime()
      if (placed < fromTime || placed > toTime) return false
      return true
    })
  }, [bets, tab, query, fromDate, toDate])

  const exportCsv = () => {
    const rows = [
      ['Bet number', 'Type', 'Status', 'Placed at', 'Selections', 'Stake', 'Odds', 'Potential win'],
      ...filtered.map((bet) => [
        getBetNumber(bet.id),
        bet.type,
        bet.status,
        bet.placedAt,
        bet.selections.map((s) => `${s.homeTeam} vs ${s.awayTeam} - ${s.outcome} @ ${s.odds}`).join(' | '),
        bet.stake,
        bet.totalOdds,
        bet.potentialWin,
      ]),
    ]
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `betvora-bets-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">My Bets</h1>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Tabs tabs={['Open', 'Settled', 'Cash Out']} active={tab} onChange={setTab} />
      {tab === 'Cash Out' ? (
        <EmptyState
          title="Cash Out is coming soon"
          text="When it lands, you'll be able to close an open bet early and take whatever value is on the table."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search bets, teams, markets…"
                aria-label="Search bets"
                className="w-full rounded-xl border border-white/10 bg-navy-800 px-4 py-3 pl-10 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold"
              />
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              aria-label="From date"
              className="rounded-xl border border-white/10 bg-navy-800 px-3 py-3 text-sm text-white outline-none focus:border-gold"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              aria-label="To date"
              className="rounded-xl border border-white/10 bg-navy-800 px-3 py-3 text-sm text-white outline-none focus:border-gold"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={`No ${tab.toLowerCase()} bets`}
              text={
                tab === 'Open'
                  ? 'Bets you place show up here while they wait to settle.'
                  : 'Settled bets — won, lost or cancelled — will appear here.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
              <AdSlot slot="mybets_bottom" className="mx-auto w-full max-w-2xl" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
