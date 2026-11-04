import { cn } from '../../utils/cn'

export default function Input({
  label,
  error,
  icon: Icon,
  rightSlot,
  className,
  inputClassName,
  id,
  ...props
}) {
  const inputId = id || props.name || label
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-white/70">{label}</span>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-navy-800 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:ring-2 focus:ring-gold/30',
            Icon && 'pl-11',
            error ? 'border-danger' : 'border-white/10 focus:border-gold',
            inputClassName,
          )}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && <span className="mt-1.5 block text-xs text-danger">{error}</span>}
    </label>
  )
}
