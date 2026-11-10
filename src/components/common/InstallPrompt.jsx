import { useEffect, useState } from 'react'
import Button from './Button'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    const installed = () => setVisible(false)
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  if (!visible || !deferred) return null

  const install = async () => {
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferred(null)
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80">
      <div className="rounded-2xl border border-gold/30 bg-navy/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="text-sm font-black text-white">Install BETVORA</p>
        <p className="mt-1 text-xs text-white/60">
          Add the app to your home screen for faster access and a full-screen experience.
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={install} className="flex-1">
            Install
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setVisible(false)} className="flex-1">
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}