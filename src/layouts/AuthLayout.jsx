import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Logo from '../components/common/Logo'

export default function AuthLayout({ children, showBack = true }) {
  const location = useLocation()
  const isSplashOrOnboarding =
    location.pathname === '/' && (location.state?.splash || false)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="inline-flex">
            <Logo />
          </Link>
          {showBack && !isSplashOrOnboarding && (
            <Link
              to="/"
              className="flex items-center gap-1 text-sm font-semibold text-white/50 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          )}
        </div>
        <div className="rounded-2xl border border-white/5 bg-royal/80 p-6 shadow-2xl shadow-black/40 sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-white/30">
          Demo product — no real money is involved.
        </p>
      </div>
    </div>
  )
}
