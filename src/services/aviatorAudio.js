// Small Web Audio synth used by the Aviator and crash games.
// Everything is generated in the browser, so there are no audio assets to load
// and the sounds work offline once the page has had one user gesture.

const MUTE_KEY = 'betvora_sound_muted'
const MASTER_VOLUME = 0.55

let ctx = null
let master = null
let noise = null

function storage() {
  return typeof localStorage !== 'undefined' ? localStorage : null
}

export function isMuted() {
  try {
    return storage()?.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted) {
  try {
    storage()?.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (master && typeof window !== 'undefined') {
    master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.02)
  }
}

function ensureContext() {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  try {
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.value = isMuted() ? 0 : MASTER_VOLUME
    master.connect(ctx.destination)
  } catch {
    ctx = null
    master = null
  }
  return ctx
}

export function unlock() {
  const audio = ensureContext()
  if (!audio) return
  if (audio.state === 'suspended') audio.resume().catch(() => {})
}

function getNoise(audio) {
  if (noise) return noise
  const length = Math.floor(audio.sampleRate * 1.2)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  noise = buffer
  return noise
}

function tone(audio, { type = 'sine', from, to, start = 0, duration = 0.2, volume = 0.2 }) {
  const now = audio.currentTime + start
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(Math.max(1, from), now)
  if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain)
  gain.connect(master)
  osc.start(now)
  osc.stop(now + duration + 0.05)
}

function whoosh(audio, { start = 0, duration = 0.6, from = 1800, to = 260, volume = 0.3, q = 0.7 }) {
  const now = audio.currentTime + start
  const source = audio.createBufferSource()
  source.buffer = getNoise(audio)
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, now)
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + duration)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  source.start(now)
  source.stop(now + duration + 0.05)
}

const SOUNDS = {
  // Plane taking off: rising rumble under an airy sweep.
  takeoff(audio) {
    whoosh(audio, { duration: 0.9, from: 240, to: 2200, volume: 0.18, q: 0.5 })
    tone(audio, { type: 'sawtooth', from: 70, to: 210, duration: 0.9, volume: 0.09 })
    tone(audio, { type: 'sine', from: 220, to: 440, duration: 0.8, volume: 0.05 })
  },

  // Cash out: bright two-note bell with a little sparkle.
  cashout(audio) {
    tone(audio, { type: 'sine', from: 1046.5, duration: 0.18, volume: 0.22 })
    tone(audio, { type: 'sine', from: 1568, start: 0.08, duration: 0.3, volume: 0.2 })
    tone(audio, { type: 'triangle', from: 2093, start: 0.14, duration: 0.22, volume: 0.08 })
  },

  // Fly away: falling engine note, air whoosh and a low thud.
  crash(audio) {
    whoosh(audio, { duration: 0.55, from: 2600, to: 260, volume: 0.34, q: 0.9 })
    tone(audio, { type: 'sawtooth', from: 260, to: 42, duration: 0.55, volume: 0.24 })
    tone(audio, { type: 'sine', from: 96, to: 34, duration: 0.7, volume: 0.3 })
    tone(audio, { type: 'square', from: 180, to: 60, start: 0.02, duration: 0.2, volume: 0.08 })
  },

  // Countdown blip.
  tick(audio) {
    tone(audio, { type: 'sine', from: 720, duration: 0.07, volume: 0.12 })
  },

  // Bet accepted.
  bet(audio) {
    tone(audio, { type: 'triangle', from: 520, to: 840, duration: 0.1, volume: 0.14 })
  },
}

export function play(name) {
  if (isMuted()) return
  const audio = ensureContext()
  if (!audio) return
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {})
  }
  const sound = SOUNDS[name]
  if (!sound) return
  try {
    sound(audio)
  } catch {
    /* audio must never break the game */
  }
}
