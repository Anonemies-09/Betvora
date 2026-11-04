import { useNavigate } from 'react-router-dom'
import MatchCard from '../../components/sports/MatchCard'
import EmptyState from '../../components/common/EmptyState'
import SectionHeading from '../../components/common/SectionHeading'
import Button from '../../components/common/Button'
import AdSlot from '../../components/common/AdSlot'
import { useCatalogue } from '../../hooks/useCatalogue'

export default function InPlayPage() {
  const navigate = useNavigate()
  const live = useCatalogue().filter((m) => m.isLive)

  return (
    <div className="mx-auto max-w-3xl lg:max-w-4xl">
      <h1 className="mb-6 text-2xl font-black uppercase tracking-tight text-white">In-Play</h1>
      {live.length === 0 ? (
        <EmptyState
          title="No matches live right now"
          text="Fixtures go live here the moment the first ball is kicked. Check back around match time, or back one of today's upcoming games."
          action={<Button onClick={() => navigate('/sports')}>Browse upcoming fixtures</Button>}
        />
      ) : (
        <div className="space-y-3">
          <SectionHeading title={`${live.length} Live ${live.length === 1 ? 'Match' : 'Matches'}`} />
          {live.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onClick={() => navigate(`/match/${match.id}`)}
            />
          ))}
          <AdSlot slot="inplay_bottom" className="mx-auto w-full max-w-2xl" />
        </div>
      )}
    </div>
  )
}
