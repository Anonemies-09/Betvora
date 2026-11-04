import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Info } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { DEMO_PASSWORD } from '../../services/authService'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from || '/home'

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-white/50">Log in to keep betting with BETVORA.</p>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-gold/20 bg-gold/5 p-3 text-xs text-white/60">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <span>
          Demo login: <b className="text-white">demo@betvora.app</b> /{' '}
          <b className="text-white">{DEMO_PASSWORD}</b>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email or Phone"
          name="identifier"
          type="text"
          icon={Mail}
          placeholder="demo@betvora.app"
          value={form.identifier}
          onChange={update('identifier')}
          autoComplete="username"
        />
        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Log In
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="font-semibold text-gold hover:text-gold-600">
          Forgot password?
        </Link>
        <Link to="/register" className="font-semibold text-white/60 hover:text-white">
          Create account
        </Link>
      </div>
    </div>
  )
}
