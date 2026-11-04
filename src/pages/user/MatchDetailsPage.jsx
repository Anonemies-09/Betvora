import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import OddsButton from '../../components/sports/OddsButton'
import TeamCrest from '../../components/sports/TeamCrest'
import SectionHeading from '../../components/common/SectionHeading'
import EmptyState from '../../components/common/EmptyState'
import AdSlot from '../../components/common/AdSlot'
import { LEAGUES, MARKET_GROUPS, OUTCOME_LABELS, OUTCOME_NAMES } from '../../data/demoData'
import { useCatalogue } from '../../hooks/useCatalogue'
import { formatDate, formatTime, flagEmoji } from '../../utils/format'
import { cn } from '../../utils/cn'

function OutcomeRow({ label, options }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="w-2/5 shrink-0 truncate text-sm font-medium text-white/70">{label}</span>
      <div className="flex flex-1 justify-end gap-1.5">
        {options.map((option) => (
          <OddsButton key={option.outcome} {...option} />
        ))}
      </div>
    </div>
  )
}

export default function MatchDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const match = useCatalogue().find((m) => m.id === id)

  if (!match) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState title="Match not found" text="This match may have been removed." />
      </div>
    )
  }

  const league = LEAGUES.find((l) => l.id === match.leagueId)
  const groups = MARKET_GROUPS.filter((g) => match.markets?.[g.id])

  const isScoreKey = (key) => /^\d+-\d+$/.test(key)

  const rowLabel = (group, outcomeKey) => {
    if (group.id === 'winner') {
      if (outcomeKey === 'home') return match.homeTeam
      if (outcomeKey === 'away') return match.awayTeam
      return 'Draw'
    }
    return OUTCOME_NAMES[outcomeKey] || outcomeKey
  }

  const shortLabel = (outcomeKey) => OUTCOME_LABELS[outcomeKey] || outcomeKey

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-semibold text-white/50 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <Card className="p-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/40">
          <span>
            {flagEmoji(league?.flag)} {league?.name}
          </span>
          {match.isLive ? (
            <Badge tone="green" dot>Live {match.minute}&apos;</Badge>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(match.startTime)} • {formatTime(match.startTime)}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <div className="mx-auto mb-2">
              <TeamCrest name={match.homeTeam} size={56} />
            </div>
            <p className="text-base font-bold text-white">{match.homeTeam}</p>
          </div>
          <div className="text-center">
            {match.isLive ? (
              <span className="rounded-lg bg-success/15 px-3 py-1.5 text-xl font-black text-success">
                {match.score.home} - {match.score.away}
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-widest text-white/30">vs</span>
            )}
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2">
              <TeamCrest name={match.awayTeam} size={56} />
            </div>
            <p className="text-base font-bold text-white">{match.awayTeam}</p>
          </div>
        </div>
      </Card>

      {groups.map((group) => {
        const market = match.markets[group.id]
        const outcomes = Object.entries(market)
        const isGrid = group.id === 'correctScore' || outcomes.every(([key]) => isScoreKey(key))
        return (
          <Card key={group.id} className="p-4">
            <SectionHeading title={group.name} />
            {isGrid ? (
              <div className="grid grid-cols-3 gap-1.5">
                {outcomes.map(([outcomeKey, odds]) => (
                  <OddsButton
                    key={outcomeKey}
                    match={match}
                    market={group.short}
                    outcome={outcomeKey}
                    outcomeKey={outcomeKey}
                    odds={odds}
                    className={cn('py-2.5')}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {outcomes.map(([outcomeKey, odds]) => (
                  <OutcomeRow
                    key={outcomeKey}
                    label={rowLabel(group, outcomeKey)}
                    options={[
                      {
                        match,
                        market: group.short,
                        outcome: shortLabel(outcomeKey),
                        outcomeKey,
                        odds,
                      },
                    ]}
                  />
                ))}
              </div>
            )}
          </Card>
        )
      })}

      <AdSlot slot="match_bottom" className="mx-auto w-full max-w-2xl" />
    </div>
  )
}
