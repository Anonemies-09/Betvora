import { Plus } from 'lucide-react'
import { useBetSlip } from '../../context/BetSlipContext'
import { formatOdds } from '../../utils/format'
import { cn } from '../../utils/cn'

export default function OddsButton({
  match,
  market,
  outcome,
  outcomeKey,
  odds,
  disabled = false,
  className,
}) {
  const { selections, addSelection, removeSelection } = useBetSlip()

  const selected = selections.some(
    (s) =>
      s.matchId === match.id &&
      s.market === market &&
      s.outcomeKey === outcomeKey,
  )

  const handleClick = () => {
    if (selected) {
      removeSelection({ matchId: match.id, market, outcomeKey })
      return
    }
    addSelection({
      matchId: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      market,
      outcome,
      outcomeKey,
      odds,
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-[8px] border px-2 py-1.5 transition-colors duration-100',
        selected
          ? 'border-gold bg-gold text-navy-800'
          : 'border-royal-400/40 bg-navy-800/60 text-white hover:border-gold hover:bg-gold/10 hover:text-gold',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      <span
        className={cn(
          'w-full truncate text-center text-[10px] font-medium uppercase tracking-wide opacity-60',
          selected && 'opacity-90',
        )}
      >
        {outcome}
      </span>
      <span className={cn('text-sm font-bold', selected && 'text-white')}>
        {formatOdds(odds)}
      </span>
      {!selected && (
        <Plus
          className={cn(
            'absolute right-1 top-1 h-3 w-3 rounded-full text-gold opacity-0 transition-opacity group-hover:opacity-100',
          )}
        />
      )}
    </button>
  )
}
