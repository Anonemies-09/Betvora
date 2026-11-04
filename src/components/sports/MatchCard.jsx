import Card from '../common/Card'
import Badge from '../common/Badge'
import OddsButton from './OddsButton'
import TeamCrest from './TeamCrest'
import { LEAGUES } from '../../data/demoData'
import { formatTime, flagEmoji } from '../../utils/format'
import { cn } from '../../utils/cn'

export default function MatchCard({ match, onClick, showLeague = true }) {
  const league = LEAGUES.find((l) => l.id === match.leagueId)
  const winner = match.markets?.winner
  const hasDraw = winner ? 'draw' in winner : false
  const marketCount = Object.values(match.markets || {}).reduce(
    (acc, group) => acc + Object.keys(group).length,
    0,
  )

  const winnerButtons = winner
    ? [
        { outcome: match.homeTeam, outcomeKey: 'home', odds: winner.home },
        ...(hasDraw ? [{ outcome: 'Draw', outcomeKey: 'draw', odds: winner.draw }] : []),
        { outcome: match.awayTeam, outcomeKey: 'away', odds: winner.away },
      ]
    : []

  return (
    <Card hoverable onClick={onClick} className="overflow-hidden">
      {showLeague && league && (
        <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
          <span>{flagEmoji(league.flag)}</span>
          <span>{league.name}</span>
          <span className="mx-1 text-white/15">•</span>
          <span>{league.country}</span>
          {match.isLive && (
            <span className="ml-auto">
              <Badge tone="green" dot>
                Live {match.minute}&apos;
              </Badge>
            </span>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm font-bold">
          <span className="flex min-w-0 items-center gap-2">
            <TeamCrest name={match.homeTeam} size={30} />
            <span className={cn('truncate', match.score?.home > match.score?.away && 'text-gold')}>
              {match.homeTeam}
            </span>
          </span>
          <span className="text-xs text-white/40">
            {match.isLive ? (
              <span className="rounded-md bg-success/15 px-2 py-1 font-black text-success">
                {match.score.home} - {match.score.away}
              </span>
            ) : (
              formatTime(match.startTime)
            )}
          </span>
          <span className="flex min-w-0 items-center justify-end gap-2">
            <span className={cn('truncate text-right', match.score?.away > match.score?.home && 'text-gold')}>
              {match.awayTeam}
            </span>
            <TeamCrest name={match.awayTeam} size={30} />
          </span>
        </div>
      </div>
      <div
        className={cn(
          'grid gap-1.5 border-t border-white/5 px-4 py-2.5',
          hasDraw ? 'grid-cols-3' : 'grid-cols-2',
        )}
      >
        {winnerButtons.map((btn) => (
          <OddsButton
            key={btn.outcomeKey}
            match={match}
            market={hasDraw ? '1X2' : 'Winner'}
            outcome={btn.outcome}
            outcomeKey={btn.outcomeKey}
            odds={btn.odds}
          />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-1.5 text-[11px] font-semibold text-white/35">
        <span className="uppercase tracking-wide">Odds are for demonstration</span>
        <span className="text-gold">+{marketCount} markets</span>
      </div>
    </Card>
  )
}
