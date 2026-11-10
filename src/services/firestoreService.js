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
import { DEMO_USER, MATCHES, PROMOTIONS, BANNERS, demoBets } from '../data/demoData'
import { currencySymbol } from '../utils/format'

const DEMO_PASSWORD = 'Demo@123'
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

function seedPromotions() {
  return PROMOTIONS.map((p) => ({
    ...p,
    percentage: 100,
    maxBonus: 100000,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  }))
}

function seedNotifications() {
  const now = Date.now()
  const sym = currencySymbol('GHS')
  return [
    { id: 'n1001', type: 'bet', title: 'Bet placed', text: 'Your bet #BV10291 has been placed successfully.', read: false, createdAt: new Date(now - 2 * 60 * 1000).toISOString() },
    { id: 'n1002', type: 'win', title: 'Bet won', text: 'Congratulations! Bet #BV10288 has won.', read: false, createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString() },
    { id: 'n1003', type: 'wallet', title: 'Wallet credited', text: `Your wallet has been credited with ${sym}1,250.00.`, read: false, createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'n1004', type: 'system', title: 'Verification successful', text: 'Your account has been verified.', read: true, createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'n1005', type: 'promo', title: 'New promotion available', text: 'Welcome bonus: 100% match in demo cash.', read: true, createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString() },
  ]
}

function seedWallet() {
  const iso = (daysAgo = 0, hoursAgo = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(d.getHours() - hoursAgo)
    return d.toISOString()
  }
  return {
    id: DEMO_USER.id,
    balance: 125430,
    bonus: 25000,
    currency: 'GHS',
    transactions: [
      { id: 'tx1004', type: 'win', amount: 18400, note: 'Winnings — Bet #BV10289', createdAt: iso(0, 6) },
      { id: 'tx1003', type: 'bet', amount: -5000, note: 'Bet placed — #BV10290', createdAt: iso(0, 3) },
      { id: 'tx1002', type: 'deposit', amount: 50000, note: 'Deposit via Mobile Money', createdAt: iso(1) },
      { id: 'tx1001', type: 'bonus', amount: 25000, note: '100% Welcome Bonus', createdAt: iso(1, 2) },
    ],
  }
}

function seedUsers() {
  return [
    { ...DEMO_USER, password: DEMO_PASSWORD, country: 'GH', currency: 'GHS', createdAt: new Date().toISOString() },
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
  try {
    await deleteDocById(COLLECTIONS.users, 'u000')
  } catch {
    /* ignore - may not exist or be denied */
  }
  const users = seedUsers()
  const wallets = [seedWallet()]
  const bets = demoBets()
  const matches = MATCHES
  const promotions = seedPromotions()
  const notifications = seedNotifications()
  const banners = [...BANNERS].sort((a, b) => a.order - b.order)

  for (const [kind, items] of [
    ['users', users],
    ['wallets', wallets],
    ['bets', bets],
    ['matches', matches],
    ['promotions', promotions],
    ['notifications', notifications],
    ['banners', banners],
  ]) {
    for (const item of items) {
      await writeDoc(kind, item.id, item)
    }
  }

  // Optionally ensure the demo + admin accounts exist in Firebase Auth. This
  // probes/creates users and 400s on projects where those accounts don't exist
  // or email/password sign-up is restricted — the app falls back to local
  // accounts for demo login either way. Only run when explicitly requested.
  if (import.meta.env.VITE_SEED_DEMO_AUTH === 'true') {
    const { getAuth } = await import('./firebase')
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = await import('firebase/auth')
    const auth = await getAuth()
    for (const { email, password } of [
      { email: DEMO_USER.email, password: DEMO_PASSWORD },
      { email: 'admin@betvora.app', password: ADMIN_PASSWORD },
    ]) {
      try {
        await signInWithEmailAndPassword(auth, email, password)
      } catch {
        try {
          await createUserWithEmailAndPassword(auth, email, password)
        } catch {
          /* account already exists in Firebase Auth */
        }
      }
    }
    // Leave no hijacked session behind (seed accounts are demo probes only).
    if (auth.currentUser) await signOut(auth)
  }
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
