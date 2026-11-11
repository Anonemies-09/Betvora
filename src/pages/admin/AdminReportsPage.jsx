import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import { getAllBets } from '../../services/betService'
import { getAllUsers } from '../../services/userService'
import { getMatches } from '../../services/matchService'
import { readAllWallets } from '../../services/walletService'
import { pullStaffData } from '../../services/cloudSync'
import { getDepositRequests } from '../../services/depositService'
import { getWithdrawalRequests } from '../../services/withdrawalService'
import { formatCurrency } from '../../utils/format'
import { BarChart3, ReceiptText, Users, Wallet } from 'lucide-react'

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [bets, setBets] = useState([])
  const [users, setUsers] = useState([])
  const [matches, setMatches] = useState([])
  const [wallets, setWallets] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      await pullStaffData()
      if (!active) return
      const [betData, userData, matchData, depositData, withdrawalData] = await Promise.all([
        getAllBets(),
        getAllUsers(),
        getMatches(),
        getDepositRequests(),
        getWithdrawalRequests(),
      ])
      if (!active) return
      setBets(betData)
      setUsers(userData)
      setMatches(matchData)
      setWallets(readAllWallets())
      setDeposits(depositData)
      setWithdrawals(withdrawalData)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <p className="py-10 text-center text-sm text-white/40">Loading reports…</p>
  }

  const statusCounts = bets.reduce((acc, bet) => {
    acc[bet.status] = (acc[bet.status] || 0) + 1
    return acc
  }, {})
  const totalStake = bets.reduce((acc, bet) => acc + Number(bet.stake || 0), 0)
  const totalPotential = bets.reduce((acc, bet) => acc + Number(bet.potentialWin || 0), 0)
  const paidOut = bets
    .filter((bet) => bet.status === 'won' || bet.status === 'cashed_out')
    .reduce((acc, bet) => acc + Number(bet.status === 'cashed_out' ? bet.cashOutAmount : bet.potentialWin || 0), 0)
  const totalBalance = wallets.reduce((acc, wallet) => acc + Number(wallet.balance || 0), 0)
  const pendingDeposits = deposits.filter((d) => d.status === 'pending')
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending')

  const leagueCounts = bets.reduce((acc, bet) => {
    for (const selection of bet.selections) {
      const match = matches.find((m) => m.id === selection.matchId)
      const league = match?.leagueId || 'unknown'
      acc[league] = (acc[league] || 0) + 1
    }
    return acc
  }, {})
  const topLeagues = Object.entries(leagueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const cards = [
    { label: 'Total bets', value: bets.length, icon: ReceiptText },
    { label: 'Pending bets', value: statusCounts.pending || 0, icon: ReceiptText },
    { label: 'Won bets', value: statusCounts.won || 0, icon: ReceiptText },
    { label: 'Lost bets', value: statusCounts.lost || 0, icon: ReceiptText },
    { label: 'Total stake', value: formatCurrency(totalStake), icon: Wallet },
    { label: 'Potential payout', value: formatCurrency(totalPotential), icon: Wallet },
    { label: 'Paid out', value: formatCurrency(paidOut), icon: Wallet },
    { label: 'Players', value: users.filter((u) => (u.role || 'user') === 'user').length, icon: Users },
    { label: 'Wallet balance', value: formatCurrency(totalBalance), icon: Wallet },
    { label: 'Pending deposits', value: `${pendingDeposits.length} (${formatCurrency(pendingDeposits.reduce((a, d) => a + Number(d.amount || 0), 0))})`, icon: Wallet },
    { label: 'Pending withdrawals', value: `${pendingWithdrawals.length} (${formatCurrency(pendingWithdrawals.reduce((a, w) => a + Number(w.amount || 0), 0))})`, icon: Wallet },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Reports</h1>
        <p className="mt-1 text-sm text-white/40">Snapshot of betting, money and player activity.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-center gap-2 text-white/40">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
              </div>
              <p className="mt-2 text-xl font-black text-white">{card.value}</p>
            </Card>
          )
        })}
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-white/70">Top leagues by selections</h2>
        <div className="mt-3 space-y-2">
          {topLeagues.length === 0 ? (
            <p className="text-xs text-white/35">No bets yet.</p>
          ) : (
            topLeagues.map(([league, count]) => (
              <div key={league} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{league}</span>
                <span className="font-black text-gold">{count}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-white/70">Recent bets</h2>
        <div className="mt-3 space-y-2">
          {bets.slice(0, 8).map((bet) => (
            <div key={bet.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-white/70">
                {bet.id} • {bet.type} • {bet.selections.length} leg{bet.selections.length === 1 ? '' : 's'}
              </span>
              <span className="shrink-0 font-black text-gold">{formatCurrency(bet.stake)}</span>
            </div>
          ))}
          {bets.length === 0 && <p className="text-xs text-white/35">No bets yet.</p>}
        </div>
      </Card>
    </div>
  )
}
