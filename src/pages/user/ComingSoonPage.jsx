import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Button from '../../components/common/Button'

const SECTIONS = {
  casino: {
    title: 'Casino',
    heading: 'The casino floor is being set up',
    text: 'Slot machines, table games and live dealer rooms are next on the BETVORA roadmap. When they open, they will run on the same wallet — no extra sign-up.',
    features: [
      {
        name: 'Slots',
        note: 'Classic fruit machines and progressive jackpots with instant spins.',
      },
      {
        name: 'Blackjack',
        note: 'Single and multi-hand tables with doubling, splitting and insurance rules.',
      },
      {
        name: 'Roulette',
        note: 'European and American wheels with RNG spins and full bet layout.',
      },
      {
        name: 'Live dealer',
        note: 'Streamed blackjack and roulette with real croupiers in the full release.',
      },
    ],
  },
  virtuals: {
    title: 'Virtuals',
    heading: 'Virtual racing is still in the stables',
    text: 'Simulated sport runs faster than real time, with a result every few minutes. The full schedule of racing codes is coming to this section.',
    features: [
      {
        name: 'Virtual football',
        note: 'Five-a-side and eleven-a-side matches with results every few minutes.',
      },
      {
        name: 'Horse racing',
        note: '16-runner fields with odds that refresh between races.',
      },
      {
        name: 'Greyhounds',
        note: 'Six-dog races with trap numbers and fixed win/each-way markets.',
      },
      {
        name: 'Speedway',
        note: 'Motorcycle and stock-car simulations on quick-fire race cards.',
      },
    ],
  },
}

export default function ComingSoonPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const key = pathname.split('/').pop()
  const section = SECTIONS[key] || {
    title: key.charAt(0).toUpperCase() + (key || '').slice(1),
    heading: 'This section is being built',
    text: 'It is on the BETVORA roadmap and will open in a future release.',
    features: [],
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-semibold text-white/50 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-2xl border border-white/5 bg-royal p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-gold">{section.title}</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">{section.heading}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50">{section.text}</p>
      </div>

      {section.features.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {section.features.map((feature) => (
            <div
              key={feature.name}
              className="rounded-2xl border border-white/5 bg-royal p-5"
            >
              <p className="text-sm font-black uppercase tracking-wider text-white">{feature.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">{feature.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-widest text-gold">While you wait</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55">
          Sports markets are live right now. There is a full card of football across Africa and
          Europe today, plus in-play action with cash-out — all on your BETVORA wallet.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/sports')}>Browse today&apos;s odds</Button>
          <Button variant="outline" onClick={() => navigate('/in-play')}>
            Live in-play action
          </Button>
        </div>
      </div>
    </div>
  )
}
