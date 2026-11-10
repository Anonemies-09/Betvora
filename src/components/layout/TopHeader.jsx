import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Wallet, Sun, Moon, LogOut } from 'lucide-react'
import Logo from '../common/Logo'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { formatCurrency } from '../../utils/format'
import { cn } from '../../utils/cn'

const NAV_LINKS = [
  { to: '/sports', label: 'Sports' },
  { to: '/in-play', label: 'Live Betting' },
  { to: '/casino', label: 'Casino' },
  { to: '/virtuals', label: 'Virtual Sports' },
  { to: '/crash', label: 'Crash Games' },
  { to: '/aviator', label: 'Aviator' },
  { to: '/promotions', label: 'Promotions' },
]

export default function TopHeader({ onOpenMenu }) {
  const { user, logout } = useAuth()
  const { balance, currency } = useWallet()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()

  const initials = (user?.fullName || 'BV')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-navy/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-md border border-white/10 bg-royal p-2 text-white/70 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/home" className="shrink-0">
          <Logo size={32} />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-md px-4 py-2 text-sm font-bold transition-colors',
                  isActive
                    ? 'text-gold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-gold" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wallet"
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-2 text-sm font-black text-gold transition-colors hover:bg-gold/20 sm:px-3"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden min-[430px]:inline">{formatCurrency(balance, currency)}</span>
          </Link>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-md border border-white/10 bg-royal p-2.5 text-gold transition-colors hover:text-gold-600"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative rounded-md border border-white/10 bg-royal p-2.5 text-white/70 transition-colors hover:text-white"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="rounded-md border border-white/10 bg-royal p-2.5 text-white/70 transition-colors hover:text-danger"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
          <Link
            to="/profile"
            className="hidden shrink-0 items-center gap-2 rounded-md border border-white/10 bg-royal py-1.5 pl-1.5 pr-2.5 text-white transition-colors hover:bg-royal-600 sm:flex"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-gold text-xs font-black text-navy-800">
              {initials}
            </span>
            <span className="hidden text-sm font-semibold md:inline">
              {user?.fullName?.split(' ')[0]}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-white/40 md:block" />
          </Link>
        </div>
      </div>
    </header>
  )
}
