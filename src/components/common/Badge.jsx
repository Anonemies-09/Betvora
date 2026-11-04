import { cn } from '../../utils/cn'

const tones = {
  gold: 'border-gold/30 bg-gold/15 text-gold',
  green: 'border-success/30 bg-success/15 text-success',
  red: 'border-danger/30 bg-danger/15 text-danger',
  navy: 'border-white/10 bg-white/5 text-white/70',
  blue: 'border-royal-400/40 bg-royal-400/20 text-sky-300',
}

export default function Badge({ tone = 'navy', dot = false, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
