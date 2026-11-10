import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import Button from '../../components/common/Button'
import { cn } from '../../utils/cn'

const SLIDES = [
  {
    kicker: '01',
    title: 'Bet smarter on the',
    highlight: 'leagues you follow.',
    text: 'English Premier League, La Liga, Serie A, Ligue 1 and more — with live odds and boosted multiples on the biggest fixtures.',
    image: '/images/onboard.jpg',
  },
  {
    kicker: '02',
    title: 'A bet slip that',
    highlight: 'gets out of your way.',
    text: 'Tap any odds to build a single or accumulator. Set a stake, check your potential win, and place the bet in seconds.',
    image: '/images/hero.jpg',
  },
  {
    kicker: '03',
    title: 'Play with confidence.',
    highlight: 'Win with style.',
    text: 'Deposits, in-play markets, promotions and payouts — all in one place, secured and lightning fast.',
    image: '/images/register.jpg',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  const next = () => {
    if (isLast) {
      navigate('/welcome', { replace: true })
      return
    }
    setIndex((i) => i + 1)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-navy">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={slide.image}
          alt=""
          className="h-full w-full object-cover opacity-40 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.25),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 py-6">
        <Logo size={32} />
        <Link to="/login" className="text-sm font-semibold text-white/70 hover:text-gold">
          Skip
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6">
        <div key={index} className="animate-fade-up max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-black tracking-[0.3em] text-gold">
            {slide.kicker} / {String(SLIDES.length).padStart(2, '0')}
          </span>
          <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-white">
            {slide.title}{' '}
            <span className="text-gold-gradient">{slide.highlight}</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/70">{slide.text}</p>

          <div className="mt-8 grid max-w-sm grid-cols-3 gap-3">
            {[
              { label: 'Live odds', value: '1000+' },
              { label: 'Markets', value: '50+' },
              { label: 'Payouts', value: 'Instant' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
              >
                <p className="text-lg font-black text-gold">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === index ? 'w-10 bg-gold' : 'w-2 bg-white/30',
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 space-y-3 px-6 pb-10">
        <Button size="lg" fullWidth onClick={next} className="shadow-gold">
          {isLast ? 'Get Started' : 'Continue'}
        </Button>
        <Link
          to="/register"
          className="block text-center text-sm font-semibold text-white/70 transition-colors hover:text-gold"
        >
          Create a free account
        </Link>
        <p className="text-center text-xs text-white/40">
          18+. Play responsibly. Real money betting.
        </p>
      </div>
    </div>
  )
}