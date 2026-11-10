import { Wallet, ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import { formatCurrency } from '../../utils/format'

export default function WalletCard({
  balance,
  currency,
  onDeposit,
  onWithdraw,
  onHistory,
  compact = false,
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
        <Wallet className="h-4 w-4 text-gold" />
        Wallet Balance
      </div>
        <p className="mt-2 text-3xl font-black tracking-tight text-white">
          {formatCurrency(balance, currency)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
          <Badge tone="green" dot>Live Wallet</Badge>
          Real money balance
        </p>
        {!compact && (
          <div className="mt-4 flex gap-2.5">
            <button
              onClick={onDeposit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold-600"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </button>
            <button
              onClick={onWithdraw}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-navy-800 py-2.5 text-sm font-bold text-white transition-colors hover:bg-royal-600"
            >
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </button>
            <button
              onClick={onHistory}
              aria-label="Transaction history"
              className="flex items-center justify-center rounded-xl border border-white/10 bg-navy-800 px-3.5 text-white/70 transition-colors hover:bg-royal-600 hover:text-white"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        )}
    </Card>
  )
}
