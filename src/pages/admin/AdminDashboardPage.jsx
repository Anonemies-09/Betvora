import { useEffect, useState } from 'react'
import { Users, ReceiptText, Clock, Coins, Trophy } from 'lucide-react'
import Card from '../../components/common/Card'
import { useAuth } from '../../context/AuthContext'
import { getAllUsers } from '../../services/userService'
import { getAllBets } from '../../services/betService'
import { readAllWallets } from '../../services/walletService'
import { pullStaffData } from '../../services/cloudSync'

const STAT_DEFS = [
  { key: 'users', label: 'Users', icon: Users, color: 'text-gold' },
  { key: 'activeBets', label: 'Active Bets', icon: ReceiptText, color: 'text-success' },
  { key: 'settled', label: 'Settled Bets', icon: Clock, color: 'text-sky-300' },
  { key: 'deposits', label: 'Deposits', icon: Coins, color: 'text-success' },
  { key: 'payouts', label: 'Payouts', icon: Trophy, color: 'text-gold' },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    users: 0,
    activeBets: 0,
    settled: 0,
    deposits: 0,
    payouts: 0,
  })

  useEffect(() => {
    let active = true
    ;(async () => {
      await pullStaffData()
      const [users, bets] = await Promise.all([getAllUsers(), getAllBets()])
      if (!active) return
      const wallets = readAllWallets()
      const deposits = wallets.reduce(
        (total, w) =>
          total +
          (w.transactions || [])
            .filter((t) => t.type === 'deposit')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        0,
      )
      const payouts = wallets.reduce(
        (total, w) =>
          total +
          (w.transactions || [])
            .filter((t) => t.type === 'win')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        0,
      )
      setStats({
        users: users.filter((u) => u.role === 'user').length,
        activeBets: bets.filter((b) => b.status === 'pending').length,
        settled: bets.filter((b) => b.status === 'won' || b.status === 'lost').length,
        deposits,
        payouts,
      })
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">
          Welcome back, {user?.fullName || 'Admin'}. Here is a snapshot of BETVORA.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {STAT_DEFS.map((stat) => (
          <Card key={stat.key} className="p-4">
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <p className="mt-3 text-2xl font-black text-white">
              {stat.key === 'deposits' || stat.key === 'payouts'
                ? `₵${stats[stat.key].toLocaleString()}`
                : stats[stat.key].toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-white/40">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Manage</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Users, matches, odds and settlements live in the modules on the left. Settling a match
            automatically evaluates every pending bet that references it.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Betting engine</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Bet → pending → admin settles → WIN/LOSS settles the wallet, updates My Bets and sends a
            notification. Voided matches refund stakes.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Live mode</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            Balances are real money. Deposits and withdrawals are processed manually via Telecel Cash.
          </p>
        </Card>
      </div>
    </div>
  )
}
