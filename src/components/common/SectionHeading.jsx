import { ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SectionHeading({ title, action, onClick, className }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between', className)}>
      <h2 className="text-sm font-black uppercase tracking-widest text-white">{title}</h2>
      {action && (
        <button
          onClick={onClick}
          className="flex items-center gap-0.5 text-xs font-bold text-gold transition-colors hover:text-gold-600"
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
