// BETVORA games catalogue — casino, virtual sports and instant/crash titles.
// Entries describe the lobby; the playable titles settle against the user wallet.

export const CASINO_CATEGORIES = [
  {
    id: 'slots',
    name: 'Slots',
    tagline: 'Spin-to-win fruit machines and jackpot reels',
    games: [
      { id: 'sweet-bonanza', name: 'Sweet Bonanza', provider: 'Pragmatic Play', rtp: '96.51%', icon: '🍬' },
      { id: 'gates-of-olympus', name: 'Gates of Olympus', provider: 'Pragmatic Play', rtp: '96.50%', icon: '⚡' },
      { id: 'big-bass-bonanza', name: 'Big Bass Bonanza', provider: 'Pragmatic Play', rtp: '96.71%', icon: '🎣' },
      { id: 'book-of-dead', name: 'Book of Dead', provider: 'Play\u2019n GO', rtp: '96.21%', icon: '📖' },
      { id: 'fruit-party', name: 'Fruit Party', provider: 'Pragmatic Play', rtp: '96.48%', icon: '🍇' },
      { id: 'buffalo-king', name: 'Buffalo King', provider: 'Pragmatic Play', rtp: '96.06%', icon: '🦬' },
      { id: 'wolf-gold', name: 'Wolf Gold', provider: 'Pragmatic Play', rtp: '96.01%', icon: '🐺' },
      { id: 'sugar-rush', name: 'Sugar Rush', provider: 'Pragmatic Play', rtp: '96.54%', icon: '🍭' },
    ],
  },
  {
    id: 'table',
    name: 'Table Games',
    tagline: 'Classic casino tables with RNG cards and wheels',
    games: [
      { id: 'blackjack', name: 'Blackjack', provider: 'BETVORA Studio', rtp: '99.28%', icon: '🂡' },
      { id: 'roulette', name: 'Roulette', provider: 'BETVORA Studio', rtp: '97.30%', icon: '🎡' },
      { id: 'baccarat', name: 'Baccarat', provider: 'BETVORA Studio', rtp: '98.94%', icon: '🎴' },
      { id: 'poker', name: 'Poker', provider: 'BETVORA Studio', rtp: '97.50%', icon: '🃏' },
      { id: 'caribbean-stud', name: 'Caribbean Stud Poker', provider: 'BETVORA Studio', rtp: '96.10%', icon: '🏝️' },
      { id: 'casino-holdem', name: 'Casino Hold\u2019em', provider: 'BETVORA Studio', rtp: '97.35%', icon: '♠️' },
      { id: 'three-card-poker', name: 'Three Card Poker', provider: 'BETVORA Studio', rtp: '96.90%', icon: '🎲' },
      { id: 'sic-bo', name: 'Sic Bo', provider: 'BETVORA Studio', rtp: '97.22%', icon: '🎯' },
      { id: 'craps', name: 'Craps', provider: 'BETVORA Studio', rtp: '98.15%', icon: '🎰' },
    ],
  },
  {
    id: 'live',
    name: 'Live Casino',
    tagline: 'Real dealers, streamed straight to your device',
    live: true,
    games: [
      { id: 'live-blackjack', name: 'Live Blackjack', provider: 'Evolution', rtp: '99.28%', icon: '🎥' },
      { id: 'live-roulette', name: 'Live Roulette', provider: 'Evolution', rtp: '97.30%', icon: '🟥' },
      { id: 'live-baccarat', name: 'Live Baccarat', provider: 'Evolution', rtp: '98.94%', icon: '🟩' },
      { id: 'live-poker', name: 'Live Poker', provider: 'Evolution', rtp: '97.50%', icon: '🎬' },
      { id: 'dream-catcher', name: 'Dream Catcher', provider: 'Evolution', rtp: '96.58%', icon: '🎯' },
      { id: 'monopoly-live', name: 'Monopoly Live', provider: 'Evolution', rtp: '96.23%', icon: '🎩' },
      { id: 'crazy-time', name: 'Crazy Time', provider: 'Evolution', rtp: '96.08%', icon: '🎪' },
      { id: 'mega-wheel', name: 'Mega Wheel', provider: 'Pragmatic Play', rtp: '96.20%', icon: '🛞' },
      { id: 'lightning-roulette', name: 'Lightning Roulette', provider: 'Evolution', rtp: '97.10%', icon: '⚡' },
    ],
  },
  {
    id: 'instant',
    name: 'Instant Win',
    tagline: 'Fast-resolving games with instant payouts',
    games: [
      { id: 'aviator', name: 'Aviator', provider: 'Spribe', rtp: '97.00%', icon: '✈️' },
      { id: 'crash', name: 'Crash', provider: 'Spribe', rtp: '97.00%', icon: '💥' },
      { id: 'jetx', name: 'JetX', provider: 'SmartSoft', rtp: '96.80%', icon: '🚀' },
      { id: 'spaceman', name: 'Spaceman', provider: 'Pragmatic Play', rtp: '96.50%', icon: '👨‍🚀' },
      { id: 'plinko', name: 'Plinko', provider: 'Spribe', rtp: '96.60%', icon: '📌' },
      { id: 'mines', name: 'Mines', provider: 'Spribe', rtp: '97.00%', icon: '💣' },
      { id: 'dice', name: 'Dice', provider: 'BETVORA Studio', rtp: '99.00%', icon: '🎲' },
      { id: 'hi-lo', name: 'Hi-Lo', provider: 'BETVORA Studio', rtp: '97.50%', icon: '🔀' },
      { id: 'keno', name: 'Keno', provider: 'BETVORA Studio', rtp: '95.00%', icon: '🎱' },
      { id: 'wheel-of-fortune', name: 'Wheel of Fortune', provider: 'BETVORA Studio', rtp: '96.00%', icon: '🎡' },
    ],
  },
  {
    id: 'crash',
    name: 'Crash Games',
    tagline: 'Cash out before the multiplier blows up',
    games: [
      { id: 'aviator', name: 'Aviator', provider: 'Spribe', rtp: '97.00%', icon: '✈️' },
      { id: 'jetx', name: 'JetX', provider: 'SmartSoft', rtp: '96.80%', icon: '🚀' },
      { id: 'spaceman', name: 'Spaceman', provider: 'Pragmatic Play', rtp: '96.50%', icon: '👨‍🚀' },
      { id: 'balloon', name: 'Balloon', provider: 'BETVORA Studio', rtp: '96.40%', icon: '🎈' },
      { id: 'crash', name: 'Crash', provider: 'Spribe', rtp: '97.00%', icon: '💥' },
      { id: 'rocketx', name: 'RocketX', provider: 'SmartSoft', rtp: '96.90%', icon: '🛰️' },
    ],
  },
  {
    id: 'cards',
    name: 'Card Games',
    tagline: 'Local and international card favourites',
    games: [
      { id: 'poker', name: 'Poker', provider: 'BETVORA Studio', rtp: '97.50%', icon: '🃏' },
      { id: 'teen-patti', name: 'Teen Patti', provider: 'BETVORA Studio', rtp: '96.50%', icon: '🂭' },
      { id: 'rummy', name: 'Rummy', provider: 'BETVORA Studio', rtp: '96.80%', icon: '🀄' },
      { id: 'andar-bahar', name: 'Andar Bahar', provider: 'BETVORA Studio', rtp: '97.20%', icon: '🃁' },
      { id: 'baccarat', name: 'Baccarat', provider: 'BETVORA Studio', rtp: '98.94%', icon: '🎴' },
      { id: 'blackjack', name: 'Blackjack', provider: 'BETVORA Studio', rtp: '99.28%', icon: '🂡' },
    ],
  },
  {
    id: 'numbers',
    name: 'Number Games',
    tagline: 'Lotto-style draws and number pools',
    games: [
      { id: 'lucky-numbers', name: 'Lucky Numbers', provider: 'BETVORA Studio', rtp: '90.00%', icon: '🔢' },
      { id: 'keno', name: 'Keno', provider: 'BETVORA Studio', rtp: '95.00%', icon: '🎱' },
      { id: 'bingo', name: 'Bingo', provider: 'BETVORA Studio', rtp: '94.00%', icon: '🅱️' },
      { id: 'lotto', name: 'Lotto', provider: 'BETVORA Studio', rtp: '50.00%', icon: '🎫' },
      { id: 'powerball', name: 'Powerball', provider: 'BETVORA Studio', rtp: '48.00%', icon: '💰' },
      { id: 'daily-draw', name: 'Daily Draw', provider: 'BETVORA Studio', rtp: '85.00%', icon: '📅' },
      { id: 'spin-and-win', name: 'Spin & Win', provider: 'BETVORA Studio', rtp: '92.00%', icon: '🔄' },
    ],
  },
  {
    id: 'arcade',
    name: 'Arcade',
    tagline: 'Skill-flavoured instant play hits',
    games: [
      { id: 'penalty-shootout', name: 'Penalty Shootout', provider: 'BETVORA Studio', rtp: '95.00%', icon: '⚽' },
      { id: 'goal', name: 'Goal', provider: 'BETVORA Studio', rtp: '95.50%', icon: '🥅' },
      { id: 'football-x', name: 'Football X', provider: 'BETVORA Studio', rtp: '96.00%', icon: '🏟️' },
      { id: 'basketball-shoot', name: 'Basketball Shoot', provider: 'BETVORA Studio', rtp: '95.50%', icon: '🏀' },
      { id: 'coin-flip', name: 'Coin Flip', provider: 'BETVORA Studio', rtp: '98.00%', icon: '🪙' },
      { id: 'balloon', name: 'Balloon', provider: 'BETVORA Studio', rtp: '96.40%', icon: '🎈' },
      { id: 'treasure-hunt', name: 'Treasure Hunt', provider: 'BETVORA Studio', rtp: '94.00%', icon: '🗺️' },
    ],
  },
]

