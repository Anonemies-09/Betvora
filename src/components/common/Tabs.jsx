import { cn } from '../../utils/cn'

export default function Tabs({ tabs, active, onChange, className, size = 'md', scrollable = false }) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-navy-800 p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const label = typeof tab === 'string' ? tab : tab.label
        const value = typeof tab === 'string' ? tab : tab.value
        return (
          <button
            key={value ?? label}
            onClick={() => onChange(value ?? label)}
            className={cn(
              'whitespace-nowrap rounded-lg font-bold transition-all duration-150',
              scrollable ? 'shrink-0' : 'flex-1',
              size === 'md' ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs',
              active === (value ?? label)
                ? 'bg-gold text-white shadow'
                : 'text-white/50 hover:text-white',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
