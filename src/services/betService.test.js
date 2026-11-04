import { describe, expect, it } from 'vitest'
import { evaluateSelection } from './betService'
import { computeResult } from './matchService'

const sel = (outcomeKey) => ({ outcomeKey })

describe('evaluateSelection — 1X2', () => {
  it('home win resolves home/draw/away keys', () => {
    expect(evaluateSelection(sel('home'), { home: 2, away: 0 })).toBe(true)
    expect(evaluateSelection(sel('draw'), { home: 2, away: 0 })).toBe(false)
    expect(evaluateSelection(sel('away'), { home: 2, away: 0 })).toBe(false)
  })

  it('draw result resolves correctly', () => {
    expect(evaluateSelection(sel('home'), { home: 1, away: 1 })).toBe(false)
    expect(evaluateSelection(sel('draw'), { home: 1, away: 1 })).toBe(true)
  })

  it('away win resolves correctly', () => {
    expect(evaluateSelection(sel('away'), { home: 0, away: 3 })).toBe(true)
    expect(evaluateSelection(sel('home'), { home: 0, away: 3 })).toBe(false)
  })
})

describe('evaluateSelection — double chance', () => {
  it('homeOrDraw wins when home wins or draws', () => {
    expect(evaluateSelection(sel('homeOrDraw'), { home: 2, away: 0 })).toBe(true)
    expect(evaluateSelection(sel('homeOrDraw'), { home: 1, away: 1 })).toBe(true)
    expect(evaluateSelection(sel('homeOrDraw'), { home: 0, away: 2 })).toBe(false)
  })

  it('homeOrAway loses only on a draw', () => {
    expect(evaluateSelection(sel('homeOrAway'), { home: 2, away: 0 })).toBe(true)
    expect(evaluateSelection(sel('homeOrAway'), { home: 1, away: 1 })).toBe(false)
    expect(evaluateSelection(sel('homeOrAway'), { home: 0, away: 2 })).toBe(true)
  })

  it('drawOrAway wins when not home', () => {
    expect(evaluateSelection(sel('drawOrAway'), { home: 2, away: 0 })).toBe(false)
    expect(evaluateSelection(sel('drawOrAway'), { home: 1, away: 1 })).toBe(true)
    expect(evaluateSelection(sel('drawOrAway'), { home: 0, away: 2 })).toBe(true)
  })
})

describe('evaluateSelection — over/under and BTTS', () => {
  it('over 2.5 requires 3+ goals', () => {
    expect(evaluateSelection(sel('over25'), { home: 2, away: 0 })).toBe(false)
    expect(evaluateSelection(sel('over25'), { home: 2, away: 1 })).toBe(true)
    expect(evaluateSelection(sel('under25'), { home: 2, away: 1 })).toBe(false)
    expect(evaluateSelection(sel('under25'), { home: 1, away: 0 })).toBe(true)
  })

  it('BTTS yes requires both teams to score', () => {
    expect(evaluateSelection(sel('yes'), { home: 2, away: 1 })).toBe(true)
    expect(evaluateSelection(sel('yes'), { home: 2, away: 0 })).toBe(false)
    expect(evaluateSelection(sel('no'), { home: 2, away: 0 })).toBe(true)
  })
})

describe('evaluateSelection — correct score', () => {
  it('matches the exact scoreline', () => {
    expect(evaluateSelection(sel('2-1'), { home: 2, away: 1 })).toBe(true)
    expect(evaluateSelection(sel('2-1'), { home: 1, away: 2 })).toBe(false)
  })
})

describe('evaluateSelection — edge cases', () => {
  it('returns null for unknown keys', () => {
    expect(evaluateSelection(sel('something-weird'), { home: 1, away: 0 })).toBe(null)
  })

  it('treats a missing score as 0-0', () => {
    expect(evaluateSelection(sel('draw'), {})).toBe(true)
    expect(evaluateSelection(sel('over25'), {})).toBe(false)
  })
})

describe('computeResult', () => {
  it('computes home, away and draw winners', () => {
    expect(computeResult({ home: 2, away: 0 })).toBe('home')
    expect(computeResult({ home: 1, away: 2 })).toBe('away')
    expect(computeResult({ home: 1, away: 1 })).toBe('draw')
    expect(computeResult({})).toBe('draw')
  })
})
