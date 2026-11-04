import { cn } from '../../utils/cn'

export default function LiveBadge({ minute, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      Live{minute ? ` ${minute}'` : ''}
    </span>
  )
}
