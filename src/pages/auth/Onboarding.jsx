import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import { cn } from '../../utils/cn'

const SLIDES = [
  {
    kicker: '01',
    title: 'Bet smarter on the',
    highlight: 'leagues you follow.',
    text: 'English Premier League, La Liga, Serie A, Ligue 1 and more — with live odds and boosted multiples on the biggest fixtures.',
  },
  {
    kicker: '02',
    title: 'A bet slip that',
    highlight: 'gets out of your way.',
    text: 'Tap any odds to build a single or accumulator. Set a stake, check your potential win, and place the bet in seconds.',
  },
  {
    kicker: '03',
    title: 'Demo wallet.',
    highlight: 'Real betting flow.',
    text: 'Every feature — deposits, in-play, promotions, payouts — runs on free demo money. Nothing is real, nothing is at risk.',
  },
]

export default function Onboarding() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  const next = () => {
    if (isLast) return
    setIndex((i) => i + 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy">
      <div className="flex items-center justify-between px-6 py-6">
        <Logo size={30} />
        <Link to="/login" className="text-sm font-semibold text-white/50 hover:text-gold">
          Skip
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6">
        <div key={index} className="animate-fade-up">
          <span className="text-xs font-black tracking-[0.3em] text-gold">{slide.kicker}</span>
          <h1 className="mt-3 max-w-sm text-4xl font-black leading-tight tracking-tight text-white">
            {slide.title}{' '}
            <span className="text-gold-gradient">{slide.highlight}</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">{slide.text}</p>

          <div className="mt-8 max-w-sm border-t border-white/5 pt-4 text-xs text-white/30">
            <p className="font-semibold uppercase tracking-widest text-white/40">
              On this demo
            </p>
            <ul className="mt-3 space-y-2">
              {[
                'Live in-play markets with 1X2, double chance, goals & correct score',
                'Instant bets on demo balance — no deposits needed to try',
                'Admin console to settle matches and manage promotions',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-white/45">
                  <span className="mt-1.5 h-1 w-3 shrink-0 bg-gold" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === index ? 'w-8 bg-gold' : 'w-2 bg-white/20',
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 px-6 pb-10">
        <Button size="lg" fullWidth onClick={next}>
          {isLast ? 'Get Started' : 'Next'}
        </Button>
        <Link
          to="/register"
          className="block text-center text-sm font-semibold text-white/50 transition-colors hover:text-gold"
        >
          Create a free account
        </Link>
        <p className="text-center text-xs text-white/30">
          Demo product — no real money involved.
        </p>
      </div>
    </div>
  )
}
