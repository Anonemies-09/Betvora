import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SportCategory from '../../components/sports/SportCategory'
import MatchCard from '../../components/sports/MatchCard'
import LeagueCard from '../../components/sports/LeagueCard'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import BetSlipCard from '../../components/betting/BetSlipCard'
import AdSlot from '../../components/common/AdSlot'
import { SPORTS, LEAGUES, MORE_SPORT_IDS } from '../../data/catalogue'
import { useCatalogue } from '../../hooks/useCatalogue'
import { CircleDot } from 'lucide-react'

const isToday = (t) => {
  const now = new Date()
  const d = new Date(t)
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const isTomorrow = (t) => {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const d = new Date(t)
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  )
}

export default function SportsPage() {
  const navigate = useNavigate()
  const { filterId } = useParams()
  const [filter, setFilter] = useState(filterId || 'all')
  const [status, setStatus] = useState('Featured')

  useEffect(() => {
    if (filterId) setFilter(filterId)
  }, [filterId])

  const sport = SPORTS.find((s) => s.id === filter)
  const isLeague = LEAGUES.some((l) => l.id === filter)
  const isMore = filter === 'more'
  const sportOfMatch = (m) => LEAGUES.find((l) => l.id === m.leagueId)?.sportId

  const matches = useCatalogue().filter((m) => {
    const byFilter =
      filter === 'all'
        ? true
        : isMore
          ? MORE_SPORT_IDS.includes(sportOfMatch(m))
          : isLeague
            ? m.leagueId === filter
            : sport
              ? sportOfMatch(m) === filter
              : true
    const byStatus =
      status === 'Featured'
        ? m.featured || m.isLive
        : status === 'Live'
          ? m.isLive
          : status === 'Today'
            ? isToday(m.startTime)
            : isTomorrow(m.startTime)
    return byFilter && byStatus
  })

  const sportLeagues = isMore
    ? LEAGUES.filter((l) => MORE_SPORT_IDS.includes(l.sportId))
    : sport
      ? LEAGUES.filter((l) => l.sportId === sport.id)
      : []

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none lg:px-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-[72px] space-y-1">
            <p className="px-2 pb-2 text-xs font-black uppercase tracking-wider text-white/40">
              Sports
            </p>
            <button
              onClick={() => setFilter('all')}
              className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-bold transition-colors ${
                filter === 'all'
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <CircleDot className="h-4 w-4" />
              All Sports
            </button>
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilter(s.id)}
                className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-bold transition-colors ${
                  filter === s.id
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <s.icon className="h-4 w-4" style={{ color: s.accent }} />
                {s.name}
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            {isLeague ? LEAGUES.find((l) => l.id === filter)?.name : sport?.name || 'Sports'}
          </h1>

          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
            <button
              onClick={() => setFilter('all')}
              className={`min-w-[72px] shrink-0 rounded-lg border px-3 py-3 text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-white/5 bg-royal text-white/70'
              }`}
            >
              All
            </button>
            {SPORTS.map((s) => (
              <SportCategory key={s.id} sport={s} active={filter === s.id} onSelect={setFilter} />
            ))}
          </div>

          {sportLeagues.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
              {sportLeagues.map((league) => (
                <LeagueCard
                  key={league.id}
                  league={league}
                  active={filter === league.id}
                  onSelect={setFilter}
                />
              ))}
            </div>
          )}

          <Tabs tabs={['Featured', 'Today', 'Tomorrow', 'Live']} active={status} onChange={setStatus} />

          {matches.length === 0 ? (
            <EmptyState
              title="No fixtures in this list yet"
              text="Try a different sport or time filter — new matches are added by the admin console."
            />
          ) : (
            <>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => navigate(`/match/${match.id}`)}
                  />
                ))}
              </div>
              <AdSlot slot="sports_list" className="mx-auto w-full max-w-2xl" />
            </>
          )}
        </div>

        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-[72px]">
            <BetSlipCard />
          </div>
        </aside>
      </div>
    </div>
  )
}
