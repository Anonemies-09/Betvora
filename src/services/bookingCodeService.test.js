// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBookingCode,
  isValidBookingCode,
  loadBookingCode,
  normalizeBookingCode,
} from './bookingCodeService'

// Exercise the offline/local path: no Firebase traffic in unit tests.
vi.mock('./cloudSync', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, cloudEnabled: () => false }
})

const CACHE_KEY = 'betvora_booking_codes'
const MATCHES_KEY = 'betvora_matches'

function seedMatch(overrides = {}) {
  const match = {
    id: 'm1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    isLive: false,
    markets: { winner: { home: 2.1, draw: 3.4, away: 3.6 } },
    ...overrides,
  }
  localStorage.setItem(MATCHES_KEY, JSON.stringify([match]))
  return match
}

const selection = (odds = 2.1) => ({
  matchId: 'm1',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  market: '1X2',
  outcome: 'Arsenal',
  outcomeKey: 'home',
  odds,
})

beforeEach(() => {
  localStorage.clear()
})

describe('booking code format', () => {
  it('normalizes pasted codes', () => {
    expect(normalizeBookingCode(' abcd-efgh ')).toBe('ABCDEFGH')
    expect(normalizeBookingCode('abcd efgh')).toBe('ABCDEFGH')
  })

  it('accepts 9–10 character unambiguous codes only', () => {
    expect(isValidBookingCode('ABCDEFGHJ')).toBe(true)
    expect(isValidBookingCode('ABCD-EFGHJ')).toBe(true)
    expect(isValidBookingCode('ABCDEFGH')).toBe(false)
    expect(isValidBookingCode('ABCDEFGHI')).toBe(false) // I is not used
    expect(isValidBookingCode('ABCDEFGH0')).toBe(false) // 0 is not used
  })
})

describe('createBookingCode', () => {
  it('creates a 9-character code and stores selections without a stake', async () => {
    seedMatch()
    const record = await createBookingCode([selection()])

    expect(record.code).toMatch(/^[A-HJ-NP-Z2-9]{9}$/)
    expect(record.selections).toHaveLength(1)
    expect(record.selections[0].outcomeKey).toBe('home')
    expect(record).not.toHaveProperty('stake')
    expect(record.expiresAt).toBeTruthy()

    const cache = JSON.parse(localStorage.getItem(CACHE_KEY))
    expect(cache[record.code].selections[0].matchId).toBe('m1')
  })

  it('rejects an empty slip', async () => {
    await expect(createBookingCode([])).rejects.toThrow(/at least one selection/i)
  })

  it('rejects selections whose match has already started', async () => {
    seedMatch({ isLive: true })
    await expect(createBookingCode([selection()])).rejects.toThrow(/already started/i)
  })
})

describe('loadBookingCode', () => {
  it('round-trips a code and refreshes prices from the catalogue', async () => {
    const match = seedMatch()
    const record = await createBookingCode([selection(1.5)])

    match.markets.winner.home = 2.4
    localStorage.setItem(MATCHES_KEY, JSON.stringify([match]))

    const loaded = await loadBookingCode(record.code.toLowerCase())
    expect(loaded.code).toBe(record.code)
    expect(loaded.selections).toHaveLength(1)
    expect(loaded.selections[0].odds).toBe(2.4)
  })

  it('rejects an expired code', async () => {
    seedMatch()
    const record = await createBookingCode([selection()])
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY))
    cache[record.code].expiresAt = new Date(Date.now() - 1000).toISOString()
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))

    await expect(loadBookingCode(record.code)).rejects.toThrow(/expired/i)
  })

  it('rejects malformed codes before touching storage', async () => {
    await expect(loadBookingCode('nope')).rejects.toThrow(/valid booking code/i)
  })
})
