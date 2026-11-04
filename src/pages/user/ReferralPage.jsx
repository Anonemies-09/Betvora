import { useState } from 'react'
import { Copy, Check, Users, Share2 } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'

export default function ReferralPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const code = user?.referralCode || 'BV-CODE'
  const link = `https://betvora.app/?ref=${code}`

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">
        Referral Program
      </h1>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
            <Users className="h-5 w-5 text-gold" />
          </span>
          <h2 className="text-lg font-black text-white">Earn on every referral</h2>
        </div>
        <p className="mt-4 text-sm text-white/50">
          Share your code. When a friend joins and bets, you earn a bonus. (Demo — no real
          payouts.)
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-gold/40 bg-navy-800 p-4 text-center">
          <p className="text-3xl font-black tracking-widest text-gold">{code}</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => copy(code)}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
          <Button variant="secondary" onClick={() => copy(link)}>
            <Share2 className="h-4 w-4" />
            Copy Referral Link
          </Button>
        </div>
        <p className="mt-3 truncate text-xs text-white/30">{link}</p>
      </Card>
    </div>
  )
}
