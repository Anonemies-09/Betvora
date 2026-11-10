// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  crashPointFromSeed,
  flightPoint,
  multiplierAt,
  readAviatorHistory,
  saveAviatorRound,
} from './aviator'

describe('aviator crash math', () => {
  it('is deterministic for the same seed', () => {
    const seed = 'a1b2c3d4e5f60718'
    expect(crashPointFromSeed(seed)).toBe(crashPointFromSeed(seed))
  })

  it('busts instantly when the seed satisfies the house-edge rule', () => {
    expect(crashPointFromSeed('0000000000000000')).toBe(1)
  })

  it('never returns a multiplier below 1', () => {
    const seeds = ['ffffffffffffff', '1234567890abc', 'deadbeefcafe01', '7f3a9c2b1d4e5f60']
    for (const seed of seeds) {
      expect(crashPointFromSeed(seed)).toBeGreaterThanOrEqual(1)
    }
  })

  it('grows the multiplier over time', () => {
    expect(multiplierAt(0)).toBe(1)
    expect(multiplierAt(5000)).toBeGreaterThan(1.9)
    expect(multiplierAt(10000)).toBeGreaterThan(multiplierAt(5000))
  })

  it('keeps flight points inside the graph', () => {
    for (const mult of [1, 2, 10, 100]) {
      const point = flightPoint(mult, 12000)
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(100)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(100)
    }
  })
})

describe('aviator history', () => {
  beforeEach(() => localStorage.clear())

  it('stores rounds per user, newest first', () => {
    saveAviatorRound('u1', { id: 'a', crash: 2 })
    saveAviatorRound('u1', { id: 'b', crash: 3 })
    expect(readAviatorHistory('u1').map((r) => r.id)).toEqual(['b', 'a'])
    expect(readAviatorHistory('u2')).toEqual([])
  })
})
