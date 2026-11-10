import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Lock, Eye, EyeOff, Globe, IdCard, Gift, Sparkles, ShieldCheck } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { isFirebaseConfigured } from '../../services/firebase'
import { COUNTRIES, currencyForCountry, getCountry, DEFAULT_COUNTRY } from '../../data/countries'
import * as walletService from '../../services/walletService'

const ID_TYPES = ['Ghana Card', 'Passport', "Driver's Licence", "Voter's ID", 'SSNIT ID']

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  idType: 'Ghana Card',
  idNumber: '',
  country: DEFAULT_COUNTRY,
  referredBy: '',
  password: '',
  confirmPassword: '',
}

function ageOf(dob) {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return -1
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1
  return age
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOver18, setIsOver18] = useState(false)
  const [agree, setAgree] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'Enter your first name as shown on your ID.'
    if (!form.lastName.trim()) next.lastName = 'Enter your surname as shown on your ID.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (form.phone.trim().length < 8) next.phone = 'Enter a valid phone number.'
    if (ageOf(form.dob) < 0) next.dob = 'Enter your date of birth.'
    else if (ageOf(form.dob) < 18) next.dob = 'You must be at least 18 years old to register.'
    if (!form.idNumber.trim()) next.idNumber = 'Enter your ID number.'
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    if (!isOver18) next.isOver18 = 'You must confirm you are 18 or older.'
    if (!agree) next.agree = 'You must accept the Terms & Conditions and Privacy Policy.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const currency = currencyForCountry(form.country)
      const payload = { ...form, currency }
      delete payload.confirmPassword
      const created = await register(payload)
      await walletService.setCurrency(currency, created.id)
      if (isFirebaseConfigured) {
        navigate('/home', { replace: true })
      } else {
        navigate('/verify', { state: { email: created.email }, replace: true })
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/images/register.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/70 to-navy/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.35),transparent_60%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-gold" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gold">Betvora</span>
          </div>
          <div className="max-w-md animate-fade-up">
            <h2 className="text-4xl font-black leading-tight text-white">
              Join the arena.
              <br />
              <span className="text-gold-gradient">Play with confidence.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Create your account in minutes and unlock live odds, instant payouts, promotions and a
              secure wallet — all in one place.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { label: 'Live markets', value: '1000+' },
                { label: 'Sports', value: '30+' },
                { label: 'Payouts', value: 'Instant' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                >
                  <p className="text-lg font-black text-gold">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/40">18+. Play responsibly.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-gold" />
          <div>
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="text-sm text-white/50">Verified, secure and ready in minutes.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              name="firstName"
              type="text"
              icon={User}
              placeholder="Kofi"
              value={form.firstName}
              onChange={update('firstName')}
              error={errors.firstName}
              autoComplete="given-name"
            />
            <Input
              label="Surname"
              name="lastName"
              type="text"
              icon={User}
              placeholder="Mensah"
              value={form.lastName}
              onChange={update('lastName')}
              error={errors.lastName}
              autoComplete="family-name"
            />
          </div>
          <p className="-mt-2 text-xs text-white/40">Use your name exactly as it appears on your ID.</p>

          <Input
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Mobile Number"
            name="phone"
            type="tel"
            icon={Phone}
            placeholder="+233 24 000 0000"
            value={form.phone}
            onChange={update('phone')}
            error={errors.phone}
            autoComplete="tel"
          />

          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            icon={User}
            value={form.dob}
            onChange={update('dob')}
            error={errors.dob}
          />

          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-white/70">ID Type</span>
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <select
                  name="idType"
                  value={form.idType}
                  onChange={update('idType')}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-4 text-sm font-semibold text-white outline-none focus:border-gold"
                >
                  {ID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <Input
              label="ID Number"
              name="idNumber"
              icon={IdCard}
              placeholder="GHA-0000000-0"
              value={form.idNumber}
              onChange={update('idNumber')}
              error={errors.idNumber}
              autoComplete="off"
            />
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-white/70">Country</span>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <select
                name="country"
                value={form.country}
                onChange={update('country')}
                className="w-full appearance-none rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-10 pr-4 text-sm font-semibold text-white outline-none focus:border-gold"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} — {country.currency}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-white/40">
              Your wallet will use {getCountry(form.country).currency} ({getCountry(form.country).symbol}).
            </p>
          </label>

          <Input
            label="Referral Code"
            name="referredBy"
            type="text"
            icon={Gift}
            placeholder="Optional — e.g. BV-MENS00X"
            value={form.referredBy}
            onChange={update('referredBy')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
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
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isOver18}
              onChange={(e) => setIsOver18(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded border border-white/25 bg-navy-800 checked:border-gold checked:bg-gold"
            />
            <span className="text-xs leading-relaxed text-white/45">
              I confirm that I am 18 years of age or older.
            </span>
          </label>
          {errors.isOver18 && <p className="text-xs font-medium text-danger">{errors.isOver18}</p>}

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded border border-white/25 bg-navy-800 checked:border-gold checked:bg-gold"
            />
            <span className="text-xs leading-relaxed text-white/45">
              I have read and accept the{' '}
              <Link to="/terms" className="font-semibold text-gold hover:text-gold-600">
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-semibold text-gold hover:text-gold-600">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.agree && <p className="text-xs font-medium text-danger">{errors.agree}</p>}

          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-white/35">
          18+. Play responsibly. Gambling is addictive — set limits and play within them.
        </p>
        <p className="mt-4 text-center text-sm text-white/40">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gold hover:text-gold-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}