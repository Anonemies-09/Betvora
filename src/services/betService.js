// Bet service — placement + the settlement engine.
//
// Bets live in Firestore (`bets/{id}`) with a `userId` owner, so a bet placed
// on one device appears on every device the user signs in on. The wallet is
// debited first and refunded if the shared write cannot be confirmed.

import { readMatches } from './matchService'
import * as authService from './authService'
import { deductForBet, creditWinnings, refundStake } from './walletService'
import { createNotification } from './notificationService'
import {
  CLOUD,
  LOCAL,
  cloudEnabled,
  cloudListByUser,
  cloudSet,
  readLocal,
  replaceUserSlice,
  sortNewest,
  writeLocal,
} from './cloudSync'

const BETS_KEY = LOCAL.bets

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function currentUserId() {
  return authService.getSession()?.id || ''
}

function readBets() {
  return readLocal(BETS_KEY, [])
}

function persistLocal(bets) {
  writeLocal(BETS_KEY, bets)
}

function computeTotalOdds(selections) {
  return selections.reduce((acc, s) => acc * Number(s.odds), 1)
}

function nextBetId(bets) {
  let id = `${String(Date.now()).slice(-6)}${Math.floor(10 + Math.random() * 90)}`
  let guard = 0
  while (bets.some((b) => String(b.id) === id) && guard < 50) {
    id = `${String(Date.now()).slice(-6)}${Math.floor(10 + Math.random() * 90)}`
    guard += 1
  }
  return id
}

async function saveBetCloud(bet) {
  if (!cloudEnabled()) return true
  return cloudSet(CLOUD.bets, bet.id, bet)
}

export async function placeBet({ selections, stake, userId }) {
  await delay()
  if (!selections || selections.length === 0) {
    throw new Error('Add at least one selection to your bet slip.')
  }
  const value = Number(stake)
  if (!value || value <= 0) {
    throw new Error('Enter a valid stake.')
  }
  const uid = userId || currentUserId()
  if (!uid) throw new Error('You need to be signed in.')

  const totalOdds = computeTotalOdds(selections)
  const bets = readBets()
  const bet = {
    id: nextBetId(bets),
    userId: uid,
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

  // Take the stake first: a short balance must never leave a phantom bet.
  await deductForBet(value, `Bet placed — #BV${bet.id}`, uid)

  const saved = await saveBetCloud(bet)
  if (cloudEnabled() && !saved) {
    await refundStake(value, `Bet #BV${bet.id} could not be saved`, uid)
    throw new Error('Could not save your bet. Your stake was refunded.')
  }

  bets.unshift(bet)
  persistLocal(bets)
  await createNotification({
    type: 'bet',
    title: 'Bet placed',
    text: `Your bet #BV${bet.id} has been placed successfully.`,
    userId: uid,
  })
  return bet
}

/** Pull this user's bets from the cloud, then return the local view. */
export async function getMyBets() {
  await delay(150)
  const uid = currentUserId()
  if (!uid) return []
  if (cloudEnabled()) {
    const remote = await cloudListByUser(CLOUD.bets, uid)
    if (remote) replaceUserSlice(uid, LOCAL.bets, remote)
  }
  return readBets().filter((bet) => bet.userId === uid)
}

export async function refreshMyBets() {
  return getMyBets()
}

export async function getAllBets() {
  await delay(150)
  return sortNewest(readBets())
}

async function updateBetCloud(bet) {
  const saved = await saveBetCloud(bet)
  return saved
}

export async function cancelBet(betId, reason = 'Voided by admin') {
  await delay()
  const bets = readBets()
  const bet = bets.find((b) => String(b.id) === String(betId))
  if (!bet) throw new Error('Bet not found.')
  if (bet.status !== 'pending') throw new Error('Only pending bets can be voided.')
  bet.status = 'cancelled'
  bet.settledAt = new Date().toISOString()
  bet.cancelReason = reason
  persistLocal(bets)
  await updateBetCloud(bet)
  await refundStake(bet.stake, `Bet #BV${bet.id} voided`, bet.userId)
  await createNotification({
    type: 'system',
    title: 'Bet voided',
    text: `Bet #BV${bet.id} was voided and your stake refunded.`,
    userId: bet.userId,
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
    (b) => b.status === 'pending' && b.selections.some((s) => s.matchId === matchId),
  )

  for (const bet of affected) {
    const voidedSel = bet.selections.filter((s) => voidedIds.has(s.matchId))
    if (voidedSel.length > 0) {
      bet.status = 'cancelled'
      bet.settledAt = new Date().toISOString()
      changed = true
      persistLocal(bets)
      await updateBetCloud(bet)
      await refundStake(bet.stake, `Bet #BV${bet.id} voided`, bet.userId)
      await createNotification({
        type: 'system',
        title: 'Bet voided',
        text: `Bet #BV${bet.id} was voided and your stake refunded.`,
        userId: bet.userId,
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
    persistLocal(bets)
    await updateBetCloud(bet)
    if (won) {
      await creditWinnings(bet.potentialWin, `Bet #BV${bet.id} won`, bet.userId)
      await createNotification({
        type: 'win',
        title: 'Bet won',
        text: `Bet #BV${bet.id} won. ${bet.potentialWin} was credited to your wallet.`,
        userId: bet.userId,
      })
    } else {
      await createNotification({
        type: 'bet',
        title: 'Bet lost',
        text: `Bet #BV${bet.id} did not win this time.`,
        userId: bet.userId,
      })
    }
  }

  if (changed) persistLocal(bets)
  return changed
}
