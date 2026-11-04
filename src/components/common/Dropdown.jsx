import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select option',
  className,
  buttonClassName,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-navy-800 px-4 py-3 text-sm text-white transition-colors hover:border-white/20',
          open && 'border-gold',
          buttonClassName,
        )}
      >
        <span className={cn(!selected && 'text-white/40')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-white/40 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-royal-600 py-1 shadow-2xl shadow-black/40">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5',
                option.value === value && 'bg-gold/10 font-semibold text-gold',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
