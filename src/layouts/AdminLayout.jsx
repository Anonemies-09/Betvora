import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Trophy,
  ReceiptText,
  Wallet,
  Megaphone,
  Sparkles,
  LogOut,
  Home,
} from 'lucide-react'
import Logo from '../components/common/Logo'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, staff: true },
  { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/admin/sports', label: 'Sports & Matches', icon: Trophy, staff: true },
  { to: '/admin/bets', label: 'Bets', icon: ReceiptText, staff: true },
  { to: '/admin/wallet', label: 'Wallet & Transactions', icon: Wallet, staff: true },
  { to: '/admin/promotions', label: 'Promotions', icon: Megaphone, adminOnly: true },
{ to: '/admin/promo-codes', label: 'Promo Codes', icon: Megaphone, adminOnly: true },
  { to: '/admin/banners', label: 'Banners', icon: Sparkles, adminOnly: true },
{ to: '/admin/reports', label: 'Reports', icon: Sparkles, adminOnly: true },
{ to: '/admin/audit', label: 'Audit Log', icon: Sparkles, adminOnly: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const visibleLinks = ADMIN_LINKS.filter((l) => !l.adminOnly || user?.role === 'admin')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-navy">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-navy-800/50 p-4 lg:flex">
        <Link to="/admin" className="mb-8 px-2">
          <Logo size={30} />
        </Link>
        <nav className="flex-1 space-y-1">
          <Link
            to="/home"
            className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/60 px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-navy-800">
              <Home className="h-3.5 w-3.5" />
            </span>
            Main Site
          </Link>
          {visibleLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {({ isActive }) => (
                <span
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg border',
                      isActive ? 'border-gold/30 bg-gold/15' : 'border-white/10 bg-navy-800',
                    )}
                  >
                    <link.icon className="h-3.5 w-3.5" />
                  </span>
                  {link.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/5 pt-4">
          <p className="mb-3 px-2 text-xs text-white/40">Signed in as {user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-navy/90 px-4 backdrop-blur-xl">
          <Link to="/admin" className="lg:hidden">
            <Logo size={28} withText={false} />
          </Link>
          <h1 className="text-sm font-black uppercase tracking-widest text-white/60">
            {user?.role === 'agent' ? 'Agent Console' : 'Admin Console'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-xs font-black text-white">
              A
            </span>
            <span className="hidden text-sm font-semibold sm:inline">{user?.fullName}</span>
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="rounded-lg border border-white/10 bg-navy-800 p-2 text-white/70 transition-colors hover:text-danger"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/5 bg-navy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {ADMIN_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-semibold',
                isActive ? 'text-gold' : 'text-white/45',
              )
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
