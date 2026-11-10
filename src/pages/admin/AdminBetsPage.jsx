import { useEffect, useState } from 'react'
import { ReceiptText, Ban } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import Dropdown from '../../components/common/Dropdown'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import { getAllBets, cancelBet, placeBet } from '../../services/betService'
import { getAllUsers } from '../../services/userService'
import { getMatches } from '../../services/matchService'
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
  const [modal, setModal] = useState(null)
  const [users, setUsers] = useState([])
  const [matches, setMatches] = useState([])
  const [newBet, setNewBet] = useState({ userId: '', matchId: '', outcome: 'home', stake: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    getAllBets().then(setBets)
    getAllUsers().then(setUsers)
    getMatches().then((data) => setMatches(data.filter((m) => m.status !== 'ended' && m.status !== 'void')))
  }, [])

  const load = () => getAllBets().then(setBets)

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const createBet = async () => {
    const user = users.find((u) => u.id === newBet.userId)
    const match = matches.find((m) => m.id === newBet.matchId)
    if (!user || !match) {
      flash('Select a user and a match.')
      return
    }
    const odds = match.markets?.winner?.[newBet.outcome]
    if (!odds) {
      flash('Invalid outcome.')
      return
    }
    const selection = {
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      market: 'Match Winner',
      outcome: newBet.outcome === 'home' ? match.homeTeam : newBet.outcome === 'away' ? match.awayTeam : 'Draw',
      outcomeKey: newBet.outcome,
      odds: Number(odds),
    }
    try {
      await placeBet({ selections: [selection], stake: Number(newBet.stake), userId: user.id })
      setModal(null)
      setNewBet({ userId: '', matchId: '', outcome: 'home', stake: '' })
      await load()
      flash('Bet created.')
    } catch (err) {
      flash(err.message)
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Bets</h1>
          <p className="mt-1 text-sm text-white/40">All bets across every status.</p>
        </div>
        <Button onClick={() => setModal('new')}>
          + New Bet
        </Button>
      </div>
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </p>
      )}

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

      <Modal
        open={modal === 'new'}
        onClose={() => setModal(null)}
        title="Create Bet"
        subtitle="Place a bet on behalf of a user."
        footer={
          <Button fullWidth onClick={createBet}>
            Create Bet
          </Button>
        }
      >
        <div className="space-y-4">
          <Dropdown
            options={users.map((u) => ({ value: u.id, label: `${u.fullName} (${u.email})` }))}
            value={newBet.userId}
            onChange={(userId) => setNewBet((b) => ({ ...b, userId }))}
          />
          <Dropdown
            options={matches.map((m) => ({ value: m.id, label: `${m.homeTeam} vs ${m.awayTeam}` }))}
            value={newBet.matchId}
            onChange={(matchId) => setNewBet((b) => ({ ...b, matchId }))}
          />
          <Dropdown
            options={[
              { value: 'home', label: 'Home' },
              { value: 'draw', label: 'Draw' },
              { value: 'away', label: 'Away' },
            ]}
            value={newBet.outcome}
            onChange={(outcome) => setNewBet((b) => ({ ...b, outcome }))}
          />
          <Input
            label="Stake"
            type="number"
            min="0"
            value={newBet.stake}
            onChange={(e) => setNewBet((b) => ({ ...b, stake: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
