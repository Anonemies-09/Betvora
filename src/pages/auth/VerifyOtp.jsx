import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../utils/cn'

export default function VerifyOtp() {
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const email = location.state?.email || ''
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    if (email) inputs.current[0]?.focus()
  }, [email])

  const handleChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = sanitized
    setDigits(next)
    setError('')
    if (sanitized && index < 3) inputs.current[index + 1]?.focus()
    if (!sanitized && index > 0) inputs.current[index - 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 4) {
      setError('Enter the 4-digit verification code.')
      return
    }
    setLoading(true)
    try {
      await verifyOtp({ email, code })
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white">Verify your account</h1>
      <p className="mt-1 text-sm text-white/50">
        Enter the 4-digit code sent to <b className="text-white">{email || 'your account'}</b>
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex justify-between gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el
              }}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                'h-16 w-full rounded-xl border bg-navy-800 text-center text-2xl font-black text-white outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30',
                error ? 'border-danger' : 'border-white/10',
              )}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/10 bg-navy-800 p-3 text-xs text-white/50">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>Didn&apos;t get the code? Check your spam folder or contact support.</span>
        </div>

        <Button type="submit" size="lg" fullWidth className="mt-5" loading={loading}>
          Verify Account
        </Button>
      </form>
    </div>
  )
}
