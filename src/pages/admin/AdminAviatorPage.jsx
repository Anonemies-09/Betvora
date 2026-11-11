import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { fetchAviatorGlobalSettings, saveAviatorGlobalSettings } from '../../services/aviatorSettingsService'

export default function AdminAviatorPage() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAviatorGlobalSettings().then(setSettings)
  }, [])

  if (!settings) return <p className="py-10 text-center text-sm text-white/40">Loading…</p>

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }))

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      await saveAviatorGlobalSettings(settings)
      setMessage('Aviator settings saved.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Aviator Control</h1>
        <p className="mt-1 text-sm text-white/40">Tune the game and force outcomes for the next round.</p>
      </div>
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </p>
      )}
      <Card className="space-y-4 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-navy-800 text-gold"
          />
          <span className="text-sm font-bold text-white">Game enabled</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Min stake" type="number" value={settings.minStake} onChange={(e) => update({ minStake: Number(e.target.value) })} />
          <Input label="Max stake" type="number" value={settings.maxStake} onChange={(e) => update({ maxStake: Number(e.target.value) })} />
          <Input label="House edge (% instant crash)" type="number" value={settings.houseEdge} onChange={(e) => update({ houseEdge: Number(e.target.value) })} />
          <Input label="Growth rate" type="number" step="0.01" value={settings.growthRate} onChange={(e) => update({ growthRate: Number(e.target.value) })} />
          <Input label="Max multiplier" type="number" value={settings.maxMultiplier} onChange={(e) => update({ maxMultiplier: Number(e.target.value) })} />
          <Input label="Force next crash (x or blank)" type="number" step="0.01" value={settings.forceCrash ?? ''} onChange={(e) => update({ forceCrash: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <Button onClick={save} loading={saving}>Save aviator settings</Button>
      </Card>
    </div>
  )
}
