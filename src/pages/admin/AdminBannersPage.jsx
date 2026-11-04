import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Sparkles, Eye, EyeOff } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Dropdown from '../../components/common/Dropdown'
import Modal from '../../components/common/Modal'
import EmptyState from '../../components/common/EmptyState'
import {
  getBanners,
  createBanner,
  updateBanner,
  setBannerActive,
  deleteBanner,
} from '../../services/bannerService'

const EMPTY = {
  badge: 'PROMO',
  title: '',
  subtitle: '',
  ctaLabel: 'Learn More',
  ctaLink: '/promotions',
  icon: 'sparkles',
  accent: '#FFC107',
  gradient: 'from-[#1E88E5]/45 via-[#0D47A1]/35 to-navy',
  order: '1',
  active: true,
}

const ICONS = [
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'trophy', label: 'Trophy' },
  { value: 'activity', label: 'Live Activity' },
  { value: 'zap', label: 'Odds Boost' },
  { value: 'users', label: 'Refer' },
  { value: 'gift', label: 'Gift' },
  { value: 'star', label: 'Star' },
]

const GRADIENTS = [
  { value: 'from-[#1E88E5]/45 via-[#0D47A1]/35 to-navy', label: 'Royal Blue' },
  { value: 'from-[#FFD54F]/40 via-[#E09B00]/30 to-navy', label: 'Gold' },
  { value: 'from-[#F44336]/45 via-[#B71C1C]/30 to-navy', label: 'Live Red' },
  { value: 'from-[#4CAF50]/40 via-[#2E7D32]/30 to-navy', label: 'Brand Green' },
  { value: 'from-[#A78BFA]/40 via-[#7c6bd1]/30 to-navy', label: 'Violet' },
]

const ACCENTS = ['#0D47A1', '#1E88E5', '#FFC107', '#E09B00', '#4CAF50', '#F44336']

function BannerPreview({ banner }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${banner.gradient || GRADIENTS[0].value} p-4`}>
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide"
        style={{ backgroundColor: `${banner.accent || '#00a651'}26`, color: banner.accent }}
      >
        {banner.badge}
      </span>
      <p className="mt-2 text-sm font-black uppercase leading-tight text-white">{banner.title}</p>
      {banner.subtitle && <p className="mt-1 text-[11px] text-white/70">{banner.subtitle}</p>}
      <p className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-[10px] font-black text-navy">
        {banner.ctaLabel} → {banner.ctaLink}
      </p>
    </div>
  )
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const load = () => getBanners().then(setBanners)

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }

  const openEdit = (banner) => {
    setEditing(banner)
    setForm({
      badge: banner.badge,
      title: banner.title,
      subtitle: banner.subtitle || '',
      ctaLabel: banner.ctaLabel || 'Learn More',
      ctaLink: banner.ctaLink || '/promotions',
      icon: banner.icon || 'sparkles',
      accent: banner.accent || ACCENTS[0],
      gradient: banner.gradient || GRADIENTS[0].value,
      order: String(banner.order ?? '1'),
      active: banner.active,
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    const payload = {
      ...form,
      order: Number(form.order) || 1,
      active: form.active,
    }
    if (editing) await updateBanner(editing.id, payload)
    else await createBanner(payload)
    setModal(false)
    load()
  }

  const toggle = async (banner) => {
    await setBannerActive(banner.id, !banner.active)
    load()
  }

  const remove = async (banner) => {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return
    await deleteBanner(banner.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Banners</h1>
          <p className="mt-1 text-sm text-white/40">
            Homepage hero carousel slides. Active banners rotate automatically for users.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          New Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={Sparkles} title="No banners" text="Create your first homepage banner." />
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <Card key={banner.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-navy-800 text-gold">
                    {banner.order}
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">{banner.title}</p>
                    <p className="text-xs text-white/40">
                      #{banner.id} • {banner.icon}
                    </p>
                  </div>
                </div>
                {banner.active ? (
                  <Badge tone="green" dot>Active</Badge>
                ) : (
                  <Badge tone="navy">Hidden</Badge>
                )}
              </div>

              <div className="mt-3">
                <BannerPreview banner={banner} />
              </div>

              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant={banner.active ? 'secondary' : 'success'} onClick={() => toggle(banner)}>
                  {banner.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {banner.active ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openEdit(banner)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <button
                  onClick={() => remove(banner)}
                  aria-label="Delete banner"
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
        title={editing ? 'Edit Banner' : 'New Banner'}
        subtitle="This slide shows at the top of the user home page."
        footer={
          <Button fullWidth onClick={save}>
            {editing ? 'Save Changes' : 'Create Banner'}
          </Button>
        }
      >
        <div className="space-y-4">
          <Input label="Badge" placeholder="WELCOME OFFER" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
          <Input label="Title" placeholder="100% Bonus up to ₵100,000" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Subtitle" placeholder="Short supporting line" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Button Label" placeholder="Claim Bonus" value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
            <Input label="Link To" placeholder="/promotions" value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Dropdown
              options={ICONS}
              value={form.icon}
              onChange={(icon) => setForm((f) => ({ ...f, icon }))}
            />
            <Input label="Order" type="number" min="1" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/50">Accent Colour</p>
            <div className="flex gap-2">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Accent ${color}`}
                  onClick={() => setForm((f) => ({ ...f, accent: color }))}
                  className={`h-8 w-8 rounded-full transition-transform ${form.accent === color ? 'ring-2 ring-white ring-offset-2 ring-offset-royal' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Dropdown
            options={GRADIENTS}
            value={form.gradient}
            onChange={(gradient) => setForm((f) => ({ ...f, gradient }))}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-white/70">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-navy text-gold"
            />
            Active (shown in the homepage carousel)
          </label>
        </div>
      </Modal>
    </div>
  )
}
