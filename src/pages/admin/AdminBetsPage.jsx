import { useEffect, useMemo, useState } from 'react'
import { ReceiptText, Ban, Wallet, X, Plus } from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Tabs from '../../components/common/Tabs'
import EmptyState from '../../components/common/EmptyState'
import Button from '../../components/common/Button'
import Dropdown from '../../components/common/Dropdown'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import BookingCodePanel from '../../components/betting/BookingCodePanel'
import { getAllBets, cancelBet, placeBet } from '../../services/betService'
import { getAllUsers } from '../../services/userService'
import { getMatches } from '../../services/matchService'
import { getWalletData, readAllWallets } from '../../services/walletService'
import { pullStaffData } from '../../services/cloudSync'
import { MARKET_GROUPS, OUTCOME_LABELS, OUTCOME_NAMES } from '../../data/catalogue'
import { formatCurrency, formatOdds, formatDate, getBetNumber } from '../../utils/format'

const STATUS_META = {
  pending: { tone: 'navy', label: 'Pending' },
  won: { tone: 'green', label: 'Won' },
  lost: { tone: 'red', label: 'Lost' },
  cancelled: { tone: 'navy', label: 'Cancelled' },
}

const TABS = ['Pending', 'Won', 'Lost', 'Cancelled']

const EMPTY_BOOKING = { userId: '', stake: '' }
const EMPTY_DRAFT = { matchId: '', market: 'winner', outcome: 'home' }

function labelForOutcome(match, market, outcomeKey) {
  if (market === 'winner') {
    if (outcomeKey === 'home') return match.homeTeam
    if (outcomeKey === 'away') return match.awayTeam
    return 'Draw'
  }
  return OUTCOME_NAMES[outcomeKey] || OUTCOME_LABELS[outcomeKey] || outcomeKey
}

function availableMarkets(match) {
  if (!match?.markets) return []
  return MARKET_GROUPS.filter((group) => {
    const market = match.markets[group.id]
    return market && Object.keys(market).length > 0
  })
}

function selectionKey(selection) {
  return `${selection.matchId}-${selection.market}-${selection.outcomeKey}`
}

/**
 * Build the player picker from the user directory plus the wallet identities
 * that `pullStaffData` attaches. Agents cannot read the user directory, so the
 * wallet copy is what lets them book a bet for a player.
 */
function buildPlayers(users) {
  const map = new Map()
  for (const wallet of readAllWallets()) {
    if (!wallet?.id || !wallet.email) continue
    map.set(wallet.id, {
      id: wallet.id,
      fullName: wallet.fullName || wallet.email,
      email: wallet.email,
      role: wallet.role || 'user',
    })
  }
  for (const user of users) {
    if (!user?.id) continue
    map.set(user.id, { ...map.get(user.id), ...user })
  }
  return [...map.values()]
    .filter((player) => (player.role || 'user') === 'user')
    .sort((a, b) =>
      String(a.fullName || a.email).localeCompare(String(b.fullName || b.email)),
    )
}

