// Aviator / crash round helpers.
//
// Every round is generated from a random 64-bit seed. The crash multiplier is
// derived deterministically from the seed, so a round can be re-checked after
// it finishes: same seed + same formula = same crash point.

const HISTORY_KEY = 'betvora_aviator_history'
const SETTINGS_KEY = 'betvora_aviator_settings'
const HISTORY_LIMIT = 25

export function randomSeed() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    .toString(16)
    .padStart(16, '0')
}

/**
 * Convert a hex seed into a crash multiplier.
 * ~1% of rounds bust instantly at 1.00x (house edge), the rest follow the
 * classic exponential distribution used by crash games.
 */
export function crashPointFromSeed(seed) {
  const h = parseInt(String(seed).slice(0, 13), 16)
  if (!Number.isFinite(h)) return 1
  const e = 2 ** 52
  if (h % 33 === 0) return 1
  const point = Math.floor((100 * e - h) / (e - h)) / 100
  return Math.max(1, point)
}

/** Multiplier at a given elapsed time (ms) since the plane took off. */
export function multiplierAt(elapsedMs, rate = 0.14) {
  const seconds = Math.max(0, elapsedMs) / 1000
  return Math.exp(rate * seconds)
}

/** Normalised x/y (0-100) for the flight path graph. */
export function flightPoint(mult, elapsedMs) {
  const x = 6 + Math.min(88, (elapsedMs / 1000) * 2.6)
  const y = 88 - Math.min(76, Math.log(Math.max(1, mult)) * 22)
  return { x, y }
}

function storageAvailable() {
  return typeof localStorage !== 'undefined'
}

function readJson(key, fallback) {
  if (!storageAvailable()) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  if (!storageAvailable()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full / disabled */
  }
}

export function readAviatorHistory(userId) {
  const all = readJson(HISTORY_KEY, {})
  const list = all[userId || 'guest']
  return Array.isArray(list) ? list : []
}

export function saveAviatorRound(userId, round) {
  const all = readJson(HISTORY_KEY, {})
  const key = userId || 'guest'
  const list = Array.isArray(all[key]) ? all[key] : []
  all[key] = [round, ...list].slice(0, HISTORY_LIMIT)
  writeJson(HISTORY_KEY, all)
  return all[key]
}

export function readAviatorSettings(userId) {
  const all = readJson(SETTINGS_KEY, {})
  return all[userId || 'guest'] || {}
}

export function saveAviatorSettings(userId, settings) {
  const all = readJson(SETTINGS_KEY, {})
  all[userId || 'guest'] = settings
  writeJson(SETTINGS_KEY, all)
}
