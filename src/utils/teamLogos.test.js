import { describe, expect, it } from 'vitest'
import { teamLogoUrl } from './teamLogos'

describe('teamLogoUrl', () => {
  it('returns the api-football CDN URL for known clubs', () => {
    expect(teamLogoUrl('Manchester City')).toBe('https://media.api-sports.io/football/teams/50.png')
    expect(teamLogoUrl('Real Madrid')).toBe('https://media.api-sports.io/football/teams/541.png')
    expect(teamLogoUrl('Tottenham')).toBe('https://media.api-sports.io/football/teams/47.png')
  })

  it('falls back to a DiceBear placeholder for unknown teams', () => {
    expect(teamLogoUrl('Unknown FC')).toContain('api.dicebear.com/9.x/initials/svg')
    expect(teamLogoUrl('Unknown FC')).toContain(encodeURIComponent('Unknown FC'))
  })

  it('returns an empty string for empty names', () => {
    expect(teamLogoUrl('')).toBe('')
    expect(teamLogoUrl(undefined)).toBe('')
    expect(teamLogoUrl(null)).toBe('')
  })
})
