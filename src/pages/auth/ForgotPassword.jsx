import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPassword() {
  const { requestPasswordReset, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await requestPasswordReset({ email })
      setStep(result?.sent ? 'sent' : 'reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const doReset = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await resetPassword({ email, code, password })
      setStep('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'sent') {
    return (
      <div>
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          Reset link sent
        </div>
        <h1 className="mt-5 text-2xl font-black text-white">Check your email</h1>
        <p className="mt-2 text-sm text-white/50">
          If an account exists for <b className="text-white">{email}</b>, a password reset link is on
          its way. Open it to choose a new password.
        </p>
        <Button size="lg" fullWidth className="mt-7" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div>
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          Password reset complete
        </div>
        <h1 className="mt-5 text-2xl font-black text-white">All set</h1>
        <p className="mt-2 text-sm text-white/50">
          Your password has been updated. Log in with the new one to pick up where you left off.
        </p>
        <Button size="lg" fullWidth className="mt-7" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-1.5 text-sm font-semibold text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </button>
      <h1 className="mt-5 text-2xl font-black text-white">Reset password</h1>
      <p className="mt-1 text-sm text-white/50">
        {step === 'email'
          ? 'Enter your account email and we will send you a password reset link.'
          : `Enter the code sent to ${email} and choose a new password.`}
      </p>

      <form onSubmit={step === 'email' ? sendCode : doReset} className="mt-6 space-y-4">
        {step === 'email' && (
          <Input
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        )}
        {step === 'reset' && (
          <>
            <Input
              label="Reset Code"
              name="code"
              type="text"
              icon={KeyRound}
              placeholder="Reset code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Input
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          </>
        )}

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          {step === 'email' ? 'Send Reset Link' : 'Reset Password'}
        </Button>
      </form>
    </div>
  )
}
