import { useEffect, useState } from 'react'
import { ReceiptText, Ban } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import { getAllBets, cancelBet } from '../../services/betService'
import { formatCurrency, formatOdds, formatDate, getBetNumber } from '../../utils/format'

const STATUS_META = {
  pending: { tone: 'navy', label: 'Pending' },
  won: { tone: 'green', label: 'Won' },
  lost: { tone: 'red', label: 'Lost' },
  cancelled: { tone: 'navy', label: 'Cancelled' },
}

const TABS = ['Pending', 'Won', 'Lost', 'Cancelled']

export default function AdminBetsPage() {
  const [bets, setBets] = useState([])
  const [tab, setTab] = useState('Pending')

  useEffect(() => {
    getAllBets().then(setBets)
  }, [])

  const load = () => getAllBets().then(setBets)

  const handleVoid = async (bet) => {
    if (!window.confirm(`Void bet ${getBetNumber(bet.id)} and refund ${formatCurrency(bet.stake)}?`)) return
    try {
      await cancelBet(bet.id)
      await load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const key = tab.toLowerCase()
  const filtered = tab === 'Pending' ? bets.filter((b) => b.status === 'pending') : bets.filter((b) => b.status === key)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Bets</h1>
        <p className="mt-1 text-sm text-white/40">All bets across every status.</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title={`No ${key} bets`} text="Bets will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((bet) => {
            const meta = STATUS_META[bet.status]
            return (
              <Card key={bet.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-white/60">
                    {getBetNumber(bet.id)} • {bet.type}
                  </span>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-white/30">
                  {formatDate(bet.placedAt, { withYear: true })}
                  {bet.settledAt ? ` • settled ${formatDate(bet.settledAt, { withYear: true })}` : ''}
                </p>
                <div className="mt-3 space-y-1.5 border-y border-white/5 py-3">
                  {bet.selections.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-white/70">
                        <span className="text-xs text-white/35">{s.market}: </span>
                        {s.homeTeam} vs {s.awayTeam} — {s.outcome}
                      </span>
                      <span className="shrink-0 font-black text-gold">{formatOdds(s.odds)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-white/50">
                    Stake <b className="text-white">{formatCurrency(bet.stake)}</b>
                  </span>
                  <span className="text-white/50">
                    Odds <b className="text-gold">{formatOdds(bet.totalOdds)}</b>
                  </span>
                  <span className="text-white/50">
                    Payout{' '}
                    <b className={bet.status === 'won' ? 'text-success' : 'text-white'}>
                      {formatCurrency(bet.potentialWin)}
                    </b>
                  </span>
                </div>
                {bet.status === 'pending' && (
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <Button variant="danger" size="sm" onClick={() => handleVoid(bet)}>
                      <Ban className="h-4 w-4" />
                      Void & Refund
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