export default function AdminBetsPage() {
  const [bets, setBets] = useState([])
  const [tab, setTab] = useState('Pending')
  const [modal, setModal] = useState(null)
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [booking, setBooking] = useState(EMPTY_BOOKING)
  const [slip, setSlip] = useState([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [message, setMessage] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [playerBalance, setPlayerBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      await pullStaffData()
      if (!active) return
      const [betData, userData, matchData] = await Promise.all([
        getAllBets(),
        getAllUsers(),
        getMatches(),
      ])
      if (!active) return
      setBets(betData)
      setPlayers(buildPlayers(userData))
      setMatches(matchData.filter((m) => m.status !== 'ended' && m.status !== 'void'))
    })()
    return () => {
      active = false
    }
  }, [])

  // Show the player's live balance so staff cannot book more than they hold.
  useEffect(() => {
    let active = true
    if (modal !== 'new' || !booking.userId) {
      setPlayerBalance(null)
      setBalanceLoading(false)
      return () => {
        active = false
      }
    }
    setPlayerBalance(null)
    setBalanceLoading(true)
    getWalletData(booking.userId)
      .then((wallet) => {
        if (active) setPlayerBalance(Number(wallet?.balance || 0))
      })
      .catch(() => {
        if (active) setPlayerBalance(null)
      })
      .finally(() => {
        if (active) setBalanceLoading(false)
      })
    return () => {
      active = false
    }
  }, [modal, booking.userId])

  const load = () => getAllBets().then(setBets)

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  const notifyForm = (text) => {
    setFormMessage(text)
  }

  const names = useMemo(() => {
    const map = new Map()
    for (const player of players) map.set(player.id, player.fullName || player.email)
    return map
  }, [players])

  const selectedMatch = matches.find((m) => m.id === draft.matchId)
  const markets = availableMarkets(selectedMatch)
  const outcomes = selectedMatch?.markets?.[draft.market] || {}
  const currentOdds = Number(outcomes[draft.outcome] || 0)
  const stakeValue = Number(booking.stake || 0)

  const draftSelection = useMemo(() => {
    if (!selectedMatch || !currentOdds) return null
    return {
      matchId: selectedMatch.id,
      homeTeam: selectedMatch.homeTeam,
      awayTeam: selectedMatch.awayTeam,
      market: markets.find((m) => m.id === draft.market)?.short || '1X2',
      outcome: labelForOutcome(selectedMatch, draft.market, draft.outcome),
      outcomeKey: draft.outcome,
      odds: currentOdds,
    }
  }, [selectedMatch, currentOdds, markets, draft.market, draft.outcome])

  const totalOdds = slip.reduce((acc, selection) => acc * Number(selection.odds), 1)
  // With nothing explicitly added yet, quote the picker selection so a quick
  // single still shows what it would pay.
  const quoteOdds = slip.length ? totalOdds : currentOdds
  const potentialWin = stakeValue > 0 && quoteOdds > 0 ? stakeValue * quoteOdds : 0

  // A code can be shared for the multi as it is built, or for the current pick
  // before the first leg is added.
  const shareSelections = slip.length ? slip : draftSelection ? [draftSelection] : []

  const openNewBet = () => {
    setBooking(EMPTY_BOOKING)
    setSlip([])
    setDraft(EMPTY_DRAFT)
    setFormMessage('')
    setPlayerBalance(null)
    setModal('new')
  }

  const selectMatch = (matchId) => {
    const match = matches.find((m) => m.id === matchId)
    const market = availableMarkets(match)[0]?.id || 'winner'
    const outcome = Object.keys(match?.markets?.[market] || {})[0] || 'home'
    setDraft((current) => ({ ...current, matchId, market, outcome }))
    setFormMessage('')
  }

  const selectMarket = (market) => {
    const outcome = Object.keys(selectedMatch?.markets?.[market] || {})[0] || ''
    setDraft((current) => ({ ...current, market, outcome }))
    setFormMessage('')
  }

  const addSelection = () => {
    if (!draftSelection) {
      notifyForm('Choose a match, market and selection first.')
      return
    }
    if (slip.some((selection) => selectionKey(selection) === selectionKey(draftSelection))) {
      notifyForm('That selection is already in this booking.')
      return
    }
    setSlip((current) => [...current, draftSelection])
    setDraft(EMPTY_DRAFT)
    setFormMessage('')
  }

  const removeSelection = (index) => {
    setSlip((current) => current.filter((_, i) => i !== index))
    setFormMessage('')
  }

  const createBet = async () => {
    const player = players.find((p) => p.id === booking.userId)
    // If staff picked a selection but did not press "Add", treat it as the bet.
    const selections = slip.length ? slip : draftSelection ? [draftSelection] : []

    if (!player) {
      notifyForm('Select the player this booking is for.')
      return
    }
    if (!selections.length) {
      notifyForm('Add at least one selection to this booking.')
      return
    }
    if (!stakeValue || stakeValue <= 0) {
      notifyForm('Enter a valid stake.')
      return
    }
    if (playerBalance !== null && stakeValue > playerBalance) {
      notifyForm(
        `${player.fullName || player.email} only has ${formatCurrency(playerBalance)} available.`,
      )
      return
    }

    setSaving(true)
    setFormMessage('')
    try {
      await placeBet({ selections, stake: stakeValue, userId: player.id })
      setModal(null)
      setBooking(EMPTY_BOOKING)
      setSlip([])
      setDraft(EMPTY_DRAFT)
      setPlayerBalance(null)
      await load()
      flash(
        `${selections.length === 1 ? 'Bet' : `${selections.length}-fold bet`} created for ${
          player.fullName || player.email
        }.`,
      )
    } catch (err) {
      notifyForm(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleVoid = async (bet) => {
    if (!window.confirm(`Void bet ${getBetNumber(bet.id)} and refund ${formatCurrency(bet.stake)}?`)) return
    try {
      await cancelBet(bet.id)
      await load()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const key = tab.toLowerCase()
  const filtered = tab === 'Pending' ? bets.filter((b) => b.status === 'pending') : bets.filter((b) => b.status === key)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">Bets</h1>
          <p className="mt-1 text-sm text-white/40">All bets across every status.</p>
        </div>
        <Button onClick={openNewBet}>+ New Bet</Button>
      </div>
      {message && (
        <p className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {message}
        </p>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title={`No ${key} bets`} text="Bets will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((bet) => {
            const meta = STATUS_META[bet.status]
            const owner = names.get(bet.userId)
            return (
              <Card key={bet.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-white/60">
                    {getBetNumber(bet.id)} • {bet.type}
                  </span>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-white/30">
                  {owner ? `For ${owner} • ` : ''}
                  {formatDate(bet.placedAt, { withYear: true })}
                  {bet.settledAt ? ` • settled ${formatDate(bet.settledAt, { withYear: true })}` : ''}
                </p>
                <div className="mt-3 space-y-1.5 border-y border-white/5 py-3">
                  {bet.selections.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-white/70">
                        <span className="text-xs text-white/35">{s.market}: </span>
                        {s.homeTeam} vs {s.awayTeam} — {s.outcome}
                      </span>
                      <span className="shrink-0 font-black text-gold">{formatOdds(s.odds)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-white/50">
                    Stake <b className="text-white">{formatCurrency(bet.stake)}</b>
                  </span>
                  <span className="text-white/50">
                    Odds <b className="text-gold">{formatOdds(bet.totalOdds)}</b>
                  </span>
                  <span className="text-white/50">
                    Payout{' '}
                    <b className={bet.status === 'won' ? 'text-success' : 'text-white'}>
                      {formatCurrency(bet.potentialWin)}
                    </b>
                  </span>
                </div>
                {bet.status === 'pending' && (
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <Button variant="danger" size="sm" onClick={() => handleVoid(bet)}>
                      <Ban className="h-4 w-4" />
                      Void & Refund
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={modal === 'new'}
        onClose={() => setModal(null)}
        title="Create Bet"
        subtitle="Build a single or multi-match booking for a player. The stake comes out of their wallet."
        footer={
          <Button fullWidth onClick={createBet} disabled={saving}>
            {saving
              ? 'Creating…'
              : slip.length > 1
                ? `Create ${slip.length}-fold Bet`
                : 'Create Bet'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Player</p>
            <Dropdown
              options={players.map((p) => ({
                value: p.id,
                label: `${p.fullName || p.email} · ${p.email}`,
              }))}
              value={booking.userId}
              onChange={(userId) => setBooking((current) => ({ ...current, userId }))}
              placeholder={players.length ? 'Select player' : 'No players found'}
            />
            {booking.userId && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                <Wallet className="h-3.5 w-3.5" />
                {balanceLoading
                  ? 'Loading balance…'
                  : playerBalance === null
                    ? 'Balance unavailable'
                    : `Available ${formatCurrency(playerBalance)}`}
              </p>
            )}
          </div>

          <div className="border-t border-white/5 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                Selections
              </p>
              <span className="text-[11px] font-bold text-white/40">
                {slip.length} leg{slip.length === 1 ? '' : 's'}
              </span>
            </div>

            {slip.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 bg-navy-800/40 px-3 py-4 text-center text-xs text-white/35">
                Pick a match below and add each selection to build the booking.
              </p>
            ) : (
              <div className="space-y-2">
                {slip.map((selection, index) => (
                  <div
                    key={selectionKey(selection)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {selection.homeTeam} vs {selection.awayTeam}
                      </p>
                      <p className="truncate text-[11px] text-white/40">
                        {selection.market}: {selection.outcome}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-black text-gold">
                        {formatOdds(selection.odds)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${selection.outcome}`}
                        onClick={() => removeSelection(index)}
                        className="rounded-md p-1 text-white/35 transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Match</p>
            <Dropdown
              options={matches.map((m) => ({
                value: m.id,
                label: `${m.homeTeam} vs ${m.awayTeam}`,
              }))}
              value={draft.matchId}
              onChange={selectMatch}
              placeholder={matches.length ? 'Select match' : 'No open matches'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Market</p>
              <Dropdown
                options={markets.map((m) => ({ value: m.id, label: m.name }))}
                value={draft.market}
                onChange={selectMarket}
                placeholder="Select market"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Selection</p>
              <Dropdown
                options={Object.entries(outcomes).map(([key, price]) => ({
                  value: key,
                  label: `${labelForOutcome(selectedMatch || {}, draft.market, key)} · ${formatOdds(price)}`,
                }))}
                value={draft.outcome}
                onChange={(outcome) => {
                  setDraft((current) => ({ ...current, outcome }))
                  setFormMessage('')
                }}
                placeholder="Select outcome"
              />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={addSelection}
            disabled={!draftSelection}
          >
            <Plus className="h-4 w-4" />
            Add selection to booking
          </Button>

          <Input
            label="Stake"
            type="number"
            min="0"
            value={booking.stake}
            onChange={(e) => setBooking((current) => ({ ...current, stake: e.target.value }))}
          />

          {quoteOdds > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-800/60 px-4 py-3 text-sm">
              <span className="text-white/50">
                {slip.length > 1 ? 'Total odds' : 'Odds'}{' '}
                <b className="text-gold">{formatOdds(quoteOdds)}</b>
              </span>
              <span className="text-white/50">
                Potential win <b className="text-success">{formatCurrency(potentialWin)}</b>
              </span>
            </div>
          )}

          {shareSelections.length > 0 && (
            <BookingCodePanel selections={shareSelections} />
          )}

          {formMessage && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {formMessage}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
