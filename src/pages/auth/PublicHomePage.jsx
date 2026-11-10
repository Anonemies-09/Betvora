import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Button from '../../components/common/Button'
import Logo from '../../components/common/Logo'
import Badge from '../../components/common/Badge'
import TeamCrest from '../../components/sports/TeamCrest'
import { SPORTS, LEAGUES } from '../../data/demoData'
import { useCatalogue } from '../../hooks/useCatalogue'
import { formatTime, formatOdds, flagEmoji } from '../../utils/format'

function OddsCell({ label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-md border border-white/10 bg-navy px-1.5 py-1 text-center transition-colors hover:border-gold hover:bg-gold/10"
    >
      <span className="block truncate text-[9px] font-semibold uppercase tracking-wider text-white/40 group-hover:text-gold">
        {label}
      </span>
      <span className="text-sm font-black text-white group-hover:text-gold">
        {formatOdds(value)}
      </span>
    </button>
  )
}

function ScoreboardRow({ match, onSelect }) {
  const winner = match.markets.winner
  const hasDraw = 'draw' in winner
  const homeLeader = match.score?.home > match.score?.away
  const awayLeader = match.score?.away > match.score?.home
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className="w-full cursor-pointer rounded-lg border border-white/5 bg-royal px-3.5 py-3 text-left transition-colors hover:border-gold/50"
    >
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
        <span>{match.isLive ? 'Live' : formatTime(match.startTime)}</span>
        <span className="truncate">{flagEmoji(LEAGUES.find((l) => l.id === match.leagueId)?.flag)}</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <TeamCrest name={match.homeTeam} size={28} />
          <span className={`truncate text-sm font-bold ${homeLeader ? 'text-white' : 'text-white/70'}`}>
            {match.homeTeam}
          </span>
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-black tabular-nums ${
            match.isLive ? 'bg-success/15 text-success' : 'text-white/60'
          }`}
        >
          {match.isLive ? `${match.score.home} - ${match.score.away}` : 'vs'}
        </span>
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className={`truncate text-right text-sm font-bold ${awayLeader ? 'text-white' : 'text-white/70'}`}>
            {match.awayTeam}
          </span>
          <TeamCrest name={match.awayTeam} size={28} />
        </span>
      </div>
      <div
        className={`mt-2.5 grid gap-1.5 ${hasDraw ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        <OddsCell label="1" value={winner.home} onClick={onSelect} />
        {hasDraw && <OddsCell label="X" value={winner.draw} onClick={onSelect} />}
        <OddsCell label="2" value={winner.away} onClick={onSelect} />
      </div>
    </div>
  )
}

