import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ExternalLink, Info } from 'lucide-react'
import Button from '../common/Button'
import BetSlipItem from './BetSlipItem'
import EmptyState from '../common/EmptyState'
import { useBetSlip } from '../../context/BetSlipContext'
import { useWallet } from '../../context/WalletContext'
import { placeBet } from '../../services/betService'
import { formatCurrency, formatOdds, currencySymbol } from '../../utils/format'

export default function BetSlipCard({ className }) {
  const navigate = useNavigate()
  const { selections, stake, setStake, totalOdds, potentialWin, removeSelection, clearSlip } =
    useBetSlip()
  const { currency, refresh } = useWallet()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePlaceBet = async () => {
    setError('')
    setLoading(true)
    try {
      await placeBet({ selections, stake })
      await refresh()
      clearSlip()
      navigate('/my-bets')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div
      className={`rounded-lg border border-white/5 bg-royal ${className || ''}`}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Bet Slip</h2>
          {selections.length > 0 && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-white">
              {selections.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selections.length > 0 && (
            <button
              onClick={clearSlip}
              className="flex items-center gap-1 text-xs font-semibold text-white/40 transition-colors hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <Link
            to="/bet-slip"
            className="flex items-center gap-1 text-xs font-semibold text-gold transition-colors hover:text-gold-600"
          >
            Full slip
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {selections.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            title="Your slip is empty"
            text="Tap any odds to build a bet."
            compact
          />
        </div>
      ) : (
        <div className="p-4">
          <div className="space-y-2">
            {selections.map((selection) => (
              <BetSlipItem
                key={`${selection.matchId}-${selection.market}-${selection.outcomeKey}`}
                selection={selection}
                onRemove={() => removeSelection(selection)}
                compact
              />
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Total Odds</span>
              <span className="font-black text-gold">{formatOdds(totalOdds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Potential Win</span>
              <span className="font-black text-white">
                {formatCurrency(potentialWin, currency)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-white/70">Stake</label>
            <div className="flex w-32 items-center gap-2 rounded-md border border-white/10 bg-navy px-2.5 py-2 focus-within:border-gold">
              <span className="text-gold">{currencySymbol(currency)}</span>
              <input
                type="number"
                min="0"
                value={stake || ''}
                onChange={(e) => setStake(Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-transparent text-right text-sm font-bold text-white outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <Button
            size="md"
            fullWidth
            className="mt-3"
            loading={loading}
            disabled={!stake || stake <= 0}
            onClick={handlePlaceBet}
          >
            {selections.length === 1
              ? 'Place Bet'
              : `Place ${selections.length}-fold Bet`}
          </Button>

          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-white/35">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Odds and results are for demonstration only.
          </p>
        </div>
      )}
    </div>
  )
}
