import { useState } from 'react'
import { User, Mail, Phone, Save } from 'lucide-react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

export default function PersonalInfoPage() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setSuccess(false)
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      await updateProfile(form)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">
        Personal Information
      </h1>
      <Card className="p-5">
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Full Name"
            icon={User}
            value={form.fullName}
            onChange={update('fullName')}
          />
          <Input label="Email" icon={Mail} type="email" value={form.email} onChange={update('email')} />
          <Input label="Phone" icon={Phone} type="tel" value={form.phone} onChange={update('phone')} />
          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
              Profile updated successfully.
            </p>
          )}
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  )
}
