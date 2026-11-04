// External team logo source.
//
// Known clubs resolve to their official crest on api-football's public media
// CDN (free, no key). Any team without a mapping falls back to a deterministic
// initials placeholder from DiceBear so every team still gets a badge.

const API_FOOTBALL_IDS = {
  'Manchester City': 50,
  'Liverpool': 40,
  'Manchester United': 33,
  'Arsenal': 42,
  'Chelsea': 49,
  'Tottenham': 47,
  'Tottenham Hotspur': 47,
  'Real Madrid': 541,
  'Atletico Madrid': 530,
  'Barcelona': 529,
  'PSG': 85,
  'Marseille': 81,
  'Bayern Munich': 157,
  'Borussia Dortmund': 165,
  'Bayer Leverkusen': 168,
  'RB Leipzig': 173,
  'Juventus': 496,
  'AC Milan': 489,
  'Napoli': 492,
  'AS Roma': 497,
  'Sevilla': 536,
}

const ESPN_TEAM_IDS = {
  nba: {
    'Los Angeles Lakers': 'lal',
    'Boston Celtics': 'bos',
    'Golden State Warriors': 'gsw',
    'Denver Nuggets': 'den',
    'Milwaukee Bucks': 'mil',
    'Philadelphia 76ers': 'phi',
    'Miami Heat': 'mia',
    'New York Knicks': 'nyk',
    'Brooklyn Nets': 'bkn',
    'Dallas Mavericks': 'dal',
    'Las Vegas Aces': 'lva',
    'New York Liberty': 'ny',
    'Indiana Fever': 'ind',
    'Chicago Sky': 'chi',
  },
  nfl: {
    'Kansas City Chiefs': 'kc',
    'Philadelphia Eagles': 'phi',
    'Buffalo Bills': 'buf',
    'San Francisco 49ers': 'sf',
    'Dallas Cowboys': 'dal',
    'Green Bay Packers': 'gb',
    'Detroit Lions': 'det',
    'Baltimore Ravens': 'bal',
  },
  nhl: {
    'Toronto Maple Leafs': 'tor',
    'Boston Bruins': 'bos',
    'Edmonton Oilers': 'edm',
    'Colorado Avalanche': 'col',
    'New York Rangers': 'nyr',
    'Vegas Golden Knights': 'vgk',
    'Florida Panthers': 'fla',
  },
  mlb: {
    'New York Yankees': 'nyy',
    'Boston Red Sox': 'bos',
    'Los Angeles Dodgers': 'lad',
    'San Diego Padres': 'sd',
    'Atlanta Braves': 'atl',
    'Chicago Cubs': 'chc',
    'Houston Astros': 'hou',
  },
}

const API_FOOTBALL_BASE = 'https://media.api-sports.io/football/teams/'
const ESPN_BASE = 'https://a.espncdn.com/i/teamlogos/'
const FALLBACK_BASE = 'https://api.dicebear.com/9.x/initials/svg'

export function teamLogoUrl(name) {
  const key = String(name || '').trim()
  if (!key) return ''
  const id = API_FOOTBALL_IDS[key]
  if (id) return `${API_FOOTBALL_BASE}${id}.png`
  for (const [sport, teams] of Object.entries(ESPN_TEAM_IDS)) {
    const code = teams[key]
    if (code) return `${ESPN_BASE}${sport}/500/${code}.png`
  }
  return `${FALLBACK_BASE}?seed=${encodeURIComponent(key)}&backgroundColor=0a0a0a&fontWeight=600`
}