export const CRASH_GAMES = [
  { id: 'aviator', name: 'Aviator', icon: '✈️', provider: 'Spribe', multiplier: 'up to ×1000', popularity: 'Top', color: '#1E88E5' },
  { id: 'jetx', name: 'JetX', icon: '🚀', provider: 'SmartSoft', multiplier: 'up to ×500', popularity: 'Hot', color: '#FFC107' },
  { id: 'spaceman', name: 'Spaceman', icon: '👨‍🚀', provider: 'Pragmatic Play', multiplier: 'up to ×5000', popularity: 'New', color: '#4CAF50' },
  { id: 'balloon', name: 'Balloon', icon: '🎈', provider: 'BETVORA Studio', multiplier: 'up to ×100', popularity: 'Classic', color: '#F44336' },
  { id: 'crash', name: 'Crash', icon: '💥', provider: 'Spribe', multiplier: 'up to ×1000', popularity: 'Top', color: '#9C27B0' },
  { id: 'rocketx', name: 'RocketX', icon: '🛰️', provider: 'SmartSoft', multiplier: 'up to ×250', popularity: 'Classic', color: '#00E5FF' },
]

export const VIRTUAL_SPORTS = [
  { id: 'vfootball', name: 'Virtual Football', icon: '⚽', accent: '#4CAF50', detail: '11-a-side matches with a result every 4 minutes', markets: ['Match Winner', 'Over/Under 2.5', 'Both Teams to Score'], raceLen: '4 min' },
  { id: 'vhorses', name: 'Virtual Horse Racing', icon: '🏇', accent: '#FFC107', detail: '16-runner fields, odds refresh between races', markets: ['Win', 'Each Way', 'Top 3 Finish'], raceLen: '3 min' },
  { id: 'vgreyhounds', name: 'Virtual Greyhound Racing', icon: '🐕', accent: '#1E88E5', detail: '6-trap sprints with fixed win and each-way markets', markets: ['Trap Winner', 'Each Way', 'Double'], raceLen: '90 sec' },
  { id: 'vtennis', name: 'Virtual Tennis', icon: '🎾', accent: '#FFD54F', detail: 'Best-of-three sets simulated in minutes', markets: ['Match Winner', 'Set Winner', 'Total Games'], raceLen: '2 min' },
  { id: 'vbasketball', name: 'Virtual Basketball', icon: '🏀', accent: '#FF7043', detail: 'Fast 4-quarter games with live momentum swings', markets: ['Match Winner', 'Point Spread', 'Total Points'], raceLen: '3 min' },
  { id: 'vcricket', name: 'Virtual Cricket', icon: '🏏', accent: '#4FC3F7', detail: 'T10 overs simulated ball-by-ball', markets: ['Match Winner', 'Highest Over', 'Team Total'], raceLen: '5 min' },
  { id: 'vcycling', name: 'Virtual Cycling', icon: '🚴', accent: '#AB47BC', detail: '6-rider sprint finals with head-to-head odds', markets: ['Race Winner', 'Podium', 'Head-to-Head'], raceLen: '60 sec' },
]

export const GAME_BANNER = {
  title: 'The floor is open',
  subtitle: 'Slots, live dealers, crash games and instant wins — all on your BETVORA wallet.',
}
