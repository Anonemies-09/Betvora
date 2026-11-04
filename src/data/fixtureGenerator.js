// Deterministic "live feed" — generates tomorrow's fixtures so the site always
// has a fresh card. Seeded by date + league, so the same day always shows the
// same fixtures. Swap this module for a real provider feed in production.

const AUTO_LEAGUES = ['epl', 'laliga', 'ucl', 'seriea', 'bundesliga', 'ligue1', 'nba', 'ipl']

const TEAM_POOLS = {
  epl: ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man Utd', 'Tottenham', 'Newcastle', 'Aston Villa'],
  laliga: ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Betis', 'Villarreal', 'Athletic Bilbao', 'Valencia'],
  ucl: ['Real Madrid', 'Bayern Munich', 'Man City', 'PSG', 'Inter', 'Juventus', 'Barcelona', 'Arsenal'],
  seriea: ['Inter', 'Juventus', 'AC Milan', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina'],
  bundesliga: ['Bayern Munich', 'Dortmund', 'Bayer Leverkusen', 'RB Leipzig', 'Frankfurt', 'Stuttgart', 'Wolfsburg', 'Gladbach'],
  ligue1: ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Rennes', 'Nice', 'Lens'],
  nba: ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Nuggets', 'Suns', 'Knicks', 'Heat'],
  ipl: ['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers', 'Kolkata Knight Riders', 'Delhi Capitals', 'Sunrisers Hyderabad', 'Punjab Kings', 'Rajasthan Royals'],
}

function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dateKey(daysAhead) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

function eventTime(daysAhead, hour, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function makeMarkets(rnd) {
  const base = 1.15 + rnd() * 1.7
  const gap = 0.3 + rnd() * 2.1
  const home = round2(base)
  const away = round2(base + gap)
  const draw = round2(2.9 + rnd() * 1.2)
  return {
    winner: { home, draw, away },
    doubleChance: {
      homeOrDraw: round2((home * draw) / (home + draw)),
      homeOrAway: round2((home * away) / (home + away)),
      drawOrAway: round2((draw * away) / (draw + away)),
    },
    overUnder: { over25: round2(1.65 + rnd() * 0.6), under25: round2(1.7 + rnd() * 0.55) },
    btts: { yes: round2(1.55 + rnd() * 0.45), no: round2(1.9 + rnd() * 0.5) },
    correctScore: { '2-0': round2(6 + rnd() * 4), '1-1': round2(5 + rnd() * 3), '2-1': round2(6 + rnd() * 4), '1-0': round2(7 + rnd() * 4), '2-2': round2(10 + rnd() * 6) },
  }
}

export function generateFixturesForDate(daysAhead, leagueIds = AUTO_LEAGUES) {
  const key = dateKey(daysAhead)
  const fixtures = []
  leagueIds.forEach((leagueId, li) => {
    const pool = TEAM_POOLS[leagueId]
    if (!pool || pool.length < 2) return
    const rnd = mulberry32(hashString(`${key}:${leagueId}`))
    const shuffled = [...pool].sort(() => rnd() - 0.5)
    const pairs = []
    for (let i = 0; i < shuffled.length - 1; i += 2) pairs.push([shuffled[i], shuffled[i + 1]])
    const count = Math.min(pairs.length, 2)
    const hour = 13 + Math.floor(rnd() * 8)
    for (let i = 0; i < count; i++) {
      const [homeTeam, awayTeam] = pairs[i]
      fixtures.push({
        id: `af-${key}-${li}-${i}`,
        leagueId,
        homeTeam,
        awayTeam,
        startTime: eventTime(daysAhead, hour + i * 2),
        status: 'upcoming',
        isLive: false,
        featured: false,
        auto: true,
        markets: makeMarkets(rnd),
      })
    }
  })
  return fixtures
}

export function generateUpcomingFixtures() {
  return [...generateFixturesForDate(1), ...generateFixturesForDate(2)]
}

export function getAutoLeagueIds() {
  return [...AUTO_LEAGUES]
}
