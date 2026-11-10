import { NavLink } from 'react-router-dom'
import { Home, Radio, Zap, Flame, Shield, Plane } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { SPORTS, LEAGUES } from '../../data/catalogue'
import { cn } from '../../utils/cn'
import { flagEmoji } from '../../utils/format'

const QUICK_LINKS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/in-play', label: 'In-Play', icon: Radio },
  { to: '/aviator', label: 'Aviator', icon: Plane },
  { to: '/promotions', label: 'Promotions', icon: Zap },
]

function SectionTitle({ children }) {
  return (
    <h3 className="px-2 pb-2 text-[11px] font-bold uppercase tracking-widest text-white/35">
      {children}
    </h3>
  )
}

export default function Sidebar({ mobile = false }) {
  const { user } = useAuth()
  const topLeagues = LEAGUES.filter((l) => l.popular)
  const isStaff = user?.role === 'admin' || user?.role === 'agent'
  return (
    <aside className={cn('sticky top-16 h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-white/5 bg-navy-800/40 p-4 no-scrollbar', mobile ? 'block' : 'hidden lg:block')}>
      <div className="space-y-6">
        <div>
          <SectionTitle>Quick Links</SectionTitle>
          <nav className="space-y-1">
            {QUICK_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <link.icon className="h-4.5 w-4.5" />
                {link.label}
              </NavLink>
            ))}
            {isStaff && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Shield className="h-4.5 w-4.5" />
                Admin Console
              </NavLink>
            )}
          </nav>
        </div>

        <div>
          <SectionTitle>Sports</SectionTitle>
          <nav className="space-y-1">
            {SPORTS.map((sport) => (
              <NavLink
                key={sport.id}
                to={`/sports/${sport.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <sport.icon className="h-4.5 w-4.5" style={{ color: sport.accent }} />
                {sport.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <SectionTitle>Top Leagues</SectionTitle>
          <nav className="space-y-1">
            {topLeagues.map((league) => (
              <NavLink
                key={league.id}
                to={`/sports/${league.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <span className="text-base">{flagEmoji(league.flag)}</span>
                <span className="truncate">{league.name}</span>
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/sports"
            className="mt-1.5 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-gold transition-colors hover:bg-gold/10"
          >
            View all leagues →
          </NavLink>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center gap-2 text-gold">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-black uppercase">Hot Tip</span>
          </div>
          <p className="mt-1.5 text-xs text-white/50">
            BetVora is live. Play responsibly.
          </p>
        </div>
      </div>
    </aside>
  )
}
