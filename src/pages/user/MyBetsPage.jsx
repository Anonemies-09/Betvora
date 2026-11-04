import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import AdSlot from '../../components/common/AdSlot'
import { getMyBets } from '../../services/betService'
import { formatCurrency, formatOdds, formatDate, getBetNumber } from '../../utils/format'

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

  useEffect(() => {
    let active = true
    getMyBets().then((data) => {
      if (active) setBets(data)
    })
    return () => {
      active = false
    }
  }, [])

  const filtered =
    tab === 'Open'
      ? bets.filter((b) => b.status === 'pending')
      : tab === 'Settled'
        ? bets.filter((b) => ['won', 'lost', 'cancelled'].includes(b.status))
        : []

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">My Bets</h1>
      <Tabs tabs={['Open', 'Settled', 'Cash Out']} active={tab} onChange={setTab} />
      {tab === 'Cash Out' ? (
        <EmptyState
          title="Cash Out is coming soon"
          text="When it lands, you'll be able to close an open bet early and take whatever value is on the table."
        />
      ) : filtered.length === 0 ? (
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
    </div>
  )
}
