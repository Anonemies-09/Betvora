import Card from '../common/Card'
import Badge from '../common/Badge'
import { flagEmoji } from '../../utils/format'

export default function LeagueCard({ league, onSelect, active = false }) {
  const Icon = league.icon
  return (
    <Card
      hoverable
      onClick={() => onSelect?.(league.id)}
      className={cn(
        'flex w-40 shrink-0 items-center gap-3 px-4 py-3',
        active && 'border-gold bg-gold/5',
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800">
        <Icon className="h-5 w-5 text-gold" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{league.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs text-white/40">
            {flagEmoji(league.flag)} {league.country}
          </span>
        </div>
      </div>
      <span className="ml-auto">
        <Badge tone="navy">{league.matches}</Badge>
      </span>
    </Card>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
