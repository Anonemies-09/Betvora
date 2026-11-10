import { useState } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

export default function SecurityPage() {
  const { user, changePassword } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Security</h1>

      <Card className="flex items-center gap-3 p-5">
        <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
        <p className="text-sm text-white/50">
          Two-factor authentication and login alerts are powered by Firebase Auth. Password changes
          below work right now.
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">
          Change password
        </h2>
        <p className="mt-1 text-xs text-white/40">Signed in as {user?.email}</p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Input
            label="Current Password"
            type={show ? 'text' : 'password'}
            icon={Lock}
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            type={show ? 'text' : 'password'}
            icon={Lock}
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            autoComplete="new-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label="Toggle visibility"
                className="rounded-lg p-1.5 text-white/40 hover:text-white"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            label="Confirm New Password"
            type={show ? 'text' : 'password'}
            icon={Lock}
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            autoComplete="new-password"
          />
          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
              Password changed successfully.
            </p>
          )}
          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  )
}
