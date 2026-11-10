import { useState, useEffect } from 'react'
import { Landmark, TrendingDown, TrendingUp, Trophy, Check, X } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import EmptyState from '../../components/common/EmptyState'
import { useWallet } from '../../context/WalletContext'
import { formatCurrency, formatDate } from '../../utils/format'
import {
  getDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
} from '../../services/depositService'
import { cn } from '../../utils/cn'

const TYPE_META = {
  deposit: { label: 'Deposit', className: 'text-success', Icon: TrendingDown },
  withdraw: { label: 'Withdraw', className: 'text-white/70', Icon: TrendingUp },
  bet: { label: 'Bet', className: 'text-gold', Icon: TrendingUp },
  win: { label: 'Winnings', className: 'text-success', Icon: Trophy },
  refund: { label: 'Refund', className: 'text-sky-300', Icon: Trophy },
}

export default function AdminWalletPage() {
  const { balance, currency, transactions, refresh } = useWallet()
  const [filter, setFilter] = useState('all')
  const [requests, setRequests] = useState([])
  const [working, setWorking] = useState(null)

  const loadRequests = () => setRequests(getDepositRequests())
  useEffect(() => {
    loadRequests()
  }, [])

  const handleApprove = async (id) => {
    setWorking(id)
    try {
      await approveDepositRequest(id)
      await refresh()
      loadRequests()
    } finally {
      setWorking(null)
    }
  }

  const handleReject = async (id) => {
    setWorking(id)
    try {
      await rejectDepositRequest(id, 'Not verified')
      loadRequests()
    } finally {
      setWorking(null)
    }
  }

  const types = ['all', ...new Set(transactions.map((t) => t.type))]
  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)
  const totalIn = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          Wallet & Transactions
        </h1>
        <p className="mt-1 text-sm text-white/40">Demo ledger for the active account.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <Landmark className="h-5 w-5 text-gold" />
          <p className="mt-3 text-2xl font-black text-white">{formatCurrency(balance, currency)}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-white/40">Current balance</p>
        </Card>
        <Card className="p-4">
          <TrendingDown className="h-5 w-5 text-success" />
          <p className="mt-3 text-2xl font-black text-success">{formatCurrency(totalIn, currency)}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-white/40">Money in</p>
        </Card>
        <Card className="p-4">
          <TrendingUp className="h-5 w-5 text-gold" />
          <p className="mt-3 text-2xl font-black text-gold">{formatCurrency(totalOut, currency)}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-white/40">Money out</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Pending Telecel Cash deposits</h2>
        {requests.filter((r) => r.status === 'pending').length === 0 ? (
          <p className="mt-2 text-xs text-white/40">No pending deposit requests.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {requests
              .filter((r) => r.status === 'pending')
              .map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-navy-800 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{formatCurrency(r.amount, currency)}</p>
                    <p className="text-[11px] text-white/40">
                      From {r.senderPhone} �?� Ref {r.txRef}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="primary" loading={working === r.id} onClick={() => handleApprove(r.id)}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="secondary" loading={working === r.id} onClick={() => handleReject(r.id)}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors',
                filter === type ? 'bg-gold text-white' : 'bg-navy-800 text-white/50 hover:text-white',
              )}
            >
              {type}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No transactions" text="Nothing in this ledger yet." />
      ) : (
        <Card className="divide-y divide-white/5">
          {filtered.map((tx) => {
            const meta = TYPE_META[tx.type] || { label: tx.type, className: 'text-white/70', Icon: TrendingUp }
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                <meta.Icon className={cn('h-4.5 w-4.5', meta.className)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{meta.label}</p>
                  <p className="truncate text-xs text-white/40">{tx.note}</p>
                  <p className="text-[11px] text-white/25">{formatDate(tx.createdAt, { withYear: true })}</p>
                </div>
                <span className={cn('text-sm font-black', tx.amount > 0 ? 'text-success' : 'text-white')}>
                  {tx.amount > 0 ? '+' : ''}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
