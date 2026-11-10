import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Bell, Wallet, ShieldCheck, Megaphone, Sun, Moon } from 'lucide-react'
import Card from '../../components/common/Card'
import { useWallet } from '../../context/WalletContext'
import { useTheme } from '../../context/ThemeContext'
import { getAdConsent, setAdConsent } from '../../services/adsService'
import { requestNotificationPermission } from '../../services/notificationService'
import { CURRENCIES } from '../../data/countries'
import { cn } from '../../utils/cn'

const SETTINGS_KEY = 'betvora_settings'

const DEFAULT_SETTINGS = {
  betNotifications: true,
  winNotifications: true,
  promoNotifications: true,
  browserNotifications: true,
  sound: true,
  compactMode: false,
}

function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-4',
        disabled && 'opacity-40',
      )}
    >
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        {description && <p className="mt-0.5 text-xs text-white/40">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-success' : 'bg-white/10',
          disabled && 'cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { currency, setCurrency } = useWallet()
  const { theme, toggleTheme } = useTheme()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [adConsent, setAdConsentState] = useState(() => {
    const consent = getAdConsent()
    return {
      granted: Boolean(consent && consent.granted === true),
      personalized: Boolean(consent && consent.granted === true && consent.personalized === true),
    }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) })
    } catch {
      /* defaults */
    }
  }, [])

  const updateAdConsent = (patch) => {
    const next = { ...adConsent, ...patch }
    if (!next.granted) next.personalized = false
    setAdConsentState(next)
    setAdConsent({ granted: next.granted, personalized: next.personalized })
  }

  const update = (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  }

  const changeCurrency = async (value) => {
    try {
      await setCurrency(value)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Settings</h1>

      <Card className="divide-y divide-white/5">
        <div className="px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/50">
            <Bell className="h-4 w-4 text-gold" />
            Notifications
          </p>
        </div>
        <Toggle
          checked={settings.betNotifications}
          onChange={(v) => update({ betNotifications: v })}
          label="Bet confirmations"
        />
        <Toggle
          checked={settings.winNotifications}
          onChange={(v) => update({ winNotifications: v })}
          label="Wins & wallet credits"
        />
        <Toggle
          checked={settings.promoNotifications}
          onChange={(v) => update({ promoNotifications: v })}
          label="Promotions"
        />
        <Toggle
          checked={settings.browserNotifications}
          onChange={async (v) => {
            if (v) {
              const permission = await requestNotificationPermission()
              if (permission !== 'granted') {
                update({ browserNotifications: false })
                window.alert('Browser notifications were not allowed. Enable them in your browser settings.')
                return
              }
            }
            update({ browserNotifications: v })
          }}
          label="Browser push notifications"
          description="Uses your device's default notification sound."
        />
      </Card>

      <Card className="divide-y divide-white/5">
        <div className="px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/50">
            <Wallet className="h-4 w-4 text-gold" />
            Wallet
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-bold text-white">Display currency</p>
            <p className="mt-0.5 text-xs text-white/40">Demo balance formatting</p>
          </div>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => changeCurrency(e.target.value)}
              className="appearance-none rounded-xl border border-white/10 bg-navy-800 py-2.5 pl-4 pr-9 text-xs font-bold text-white outline-none focus:border-gold"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-white/5">
        <div className="px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/50">
            <SettingsIcon className="h-4 w-4 text-gold" />
            Experience
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-bold text-white">Appearance</p>
            <p className="mt-0.5 text-xs text-white/40">
              {theme === 'dark' ? 'Dark — royal navy theme' : 'Light — bright theme'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-black text-gold transition-colors hover:bg-gold/20"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        <Toggle
          checked={settings.sound}
          onChange={(v) => update({ sound: v })}
          label="Sound effects"
        />
        <Toggle
          checked={settings.compactMode}
          onChange={(v) => update({ compactMode: v })}
          label="Compact match cards"
        />
      </Card>

      <Card className="divide-y divide-white/5">
        <div className="px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/50">
            <Megaphone className="h-4 w-4 text-gold" />
            Ads & Privacy
          </p>
        </div>
        <Toggle
          checked={adConsent.granted}
          onChange={(v) => updateAdConsent({ granted: v })}
          label="Allow ads"
          description="Google ads only ever appear on pages with real content, and never on the bet slip, notifications, or sign-in screens."
        />
        <Toggle
          checked={adConsent.personalized}
          onChange={(v) => updateAdConsent({ personalized: v })}
          label="Personalized ads"
          disabled={!adConsent.granted}
          description={adConsent.personalized ? 'Ads matched to your activity.' : 'Off — only non-personalized ads will serve.'}
        />
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
        <p className="text-xs leading-relaxed text-white/40">
          Settings are stored in your account and synced with Firebase.
        </p>
      </Card>
    </div>
  )
}
