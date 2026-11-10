// Bet service — placement + the Phase 18 settlement engine.
// Pending bets are evaluated when an admin settles a match; wins are
// credited and losses marked. Refunded (voided) bets return the stake.

import { demoBets } from '../data/demoData'
import { readMatches } from './matchService'
import * as authService from './authService'
import { deductForBet, creditWinnings, refundStake } from './walletService'

function currentUserId() {
  return authService.getSession()?.id || 'u001'
}
import { createNotification } from './notificationService'
import { COLLECTIONS, mirrorPersist } from './firestoreService'

const BETS_KEY = 'betvora_bets'

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readBets() {
  try {
    const raw = localStorage.getItem(BETS_KEY)
    return raw ? JSON.parse(raw) : demoBets()
  } catch {
    return demoBets()
  }
}

function persist(bets) {
  localStorage.setItem(BETS_KEY, JSON.stringify(bets))
  mirrorPersist(COLLECTIONS.bets, bets)
}

function computeTotalOdds(selections) {
  return selections.reduce((acc, s) => acc * Number(s.odds), 1)
}

export async function placeBet({ selections, stake }) {
  await delay()
  if (!selections || selections.length === 0) {
    throw new Error('Add at least one selection to your bet slip.')
  }
  const value = Number(stake)
  if (!value || value <= 0) {
    throw new Error('Enter a valid stake.')
  }
  const totalOdds = computeTotalOdds(selections)
  const bets = readBets()
  const bet = {
    id: String(10000 + bets.length + 1),
    userId: currentUserId(),
    type: selections.length === 1 ? 'single' : 'multiple',
    status: 'pending',
    stake: value,
    totalOdds: Number(totalOdds.toFixed(2)),
    potentialWin: Number((value * totalOdds).toFixed(2)),
    placedAt: new Date().toISOString(),
    selections: selections.map((s) => ({
      matchId: s.matchId,
      homeTeam: s.homeTeam,
      awayTeam: s.awayTeam,
      market: s.market,
      outcome: s.outcome,
      outcomeKey: s.outcomeKey,
      odds: Number(s.odds),
    })),
  }
  bets.unshift(bet)
  persist(bets)
  await deductForBet(value, `Bet placed — #BV${bet.id}`, bet.userId)
  createNotification({ type: 'bet', title: 'Bet placed', text: `Your bet #BV${bet.id} has been placed successfully.` })
  return bet
}

export async function getMyBets() {
  await delay()
  return readBets()
}

export async function getAllBets() {
  await delay()
  return readBets()
}

export async function cancelBet(betId, reason = 'Voided by admin') {
  await delay()
  const bets = readBets()
  const bet = bets.find((b) => b.id === betId)
  if (!bet) throw new Error('Bet not found.')
  if (bet.status !== 'pending') throw new Error('Only pending bets can be voided.')
  bet.status = 'cancelled'
  bet.settledAt = new Date().toISOString()
  bet.cancelReason = reason
  persist(bets)
  await refundStake(bet.stake, `Bet #BV${bet.id} voided`, bet.userId)
  createNotification({
    type: 'system',
    title: 'Bet voided',
    text: `Bet #BV${bet.id} was voided and your stake refunded.`,
  })
  return bet
}

/**
 * Evaluate one selection against a settled score.
 * Returns true (won), false (lost) or null (not resolvable).
 */
export function evaluateSelection(selection, score) {
  const home = Number(score?.home) || 0
  const away = Number(score?.away) || 0
  const winner = home > away ? 'home' : away > home ? 'away' : 'draw'
  const total = home + away
  const btts = home > 0 && away > 0

  switch (selection.outcomeKey) {
    case 'home':
      return winner === 'home'
    case 'draw':
      return winner === 'draw'
    case 'away':
      return winner === 'away'
    case 'homeOrDraw':
      return winner === 'home' || winner === 'draw'
    case 'homeOrAway':
      return winner === 'home' || winner === 'away'
    case 'drawOrAway':
      return winner === 'draw' || winner === 'away'
    case 'over25':
      return total >= 3
    case 'under25':
      return total <= 2
    case 'yes':
      return btts
    case 'no':
      return !btts
    default:
      if (/^\d+-\d+$/.test(String(selection.outcomeKey))) {
        const [h, a] = String(selection.outcomeKey).split('-').map(Number)
        return home === h && away === a
      }
      return null
  }
}

/**
 * Settle every pending bet that references the given match.
 * A bet resolves only when ALL of its selections' matches are settled
 * (status 'ended') or voided. Voided selections refund the stake.
 */
export async function settleBetsForMatch(matchId) {
  await delay()
  const matches = readMatches()
  const byId = Object.fromEntries(matches.map((m) => [m.id, m]))
  const settled = matches.filter((m) => m.status === 'ended')
  const voided = matches.filter((m) => m.status === 'void')
  const settledIds = new Set(settled.map((m) => m.id))
  const voidedIds = new Set(voided.map((m) => m.id))

  const bets = readBets()
  let changed = false

  const affected = bets.filter(
    (b) =>
      b.status === 'pending' &&
      b.selections.some((s) => s.matchId === matchId),
  )

  for (const bet of affected) {
    const voidedSel = bet.selections.filter((s) => voidedIds.has(s.matchId))
    if (voidedSel.length > 0) {
      bet.status = 'cancelled'
      bet.settledAt = new Date().toISOString()
      changed = true
      await refundStake(bet.stake, `Bet #BV${bet.id} voided`, bet.userId)
      createNotification({
        type: 'system',
        title: 'Bet voided',
        text: `Bet #BV${bet.id} was voided and your stake refunded.`,
      })
      continue
    }

    const unresolved = bet.selections.some((s) => !settledIds.has(s.matchId))
    if (unresolved) continue

    const results = bet.selections.map((s) => evaluateSelection(s, byId[s.matchId]?.score))
    if (results.includes(null)) continue

    const won = results.every(Boolean)
    bet.status = won ? 'won' : 'lost'
    bet.settledAt = new Date().toISOString()
    changed = true
    if (won) {
      await creditWinnings(bet.potentialWin, `Bet #BV${bet.id} won`, bet.userId)
    }
  }

  if (changed) persist(bets)
  return changed
}
