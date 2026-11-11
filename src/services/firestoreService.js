// Firestore gateway.
//
// When Firebase is configured this module provides:
//   • listCollection / getDocById / writeDoc — direct document access
//   • mirrorPersist / mirrorDelete — every local write also lands in Firestore
//   • bootstrapFirestore() — hydrates the public catalogue on first paint
//
// When Firebase is NOT configured every function is a safe no-op, so the
// whole app keeps running on localStorage.

import { isFirebaseConfigured, ensureFirebase } from './firebase'
import { hydratePublicData } from './cloudSync'

export const COLLECTIONS = {
  users: 'users',
  wallets: 'wallets',
  bets: 'bets',
  matches: 'matches',
  promotions: 'promotions',
  notifications: 'notifications',
  banners: 'banners',
}

export function isAvailable() {
  return isFirebaseConfigured
}

// Firestore rejects `undefined` field values, so strip them (recursively)
// before any write. This also keeps plaintext passwords out of Firestore
// when callers set `password: undefined`.
function cleanForFirestore(value) {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map(cleanForFirestore).filter((v) => v !== undefined)
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      const cleaned = cleanForFirestore(v)
      if (cleaned !== undefined) out[k] = cleaned
    }
    return out
  }
  return value
}

async function ref(kind) {
  const { collection } = await import('firebase/firestore')
  const { db } = await ensureFirebase()
  return collection(db, COLLECTIONS[kind])
}

async function snapshot(kind, ...queryArgs) {
  const { getDocs } = await import('firebase/firestore')
  const base = await ref(kind)
  const q = queryArgs.length ? queryArgs[0] : base
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function listCollection(kind) {
  return snapshot(kind)
}

export async function getDocById(kind, id) {
  const { getDoc, doc } = await import('firebase/firestore')
  const { db } = await ensureFirebase()
  const snap = await getDoc(doc(db, COLLECTIONS[kind], String(id)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function writeDoc(kind, id, data) {
  const { setDoc, doc } = await import('firebase/firestore')
  const { db } = await ensureFirebase()
  const cleaned = cleanForFirestore(data)
  await setDoc(doc(db, COLLECTIONS[kind], String(id)), cleaned, { merge: true })
  return { id, ...cleaned }
}

export async function deleteDocById(kind, id) {
  const { deleteDoc, doc } = await import('firebase/firestore')
  const { db } = await ensureFirebase()
  await deleteDoc(doc(db, COLLECTIONS[kind], String(id)))
}

export async function mirrorPersist(kind, items) {
  if (!isAvailable() || !Array.isArray(items)) return
  try {
    const { writeBatch, doc } = await import('firebase/firestore')
    const { db } = await ensureFirebase()
    const batch = writeBatch(db)
    for (const item of items) {
      if (!item || item.id == null) continue
      batch.set(doc(db, COLLECTIONS[kind], String(item.id)), cleanForFirestore(item), { merge: true })
    }
    await batch.commit()
  } catch (err) {
    console.warn('[firestore] mirror write failed', err)
  }
}

export async function mirrorPersistOne(kind, id, data) {
  if (!isAvailable()) return
  try {
    await writeDoc(kind, id, data)
  } catch (err) {
    console.warn('[firestore] mirror write failed', err)
  }
}

export async function mirrorDelete(kind, id) {
  if (!isAvailable()) return
  try {
    await deleteDocById(kind, id)
  } catch (err) {
    console.warn('[firestore] mirror delete failed', err)
  }
}




export async function bootstrapFirestore() {
  if (!isAvailable()) return
  try {
    // Public content: match catalogue, promotions and banners. Pulling it on
    // every load keeps every device on the same fixtures and offers.
    await hydratePublicData()
  } catch (err) {
    console.warn('[firestore] public hydration skipped — check .env config', err)
  }
}