export default function PublicHomePage() {
  const navigate = useNavigate()
  const catalogue = useCatalogue()
  const liveMatches = catalogue.filter((m) => m.isLive)
  const featuredMatches = catalogue.filter((m) => m.featured).slice(0, 3)
  const heroMatch = liveMatches[0] || featuredMatches[0]
  const heroWinner = heroMatch?.markets?.winner
  const heroHasDraw = heroWinner ? 'draw' in heroWinner : false
  const heroMarketCount = heroMatch
    ? Object.values(heroMatch.markets).reduce((acc, group) => acc + Object.keys(group).length, 0)
    : 0
  const leagueCount = LEAGUES.length

  const goLogin = (from = '/home') => navigate('/login', { state: { from } })
  const openMatch = (id) => goLogin(`/match/${id}`)

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Public header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-navy/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="BETVORA home">
            <Logo size={34} />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/55 md:flex">
            <Link to="/sports" className="transition-colors hover:text-white">
              Sports
            </Link>
            <Link to="/in-play" className="transition-colors hover:text-white">
              In-Play
            </Link>
            <Link to="/promotions" className="transition-colors hover:text-white">
              Promotions
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate('/onboarding')}>
              Join free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-white/5">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-gold">
              Welcome offer - 100% bonus on first deposit
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl">
              Know the game?
              <br />
              <span className="text-gold">Prove it.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
              Real odds on the world's biggest leagues. Deposit, play and win real money. 18+. Play responsibly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('/onboarding')}>
                Claim the bonus <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => goLogin('/sports')}>
                See today&apos;s odds
              </Button>
            </div>
            <p className="mt-6 text-xs font-medium text-white/35">
              Real money betting. Deposit via Telecel Cash.
            </p>
          </div>

          {heroMatch && (
            <div className="relative">
              <div className="rounded-lg border border-white/10 bg-royal p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/40">
                    {flagEmoji(LEAGUES.find((l) => l.id === heroMatch.leagueId)?.flag)}
                    {LEAGUES.find((l) => l.id === heroMatch.leagueId)?.name}
                  </span>
                  {heroMatch.isLive && (
                    <Badge tone="green" dot>
                      Live {heroMatch.minute}&apos;
                    </Badge>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2.5">
                      <TeamCrest name={heroMatch.homeTeam} size={34} />
                      <span className="truncate text-lg font-black">{heroMatch.homeTeam}</span>
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                      Home
                    </p>
                  </div>
                  <div className="text-center">
                    {heroMatch.isLive ? (
                      <>
                        <p className="text-3xl font-black tabular-nums text-success">
                          {heroMatch.score?.home ?? 0} : {heroMatch.score?.away ?? 0}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/30">
                          {heroMatch.minute}&apos;
                        </p>
                      </>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-widest text-white/30">
                        vs
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="flex items-center justify-end gap-2.5">
                      <span className="truncate text-lg font-black">{heroMatch.awayTeam}</span>
                      <TeamCrest name={heroMatch.awayTeam} size={34} />
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                      Away
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <OddsCell label={heroMatch.homeTeam} value={heroMatch.markets.winner.home} onClick={() => openMatch(heroMatch.id)} />
                  {heroHasDraw && (
                    <OddsCell label="Draw" value={heroMatch.markets.winner.draw} onClick={() => openMatch(heroMatch.id)} />
                  )}
                  <OddsCell label={heroMatch.awayTeam} value={heroMatch.markets.winner.away} onClick={() => openMatch(heroMatch.id)} />
                </div>

                <button
                  type="button"
                  onClick={() => openMatch(heroMatch.id)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 border-t border-white/5 pt-4 text-sm font-bold text-gold transition-colors hover:text-gold-600"
                >
                  +{heroMarketCount} markets on this match <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live scoreboard strip */}
      {liveMatches.length > 0 && (
        <section className="border-b border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                On the pitch now
              </h2>
              <button
                type="button"
                onClick={() => goLogin('/in-play')}
                className="text-xs font-bold text-gold hover:text-gold-600"
              >
                All in-play →
              </button>
            </div>
            <div className="no-scrollbar -mx-4 grid grid-flow-col auto-cols-[16rem] gap-3 overflow-x-auto px-4 pb-1 sm:auto-cols-[18rem]">
              {liveMatches.map((m) => (
                <ScoreboardRow key={m.id} match={m} onSelect={() => openMatch(m.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-6xl space-y-20 px-4 pb-24">
        {/* Sports */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">Markets</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">Pick your game</h2>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goLogin('/sports')}
                className="flex items-center gap-2.5 rounded-md border border-white/10 bg-royal px-4 py-2.5 text-sm font-bold text-white/75 transition-colors hover:border-gold/60 hover:text-gold"
              >
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.accent }} />
                {s.name}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-white/35">
            From the Premier League to the Champions League — every major competition, one slip.
          </p>
        </section>

        {/* Featured matches */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">Tonight&apos;s picks</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">Featured matches</h2>
            </div>
            <button
              type="button"
              onClick={() => goLogin('/sports')}
              className="hidden text-sm font-bold text-gold hover:text-gold-600 sm:block"
            >
              Full sportsbook →
            </button>
          </div>
          <div className="mt-7 grid gap-3 lg:grid-cols-3">
            {featuredMatches.map((m) => (
              <ScoreboardRow key={m.id} match={m} onSelect={() => openMatch(m.id)} />
            ))}
          </div>
        </section>

        {/* Leagues */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">Where you&apos;ll be betting</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">{LEAGUES.length} leagues, one app</h2>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {LEAGUES.map((league) => (
              <button
                key={league.id}
                type="button"
                onClick={() => goLogin('/sports')}
                className="group flex items-center gap-3 border-b border-white/5 pb-3 text-left"
              >
                <span className="text-lg leading-none">{flagEmoji(league.flag)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white/80 group-hover:text-gold">
                    {league.name}
                  </span>
                  <span className="block text-[11px] font-semibold text-white/30">
                    {league.country}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">How it works</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Three steps.
                <br />
                Zero excuses.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                No card details, no ID upload, no phone verification. You can be in your
                first live market in under a minute.
              </p>
            </div>
            <div className="space-y-0">
              {[
                {
                  n: '01',
                  t: 'Open a free account',
                  d: "Email and a password. That's it - your account is ready the moment you sign up.",
                },
                {
                  n: '02',
                  t: 'Build your slip',
                  d: `Tap odds across ${leagueCount} leagues and stack them — a straight single or a five-match multiple, your call.`,
                },
                {
                  n: '03',
                  t: 'Watch it pay out',
                  d: 'Follow live scores, watch your balance swing with every goal, and collect the moment you’re ahead.',
                },
              ].map((s) => (
                <div key={s.n} className="flex gap-5 border-t border-white/5 py-6">
                  <span className="font-black text-gold">{s.n}</span>
                  <div>
                    <h3 className="font-black">{s.t}</h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/50">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* CTA */}
        <section className="grid overflow-hidden rounded-lg border border-white/10 bg-royal sm:grid-cols-[1.2fr_0.8fr]">
          <div className="p-8 sm:p-12">
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Your first bet is on us.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
              Join in under a minute, get a 100% match bonus on your first deposit, and go straight at tonight's fixtures.
            </p>
            <Button size="lg" className="mt-8" onClick={() => navigate('/onboarding')}>
              Start betting free <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-4 text-xs text-white/30">18+. Real money. Please play responsibly.</p>
          </div>
          <div className="flex items-center justify-center border-t border-white/10 bg-royal/40 p-8 sm:border-l sm:border-t-0">
            <div className="text-center">
              <p className="text-5xl font-black text-gold">100%</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                Welcome bonus
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo size={30} />
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-white/45">
              <Link to="/login" className="transition-colors hover:text-white">Log in</Link>
              <Link to="/onboarding" className="transition-colors hover:text-white">Sign up</Link>
              <Link to="/sports" className="transition-colors hover:text-white">Sports</Link>
              <Link to="/in-play" className="transition-colors hover:text-white">In-Play</Link>
              <Link to="/promotions" className="transition-colors hover:text-white">Promotions</Link>
            </nav>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-center text-xs text-white/30 sm:flex-row sm:text-left">
            <p>BETVORA is live. Real money betting. 18+. Play responsibly.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/terms" className="transition-colors hover:text-white">Terms</Link>
              <Link to="/privacy" className="transition-colors hover:text-white">Privacy</Link>
              <Link to="/cookies" className="transition-colors hover:text-white">Cookies</Link>
              <p>© {new Date().getFullYear()} BETVORA. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
