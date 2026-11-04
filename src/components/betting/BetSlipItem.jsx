import { X } from 'lucide-react'
import { formatOdds } from '../../utils/format'
import { cn } from '../../utils/cn'

export default function BetSlipItem({ selection, onRemove, compact = false }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-navy-800',
        compact ? 'p-2.5' : 'p-3.5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
            {selection.market}
          </p>
          <p className={cn('mt-0.5 truncate font-bold text-white', compact ? 'text-xs' : 'text-sm')}>
            {selection.homeTeam}
            <span className="mx-1 font-normal text-white/40">vs</span>
            {selection.awayTeam}
          </p>
          <p className={cn('mt-0.5 text-white/60', compact ? 'text-[11px]' : 'text-xs')}>
            {selection.outcome}
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove selection"
          className="shrink-0 rounded-full bg-white/5 p-1.5 text-white/40 transition-colors hover:bg-danger/20 hover:text-danger"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-white/40">Odds</span>
        <span
          className={cn(
            'rounded-md px-2 py-1 text-sm font-black text-gold',
            'bg-gold/10',
          )}
        >
          @ {formatOdds(selection.odds)}
        </span>
      </div>
    </div>
  )
}
