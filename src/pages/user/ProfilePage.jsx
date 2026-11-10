import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  ShieldCheck,
  BadgeCheck,
  Lock,
  Gift,
  Users,
  CircleHelp,
  Settings,
  LogOut,
  ChevronRight,
  Landmark,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import { useAuth } from '../../context/AuthContext'

const SECTIONS = [
  { to: '/profile/personal', label: 'Personal Information', icon: User },
  { to: '/profile/bank', label: 'Bank Accounts', icon: Landmark },
  { to: '/profile/verification', label: 'Verification', icon: BadgeCheck },
  { to: '/profile/security', label: 'Security', icon: Lock },
  { to: '/profile/promotions', label: 'Promotions', icon: Gift },
  { to: '/profile/referral', label: 'Referral Program', icon: Users },
  { to: '/profile/support', label: 'Help & Support', icon: CircleHelp },
  { to: '/profile/settings', label: 'Settings', icon: Settings },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Profile</h1>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold text-xl font-black text-white">
            {user?.fullName
              ?.split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black text-white">{user?.fullName}</p>
            <p className="truncate text-sm text-white/50">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone={user?.isVerified ? 'green' : 'navy'} dot>
                {user?.isVerified ? 'Verified' : 'Pending Verification'}
              </Badge>
              <Badge tone="navy">Referral {user?.referralCode}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-white/5">
        {SECTIONS.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800">
              <section.icon className="h-4.5 w-4.5 text-gold" />
            </span>
            <span className="flex-1 text-sm font-bold text-white">{section.label}</span>
            <ChevronRight className="h-4 w-4 text-white/25" />
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-4 transition-colors hover:bg-danger/10"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-800">
            <LogOut className="h-4.5 w-4.5 text-danger" />
          </span>
          <span className="flex-1 text-left text-sm font-bold text-danger">Logout</span>
          <ChevronRight className="h-4 w-4 text-white/25" />
        </button>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-gold" />
        <p className="text-xs leading-relaxed text-white/40">
          BETVORA is live. Balances and bets involve real money. Play responsibly.
        </p>
      </Card>
    </div>
  )
}
