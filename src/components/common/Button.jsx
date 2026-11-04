import { cn } from '../../utils/cn'

const variants = {
  primary: 'bg-gold text-navy-800 hover:bg-gold-600 shadow-[0_4px_10px_rgba(255,193,7,0.25)]',
  secondary: 'bg-royal text-white border border-royal-400/40 hover:bg-royal-600',
  success: 'bg-success text-white hover:brightness-110 shadow-lg shadow-success/20',
  danger: 'bg-danger text-white hover:bg-danger-600',
  ghost: 'text-white/70 hover:text-white hover:bg-white/5',
  outline: 'border border-gold text-gold hover:bg-gold/10',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
  pill: 'px-6 py-3 text-sm rounded-full',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-bold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
