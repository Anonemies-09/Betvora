import { cn } from '../../utils/cn'

export default function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-navy-800/40 px-6 text-center',
        compact ? 'py-6' : 'py-14',
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full border border-white/10 bg-white/5',
            compact ? 'h-9 w-9' : 'h-12 w-12',
          )}
        >
          <Icon className={cn('text-white/25', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        </span>
      )}
      <p className={cn('mt-3 font-bold text-white/55', compact ? 'text-xs' : 'text-sm')}>{title}</p>
      {text && (
        <p
          className={cn(
            'mt-1 max-w-xs text-white/30',
            compact ? 'text-[11px]' : 'text-xs leading-relaxed',
          )}
        >
          {text}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
