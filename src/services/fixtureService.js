// Auto-feed: the site always has a fresh card for the next couple of days.
// Admin can toggle auto-detection and regenerate tomorrow's fixtures manually.

import { generateFixturesForDate, getAutoLeagueIds } from '../data/fixtureGenerator'
import { replaceAutoFixtures } from './matchService'

const AUTO_FEED_KEY = 'betvora_autofeed'

export function isAutoFeedEnabled() {
  try {
    return localStorage.getItem(AUTO_FEED_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setAutoFeedEnabled(enabled) {
  try {
    localStorage.setItem(AUTO_FEED_KEY, enabled ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

// Regenerate (or refresh) the auto-generated fixtures for a given day ahead.
export async function autoScheduleFixtures(daysAhead = 1, leagueIds = getAutoLeagueIds()) {
  const fixtures = generateFixturesForDate(daysAhead, leagueIds)
  await replaceAutoFixtures(fixtures)
  return fixtures.length
}
