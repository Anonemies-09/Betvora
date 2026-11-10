import { useState } from 'react'
import { CircleHelp, ChevronDown, Mail, MessageCircle } from 'lucide-react'
import Card from '../../components/common/Card'
import { cn } from '../../utils/cn'

const FAQS = [
  {
    q: 'Is this real money?',
    a: 'Yes. BETVORA is a live betting platform. Wallet balances and bets use real money.',
  },
  {
    q: 'How do I place a bet?',
    a: 'Tap any odds on a match to add it to your bet slip, enter a stake, and press Place Bet. Your balance updates instantly.',
  },
  {
    q: 'When does my bet settle?',
    a: 'An admin settles matches through the console. Once the match ends, your bet is marked Won, Lost or Cancelled automatically.',
  },
  {
    q: 'What happens if a match is voided?',
    a: 'Your stake is refunded to your wallet and the bet is marked Cancelled.',
  },
  {
    q: 'How does verification work?',
    a: 'Complete the verification form under Profile → Verification to start betting.',
  },
]

export default function SupportPage() {
  const [open, setOpen] = useState(0)

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <h1 className="text-2xl font-black uppercase tracking-tight text-white">Help & Support</h1>

      <Card className="divide-y divide-white/5">
        {FAQS.map((faq, index) => (
          <div key={index}>
            <button
              onClick={() => setOpen(open === index ? -1 : index)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-white">
                <CircleHelp className="h-4.5 w-4.5 shrink-0 text-gold" />
                {faq.q}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-white/30 transition-transform',
                  open === index && 'rotate-180',
                )}
              />
            </button>
            {open === index && (
              <p className="px-4 pb-4 pl-[3.25rem] text-sm leading-relaxed text-white/50">
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </Card>

      <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
        <MessageCircle className="h-6 w-6 shrink-0 text-gold" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Still need help?</p>
          <p className="text-xs text-white/40">Reach our demo support team (email only).</p>
        </div>
        <a
          href="mailto:support@betvora.app"
          className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold-600"
        >
          <Mail className="h-4 w-4" />
          support@betvora.app
        </a>
      </Card>
    </div>
  )
}
