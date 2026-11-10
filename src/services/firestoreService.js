// Firestore gateway.
//
// When Firebase is configured this module provides:
//   • seedFirestoreData()   — idempotently seeds the demo collections
//   • hydrateFromFirestore()— pulls seeded collections into localStorage
//   • mirrorPersist / mirrorDelete — every local write also lands in Firestore
//
// When Firebase is NOT configured every function is a safe no-op, so the
// whole app keeps running on localStorage (offline demo mode).

import { isFirebaseConfigured, ensureFirebase } from './firebase'
// no demo data in live mode
import { currencySymbol } from '../utils/format'


const ADMIN_PASSWORD = 'Admin@123'

export const COLLECTIONS = {
  users: 'users',
  wallets: 'wallets',
  bets: 'bets',
  matches: 'matches',
  promotions: 'promotions',
  notifications: 'notifications',
  banners: 'banners',
}

export const LOCAL_KEYS = {
  users: 'betvora_users',
  bets: 'betvora_bets',
  matches: 'betvora_matches',
  promotions: 'betvora_promotions',
  notifications: 'betvora_notifications',
  banners: 'betvora_banners',
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




function seedUsers() {
  return [
    {
      id: 'admin1',
      fullName: 'Betvora Admin One',
      email: 'admin1@betvora.app',
      phone: '+233 20 000 0001',
      password: 'Admin1@2026',
      country: 'GH',
      currency: 'GHS',
      isVerified: true,
      isSuspended: false,
      role: 'admin',
      referralCode: 'BV-ADMIN1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'admin2',
      fullName: 'Betvora Admin Two',
      email: 'admin2@betvora.app',
      phone: '+233 20 000 0002',
      password: 'Admin2@2026',
      country: 'GH',
      currency: 'GHS',
      isVerified: true,
      isSuspended: false,
      role: 'admin',
      referralCode: 'BV-ADMIN2',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'agent1',
      fullName: 'Betvora Agent One',
      email: 'agent@betvora.app',
      phone: '+233 20 000 0003',
      password: 'Agent@2026',
      country: 'GH',
      currency: 'GHS',
      isVerified: true,
      isSuspended: false,
      role: 'agent',
      referralCode: 'BV-AGENT1',
      createdAt: new Date().toISOString(),
    },
  ]
}

export async function seedFirestoreData() {
  if (!isAvailable()) return
  // Remove the legacy admin document, if present.
  for (const legacyId of ['u000', 'u001']) {
    try {
      await deleteDocById(COLLECTIONS.users, legacyId)
    } catch {
      /* ignore - may not exist or be denied */
    }
  }
  const users = seedUsers()
  const wallets = users.map((u) => ({
    id: u.id,
    balance: 0,
    bonus: 0,
    currency: u.currency || 'GHS',
    transactions: [],
  }))

  for (const [kind, items] of [
    ['users', users],
    ['wallets', wallets],
  ]) {
    for (const item of items) {
      await writeDoc(kind, item.id, item)
    }
  }

  // Live mode: no demo accounts are seeded.
}

export async function hydrateFromFirestore() {
  if (!isAvailable()) return
  for (const kind of Object.keys(COLLECTIONS)) {
    const key = LOCAL_KEYS[kind]
    if (!key) continue
    try {
      if (localStorage.getItem(key) !== null) continue
      const docs = await listCollection(kind)
      if (docs.length === 0) continue
      if (kind === 'wallets') {
        localStorage.setItem('betvora_wallet', JSON.stringify(docs[0]))
      } else {
        localStorage.setItem(key, JSON.stringify(docs))
      }
    } catch {
      /* leave localStorage untouched */
    }
  }
}

export async function bootstrapFirestore() {
  if (!isAvailable()) return
  try {
    await seedFirestoreData()
    await hydrateFromFirestore()
  } catch (err) {
    console.warn('[firestore] bootstrap skipped — check .env config', err)
  }
}
