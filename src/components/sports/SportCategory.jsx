import { cn } from '../../utils/cn'

export default function SportCategory({ sport, onSelect, active = false }) {
  const Icon = sport.icon
  return (
    <button
      type="button"
      onClick={() => onSelect?.(sport.id)}
      className={cn(
        'flex min-w-[72px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-150',
        active
          ? 'border-gold bg-gold/10'
          : 'border-white/5 bg-royal hover:border-white/20',
      )}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${sport.accent}1f`, color: sport.accent }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className={cn('text-xs font-bold', active ? 'text-gold' : 'text-white/70')}>
        {sport.name}
      </span>
    </button>
  )
}
