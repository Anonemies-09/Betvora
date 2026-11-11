import { useState } from 'react'
import { BadgeCheck, IdCard } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

export default function VerificationPage() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ dob: '', idNumber: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await updateProfile({ isVerified: true })
    setMessage('Verification submitted — your account is now verified.')
    setLoading(false)
  }

  if (user?.isVerified) {
    return (
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Verification</h1>
        <Card className="mt-5 flex items-center gap-4 p-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
            <BadgeCheck className="h-7 w-7 text-success" />
          </span>
          <div>
            <p className="font-black text-white">Account verified</p>
            <p className="mt-1 text-sm text-white/50">
              Your identity has been confirmed. You can now deposit, bet and withdraw.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Verification</h1>
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Badge tone="navy" dot>Unverified</Badge>
          <span className="text-xs text-white/40">Complete these steps to start betting.</span>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Date of Birth"
            type="date"
            value={form.dob}
            onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
          />
          <Input
            label="National ID / Passport Number"
            icon={IdCard}
            placeholder="GHA-0000000"
            value={form.idNumber}
            onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
          />
          {message && (
            <p className="rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
              {message}
            </p>
          )}
          <Button type="submit" loading={loading}>
            Submit for Verification
          </Button>
        </form>
      </Card>
    </div>
  )
}
