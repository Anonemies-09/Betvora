// Booking codes.
//
// A booking code stores a bet slip's *selections only*. It deliberately does
// not carry a stake or lock odds: anyone who loads the code sets their own
// stake, and the current prices are used when the slip is placed. That matches
// how bookmaker booking codes work elsewhere and keeps a shared code from
// becoming a promise of a particular payout.
//
// Codes live in Firestore (`bookingCodes/{code}`) so a code created on one
// device can be loaded on any other. localStorage keeps a small cache so the
// creator can still copy their code while briefly offline.

import { MARKET_GROUPS } from '../data/catalogue'
import { readMatches } from './matchService'
import {
  CLOUD,
  LOCAL,
  cloudEnabled,
  cloudGet,
  cloudSet,
  readLocal,
  writeLocal,
} from './cloudSync'

// No 0/O/1/I: codes are read aloud, typed on phones and written down.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{9,10}$/
const CODE_LENGTH = 9
const CACHE_LIMIT = 40
const DEFAULT_TTL_DAYS = 7
const MAX_SELECTIONS = 20

function randomCode(length = CODE_LENGTH) {
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  let code = ''
  for (let i = 0; i < length; i += 1) code += ALPHABET[bytes[i] % ALPHABET.length]
  return code
}

/** Strip spaces and dashes so pasted codes such as "ABCD-EFGHI" still work. */
export function normalizeBookingCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
}

export function isValidBookingCode(value) {
  return CODE_PATTERN.test(normalizeBookingCode(value))
}

function cacheKey() {
  return LOCAL.bookingCodes
}

function readCache() {
  const cached = readLocal(cacheKey(), {})
  return cached && typeof cached === 'object' ? cached : {}
}

function writeCache(record) {
  if (!record?.code) return
  const cache = readCache()
  cache[record.code] = record
  const trimmed = Object.values(cache)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, CACHE_LIMIT)
  const next = {}
  for (const item of trimmed) next[item.code] = item
  writeLocal(cacheKey(), next)
}

function marketIdForShort(short) {
  const match = MARKET_GROUPS.find((group) => group.id === short || group.short === short)
  return match?.id || short
}

function sanitizeSelections(selections) {
  const seen = new Set()
  const cleaned = []
  for (const selection of selections || []) {
    if (!selection?.matchId || !selection?.outcomeKey) continue
    const key = `${selection.matchId}-${selection.market}-${selection.outcomeKey}`
    if (seen.has(key)) continue
    seen.add(key)
    const odds = Number(selection.odds)
    cleaned.push({
      matchId: selection.matchId,
      homeTeam: selection.homeTeam || '',
      awayTeam: selection.awayTeam || '',
      market: selection.market || '1X2',
      outcome: selection.outcome || selection.outcomeKey,
      outcomeKey: selection.outcomeKey,
      odds: Number.isFinite(odds) && odds > 0 ? odds : 0,
    })
    if (cleaned.length >= MAX_SELECTIONS) break
  }
  return cleaned
}

function currentUserId() {
  return readLocal('betvora_session', null)?.id || ''
}

/**
 * Work out when a code should stop being loadable. A booking code expires when
 * its first match kicks off, because the selections can no longer be staked.
 */
