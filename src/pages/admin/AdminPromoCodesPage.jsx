import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import EmptyState from '../../components/common/EmptyState'
import { createPromoCode, listPromoCodes } from '../../services/promoCodeService'
import { logAction } from '../../services/auditService'
import { formatCurrency } from '../../utils/format'

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ code: '', bonus: '', expiryDays: '30', usageLimit: '100' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setCodes(await listPromoCodes())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createPromoCode(form)
      await logAction('promo.created', { code: form.code, bonus: form.bonus })
      setForm({ code: '', bonus: '', expiryDays: '30', usageLimit: '100' })
      setMessage('Promo code created.')
      await load()
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Promo Codes</h1>
        <p className="mt-1 text-sm text-white/40">Create codes players can redeem for bonus balance.</p>
      </div>

      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </p>
      )}

      <Card className="p-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4">
          <Input label="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          <Input label="Bonus" type="number" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))} />
          <Input label="Expiry (days)" type="number" value={form.expiryDays} onChange={(e) => setForm((f) => ({ ...f, expiryDays: e.target.value }))} />
          <Input label="Usage limit" type="number" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
          <div className="sm:col-span-4">
            <Button type="submit" loading={saving}>Create promo code</Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">Loading codes…</p>
      ) : codes.length === 0 ? (
        <EmptyState title="No promo codes" text="Create one above." />
      ) : (
        <div className="space-y-2">
          {codes.map((code) => (
            <Card key={code.code} className="flex items-center justify-between p-4">
              <div>
                <p className="font-mono text-sm font-black text-gold">{code.code}</p>
                <p className="text-xs text-white/40">
                  Bonus {formatCurrency(code.bonus)} • expires {new Date(code.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-white/35">limit {code.usageLimit}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
