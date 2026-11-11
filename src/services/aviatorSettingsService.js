import { cloudEnabled, cloudGet, cloudSet, readLocal, writeLocal } from './cloudSync'

const LOCAL_KEY = 'betvora_aviator_global_settings'
const DOC_ID = 'global'

const DEFAULTS = {
  enabled: true,
  minStake: 10,
  maxStake: 100000,
  houseEdge: 1, // percent of rounds that bust instantly
  growthRate: 0.14,
  forceCrash: null, // number or null
  maxMultiplier: 1000,
}

export function readAviatorGlobalSettings() {
  const cached = readLocal(LOCAL_KEY, null)
  return { ...DEFAULTS, ...(cached || {}) }
}

export async function fetchAviatorGlobalSettings() {
  if (!cloudEnabled()) return readAviatorGlobalSettings()
  const remote = await cloudGet('aviatorSettings', DOC_ID)
  if (remote === undefined) return readAviatorGlobalSettings()
  if (remote === null) return readAviatorGlobalSettings()
  const merged = { ...DEFAULTS, ...remote }
  writeLocal(LOCAL_KEY, merged)
  return merged
}

export async function saveAviatorGlobalSettings(settings) {
  const merged = { ...DEFAULTS, ...readAviatorGlobalSettings(), ...settings }
  writeLocal(LOCAL_KEY, merged)
  if (cloudEnabled()) {
    const ok = await cloudSet('aviatorSettings', DOC_ID, merged)
    if (!ok) throw new Error('Could not save aviator settings.')
  }
  return merged
}
