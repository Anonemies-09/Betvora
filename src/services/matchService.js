// Match catalogue + settlement state, backed by localStorage.
// Admin edits here; the betting engine settles against it.
// Phase 12/13 moves this to Firestore (collections: sports/leagues/teams/matches/markets).

import { COLLECTIONS, mirrorPersist, mirrorDelete } from './firestoreService'
import { notifyCatalogueUpdated } from '../hooks/useCatalogue'

const MATCHES_KEY = 'betvora_matches'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function readMatches() {
  try {
    const raw = localStorage.getItem(MATCHES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through */
  }
  localStorage.setItem(MATCHES_KEY, JSON.stringify([]))
  return []
}

function persist(matches) {
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches))
  mirrorPersist(COLLECTIONS.matches, matches)
  notifyCatalogueUpdated()
}

export async function getMatches() {
  await delay(200)
  return readMatches()
}

export async function getMatch(id) {
  await delay(150)
  const match = readMatches().find((m) => m.id === id)
  if (!match) throw new Error('Match not found.')
  return match
}

export async function updateMatch(id, patch) {
  await delay()
  const matches = readMatches()
  const index = matches.findIndex((m) => m.id === id)
  if (index === -1) throw new Error('Match not found.')
  matches[index] = { ...matches[index], ...patch }
  persist(matches)
  return matches[index]
}

export async function createMatch(data) {
  await delay()
  const matches = readMatches()
  const id = `m${Date.now()}`
  const match = {
    id,
    leagueId: data.leagueId || 'epl',
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    startTime: data.startTime || new Date().toISOString(),
    status: 'upcoming',
    isLive: false,
    markets: data.markets || {
      winner: { home: 2.0, draw: 3.3, away: 3.5 },
      doubleChance: { homeOrDraw: 1.3, homeOrAway: 1.35, drawOrAway: 1.7 },
      overUnder: { over25: 1.9, under25: 1.9 },
      btts: { yes: 1.8, no: 1.95 },
      correctScore: { '1-0': 8.0, '2-1': 8.5, '1-1': 6.0, '2-0': 9.0, '0-1': 8.0 },
    },
  }
  matches.unshift(match)
  persist(matches)
  return match
}

export async function deleteMatch(id) {
  await delay()
  const next = readMatches().filter((m) => m.id !== id)
  persist(next)
  mirrorDelete(COLLECTIONS.matches, id)
}

export async function replaceAutoFixtures(fixtures) {
  await delay()
  const matches = readMatches().filter((m) => !String(m.id).startsWith('af-'))
  matches.push(...fixtures)
  persist(matches)
  return matches
}

export async function startMatch(id, score = { home: 0, away: 0 }) {
  await delay()
  return updateMatch(id, { status: 'live', isLive: true, minute: 1, score })
}

export async function endMatch(id, score) {
  await delay()
  const matches = readMatches()
  const index = matches.findIndex((m) => m.id === id)
  if (index === -1) throw new Error('Match not found.')
  const finalScore = score || matches[index].score || { home: 0, away: 0 }
  matches[index] = {
    ...matches[index],
    status: 'ended',
    isLive: false,
    score: finalScore,
    result: computeResult(finalScore),
    endedAt: new Date().toISOString(),
  }
  persist(matches)
  return matches[index]
}

export async function voidMatch(id) {
  await delay()
  const matches = readMatches()
  const index = matches.findIndex((m) => m.id === id)
  if (index === -1) throw new Error('Match not found.')
  matches[index] = {
    ...matches[index],
    status: 'void',
    isLive: false,
    result: 'void',
    endedAt: new Date().toISOString(),
  }
  persist(matches)
  return matches[index]
}

export function computeResult(score) {
  const { home = 0, away = 0 } = score || {}
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}
