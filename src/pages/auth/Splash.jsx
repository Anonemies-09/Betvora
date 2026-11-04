import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import { useAuth } from '../../context/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(
      () => navigate(user ? '/home' : '/welcome', { replace: true }),
      2200,
    )
    return () => clearTimeout(timer)
  }, [loading, user, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="animate-scale-in">
          <Logo size={64} withText={false} />
        </div>
        <h1 className="animate-fade-up mt-6 text-4xl font-black tracking-tight text-white [animation-delay:120ms]">
          BET<span className="text-gold">VORA</span>
        </h1>
        <p className="animate-fade-up mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/45 [animation-delay:200ms]">
          Sports · Live · Virtuals
        </p>

        <div className="animate-fade-up mt-12 w-52 [animation-delay:380ms]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/35">
            <span>Loading odds feed</span>
            <span className="text-gold">…</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full animate-splash-fill rounded-full bg-gold" />
          </div>
        </div>
      </div>

      <p className="pb-8 text-center text-xs text-white/35">
        Demo betting — no real money involved
      </p>
    </div>
  )
}
