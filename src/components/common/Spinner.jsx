import { cn } from '../../utils/cn'

export default function Spinner({ className, label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold"
            style={{ animationDelay: `${i * 130}ms` }}
          />
        ))}
      </span>
      <span className="text-xs font-bold text-white/40">{label}</span>
    </span>
  )
}
