import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Trash2, ReceiptText, Info } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import BetSlipItem from '../../components/betting/BetSlipItem'
import BookingCodePanel from '../../components/betting/BookingCodePanel'
import EmptyState from '../../components/common/EmptyState'
import Tabs from '../../components/common/Tabs'
import { useBetSlip } from '../../context/BetSlipContext'
import { useWallet } from '../../context/WalletContext'
import { placeBet } from '../../services/betService'
import { loadBookingCode } from '../../services/bookingCodeService'
import { formatCurrency, formatOdds, currencySymbol } from '../../utils/format'

const BET_MODES = ['Singles', 'Multiple', 'System']

function combinations(items, size) {
  const result = []
  const current = []
  function visit(start) {
    if (current.length === size) {
      result.push([...current])
      return
    }
    for (let i = start; i < items.length; i += 1) {
      current.push(items[i])
      visit(i + 1)
      current.pop()
    }
  }
  visit(0)
  return result
}

export default function BetSlipPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selections, stake, setStake, totalOdds, potentialWin, removeSelection, clearSlip, loadSelections } =
    useBetSlip()
  const { balance, currency, refresh } = useWallet()
  const [mode, setMode] = useState('Multiple')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // A shared link (/bet-slip?code=XXXX) loads the slip automatically.
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) return undefined
    let active = true
    ;(async () => {
      try {
        const result = await loadBookingCode(code)
        if (!active) return
        loadSelections(result.selections)
        setNotice(
          `Booking code ${result.code} loaded — set your own stake.`,
        )
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) navigate('/bet-slip', { replace: true })
      }
    })()
    return () => {
      active = false
    }
    // Only run for the code present when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isMultiple = mode === 'Multiple' || selections.length === 1
  const multipleTotalOdds = totalOdds
  const singlesTotalStake = Number(stake || 0) * selections.length
  const singlesPotential = selections.reduce((acc, s) => acc + (Number(stake || 0) * Number(s.odds)), 0)
  const system = mode === 'System'

  const handlePlaceBet = async () => {
    setError('')
    setLoading(true)
    try {
      if (system) {
        const combos = []
        for (let size = 2; size <= selections.length; size += 1) {
          combos.push(...combinations(selections, size))
        }
        if (combos.length === 0) {
          throw new Error('Add at least two selections for a system bet.')
        }
        const perStake = Number(stake || 0) / combos.length
        if (!perStake || perStake <= 0) throw new Error('Enter a valid stake.')
        for (const combo of combos) {
          await placeBet({ selections: combo, stake: perStake })
        }
      } else if (isMultiple) {
        await placeBet({ selections, stake })
      } else {
        for (const s of selections) {
          await placeBet({ selections: [s], stake })
        }
      }
      await refresh()
      clearSlip()
      navigate('/my-bets')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (selections.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 lg:max-w-4xl">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Bet Slip</h1>

        {notice && (
          <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            {notice}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <EmptyState
          icon={ReceiptText}
          title="Your bet slip is empty"
          text="Tap any odds on a match to build a single or multiple — or load a shared booking code."
        />

        <BookingCodePanel onLoad={loadSelections} />

        <Button size="lg" fullWidth onClick={() => navigate('/sports')}>
          Browse Matches
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 lg:max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Bet Slip</h1>
        <button
          onClick={clearSlip}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/40 transition-colors hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      {notice && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {notice}
        </p>
      )}

      {selections.length > 1 && <Tabs tabs={BET_MODES} active={mode} onChange={setMode} />}

      <div className="space-y-3">
        {selections.map((selection) => (
          <BetSlipItem
            key={`${selection.matchId}-${selection.market}-${selection.outcomeKey}`}
            selection={selection}
            onRemove={() => removeSelection(selection)}
          />
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-bold uppercase tracking-wide text-white/50">
            {isMultiple
              ? selections.length === 1
                ? 'Single'
                : `${selections.length}-fold Multiple`
              : `${selections.length} Singles`}
          </span>
          <span className="text-xs text-white/40">{selections.length} selection{selections.length > 1 ? 's' : ''}</span>
        </div>

        {system && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/5 p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <p className="text-sm leading-relaxed text-white/60">
                System bet: all combinations of your selections will be placed and the stake
                split evenly across them ({combinations(selections, 2).length +
                  (selections.length >= 3 ? combinations(selections, 3).length : 0)}+
                combinations).
              </p>
            </div>
          </div>
        )}
        <>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-white/70">Stake</label>
              <div className="flex w-40 items-center gap-2 rounded-xl border border-white/10 bg-navy-800 px-3 py-2.5 focus-within:border-gold">
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

            <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm">
              {isMultiple ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/50">Total Odds</span>
                    <span className="font-black text-gold">{formatOdds(multipleTotalOdds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Potential Win</span>
                    <span className="font-black text-white">{formatCurrency(potentialWin, currency)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/50">Total Stake</span>
                    <span className="font-black text-white">{formatCurrency(singlesTotalStake, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Potential Win (all singles)</span>
                    <span className="font-black text-white">{formatCurrency(singlesPotential, currency)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-white/50">Balance after</span>
                <span className="font-bold text-white/70">
                  {formatCurrency(
                    balance -
                      (isMultiple ? Number(stake || 0) : singlesTotalStake),
                    currency,
                  )}
                </span>
              </div>
            </div>
          </>

        {error && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <Button
          size="lg"
          fullWidth
          className="mt-5"
          loading={loading}
          disabled={!stake || stake <= 0}
          onClick={handlePlaceBet}
        >
          {system ? 'System bets — coming soon' : isMultiple ? 'Place Bet' : `Place ${selections.length} Singles`}
        </Button>
      </Card>

      <BookingCodePanel selections={selections} onLoad={loadSelections} />
    </div>
  )
}