function expiryFor(selections) {
  const matches = readMatches()
  const now = Date.now()
  const startTimes = []
  for (const selection of selections) {
    const match = matches.find((m) => m.id === selection.matchId)
    if (!match?.startTime) continue
    const starts = new Date(match.startTime).getTime()
    // Old catalogue entries can carry a date in the past; those matches are
    // still open in the app, so fall back to the default lifetime instead of
    // creating a code that expires instantly.
    if (Number.isFinite(starts) && starts > now) startTimes.push(starts)
  }
  if (startTimes.length) return new Date(Math.min(...startTimes)).toISOString()
  return new Date(now + DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

/** Re-price a loaded slip against the live catalogue; never trust stored odds. */
function refreshSelections(selections) {
  const matches = readMatches()
  if (!matches.length) return selections
  const byId = new Map(matches.map((match) => [match.id, match]))
  return selections.map((selection) => {
    const match = byId.get(selection.matchId)
    if (!match) return selection
    const marketId = marketIdForShort(selection.market)
    const price = Number(match.markets?.[marketId]?.[selection.outcomeKey])
    return {
      ...selection,
      homeTeam: match.homeTeam || selection.homeTeam,
      awayTeam: match.awayTeam || selection.awayTeam,
      odds: Number.isFinite(price) && price > 0 ? price : selection.odds,
    }
  })
}

/**
 * Persist selections under a fresh shareable code. Returns the 9-character
 * code plus the record so the UI can show/copy it immediately.
 */
export async function createBookingCode(selections) {
  const cleaned = sanitizeSelections(selections)
  if (!cleaned.length) throw new Error('Add at least one selection before creating a code.')

  const matches = readMatches()
  if (matches.length) {
    const started = cleaned.find((selection) => {
      const match = matches.find((m) => m.id === selection.matchId)
      if (!match) return false
      return match.status === 'ended' || match.status === 'void' || match.isLive
    })
    if (started) {
      throw new Error('One or more selections have already started. Remove them and try again.')
    }
  }

  const record = {
    selections: cleaned,
    createdBy: currentUserId(),
    createdAt: new Date().toISOString(),
    expiresAt: expiryFor(cleaned),
  }

  let code = ''
  if (cloudEnabled()) {
    // Retry on the astronomically unlikely collision with an existing code.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = randomCode()
      const existing = await cloudGet(CLOUD.bookingCodes, candidate)
      if (existing === undefined) {
        throw new Error('Could not reach the server. Check your connection and try again.')
      }
      if (existing === null) {
        code = candidate
        break
      }
    }
    if (!code) throw new Error('Could not create a code. Please try again.')
    const saved = await cloudSet(CLOUD.bookingCodes, code, { ...record, code })
    if (!saved) {
      throw new Error('Could not save the booking code. Check your connection and try again.')
    }
  } else {
    // Offline preview / tests: keep the code in the local cache only.
    code = randomCode()
  }

  const full = { ...record, code }
  writeCache(full)
  return full
}

/**
 * Load a shared code. Resolves `{ code, selections, expiresAt }` with live
 * odds where the catalogue is available. Throws a friendly error for missing,
 * expired or fully-finished codes.
 */
export async function loadBookingCode(input) {
  const code = normalizeBookingCode(input)
  if (!isValidBookingCode(code)) {
    throw new Error('Enter a valid booking code (9 characters).')
  }

  let record = null
  if (cloudEnabled()) {
    const cloud = await cloudGet(CLOUD.bookingCodes, code)
    if (cloud === undefined) {
      // Read failed: fall back to our own cache before giving up.
      record = readCache()[code] || null
      if (!record) {
        throw new Error('Could not reach the server. Check your connection and try again.')
      }
    } else if (cloud === null) {
      throw new Error('That booking code was not found. Check the code and try again.')
    } else {
      record = cloud
    }
  } else {
    record = readCache()[code] || null
    if (!record) throw new Error('Booking codes need an internet connection.')
  }

  const expiresAt = record.expiresAt ? new Date(record.expiresAt).getTime() : 0
  if (expiresAt && expiresAt <= Date.now()) {
    throw new Error('That booking code has expired.')
  }

  const base = sanitizeSelections(record.selections)
  if (!base.length) throw new Error('That booking code has no selections.')

  const live = refreshSelections(base)
  const matches = readMatches()
  let selections = live
  if (matches.length) {
    const unusable = new Set(
      matches
        .filter((match) => match.status === 'ended' || match.status === 'void' || match.isLive)
        .map((match) => match.id),
    )
    selections = live.filter((selection) => !unusable.has(selection.matchId))
    if (!selections.length) {
      throw new Error('Every match in that booking code has already started or finished.')
    }
  }

  const loaded = {
    code,
    selections,
    createdAt: record.createdAt || '',
    expiresAt: record.expiresAt || '',
  }
  writeCache({ ...record, ...loaded, code })
  return loaded
}

export function bookingCodeShareUrl(code, origin) {
  const base =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '')
  return `${base}/bet-slip?code=${encodeURIComponent(normalizeBookingCode(code))}`
}

export function bookingCodeShareText(code, origin) {
  const normalized = normalizeBookingCode(code)
  return `Load my BETVORA bet slip with code ${normalized}: ${bookingCodeShareUrl(normalized, origin)}`
}
