import { NavLink } from 'react-router-dom'
import { Home, Radio, ReceiptText, ScrollText, User } from 'lucide-react'
import { useBetSlip } from '../../context/BetSlipContext'
import { cn } from '../../utils/cn'

const ITEMS = [
  { to: '/home', label: 'Home', icon: Home, end: true },
  { to: '/in-play', label: 'In-Play', icon: Radio },
  { to: '/bet-slip', label: 'Betslip', icon: ReceiptText, badgeKey: 'slip' },
  { to: '/my-bets', label: 'My Bets', icon: ScrollText },
  { to: '/profile', label: 'Account', icon: User },
]

export default function BottomNavigation() {
  const { selections } = useBetSlip()
  const badgeCount = selections.length

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-gold' : 'text-white/45 hover:text-white/80',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badgeKey === 'slip' && badgeCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-black text-white">
                      {badgeCount}
                    </span>
                  )}
                </span>
                {item.label}
                {isActive && <span className="absolute -top-px h-0.5 w-6 rounded-full bg-gold" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
