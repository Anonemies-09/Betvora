import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Megaphone, Eye, EyeOff } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Dropdown from '../../components/common/Dropdown'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../../services/promotionService'
import { formatDate } from '../../utils/format'

const EMPTY = {
  title: '',
  subtitle: '',
  description: '',
  tag: 'NEW',
  percentage: '100',
  maxBonus: '100000',
  startDate: '',
  endDate: '',
  status: 'active',
  gradient: 'from-gold to-gold-600',
}

const GRADIENTS = [
  { value: 'from-gold to-gold-600', label: 'Gold' },
  { value: 'from-[#FF7A00] to-[#FFC107]', label: 'Orange' },
  { value: 'from-success to-[#0E9F45]', label: 'Green' },
]

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const load = () => getPromotions().then(setPromotions)

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }

  const openEdit = (promotion) => {
    setEditing(promotion)
    setForm({
      title: promotion.title,
      subtitle: promotion.subtitle,
      description: promotion.description,
      tag: promotion.tag,
      percentage: String(promotion.percentage),
      maxBonus: String(promotion.maxBonus),
      startDate: promotion.startDate?.slice(0, 10) || '',
      endDate: promotion.endDate?.slice(0, 10) || '',
      status: promotion.status,
      gradient: promotion.gradient,
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.subtitle.trim()) return
    const payload = {
      ...form,
      percentage: Number(form.percentage),
      maxBonus: Number(form.maxBonus),
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    }
    if (editing) await updatePromotion(editing.id, payload)
    else await createPromotion(payload)
    setModal(false)
    load()
  }

  const toggleStatus = async (promotion) => {
    await updatePromotion(promotion.id, {
      status: promotion.status === 'active' ? 'draft' : 'active',
    })
    load()
  }

  const remove = async (promotion) => {
    if (!window.confirm(`Delete promotion "${promotion.title}"?`)) return
    await deletePromotion(promotion.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Promotions</h1>
          <p className="mt-1 text-sm text-white/40">
            Admin-controlled offers. Active ones appear on the home page.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Promotion
        </Button>
      </div>

      {promotions.length === 0 ? (
        <EmptyState icon={Megaphone} title="No promotions" text="Create your first offer." />
      ) : (
        <div className="space-y-3">
          {promotions.map((promotion) => (
            <Card key={promotion.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">{promotion.tag}</Badge>
                <span
                  className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-black uppercase text-navy ${promotion.gradient}`}
                >
                  {promotion.title}
                </span>
                <span className="ml-auto">
                  {promotion.status === 'active' ? (
                    <Badge tone="green" dot>Active</Badge>
                  ) : (
                    <Badge tone="navy">Draft</Badge>
                  )}
                </span>
              </div>
              <p className="mt-2 text-sm font-black text-gold">{promotion.subtitle}</p>
              <p className="mt-1 text-sm text-white/50">{promotion.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/40">
                <span>Up to {promotion.maxBonus.toLocaleString()} bonus</span>
                <span>•</span>
                <span>
                  {promotion.startDate ? formatDate(promotion.startDate) : '—'} to{' '}
                  {promotion.endDate ? formatDate(promotion.endDate) : '—'}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant={promotion.status === 'active' ? 'secondary' : 'success'} onClick={() => toggleStatus(promotion)}>
                  {promotion.status === 'active' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {promotion.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openEdit(promotion)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <button
                  onClick={() => remove(promotion)}
                  aria-label="Delete promotion"
                  className="rounded-lg px-2.5 text-white/30 transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Promotion' : 'New Promotion'}
        subtitle="These fields control the offer shown to users."
        footer={
          <Button fullWidth onClick={save}>
            {editing ? 'Save Changes' : 'Create Promotion'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title" placeholder="WELCOME BONUS" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Tag" placeholder="NEW" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} />
          </div>
          <Input label="Subtitle" placeholder="100% UP TO ₦100,000" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          <Input label="Description" placeholder="Describe the offer." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Percentage (%)" type="number" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} />
            <Input label="Maximum Bonus" type="number" value={form.maxBonus} onChange={(e) => setForm((f) => ({ ...f, maxBonus: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Dropdown
              options={GRADIENTS}
              value={form.gradient || GRADIENTS[0].value}
              onChange={(gradient) => setForm((f) => ({ ...f, gradient }))}
            />
            <Dropdown
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
              ]}
              value={form.status}
              onChange={(status) => setForm((f) => ({ ...f, status }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
