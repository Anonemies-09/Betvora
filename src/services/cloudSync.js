// Cloud data layer.
//
// Firestore is the shared source of truth for account and money data.
// localStorage stays the fast synchronous cache the UI reads, but every
// meaningful change is written through to Firestore, and each session
// hydrates its cache on login so balances, bets and requests follow the
// user across devices.
//
// Admin/staff sessions pull the shared collections before rendering admin
// screens, so approvals made on one device are visible on another.

import { isFirebaseConfigured, ensureFirebase } from './firebase'

export const CLOUD = {
  users: 'users',
  wallets: 'wallets',
  bets: 'bets',
  depositRequests: 'depositRequests',
  withdrawalRequests: 'withdrawalRequests',
  notifications: 'notifications',
  matches: 'matches',
  promotions: 'promotions',
  banners: 'banners',
  bookingCodes: 'bookingCodes',
}

export const LOCAL = {
  users: 'betvora_users',
  wallets: 'betvora_wallets',
  bets: 'betvora_bets',
  depositRequests: 'betvora_deposit_requests',
  withdrawalRequests: 'betvora_withdrawal_requests',
  notifications: 'betvora_notifications',
  matches: 'betvora_matches',
  promotions: 'betvora_promotions',
  banners: 'betvora_banners',
  bookingCodes: 'betvora_booking_codes',
}

const WRITE_TIMEOUT = 20000
const READ_TIMEOUT = 20000
const TIMEOUT = '__betvora_timeout__'

export function cloudEnabled() {
  return isFirebaseConfigured && typeof window !== 'undefined'
}

async function api() {
  const [mod, { db }] = await Promise.all([import('firebase/firestore'), ensureFirebase()])
  return { mod, db }
}

function withTimeout(promise, ms) {
  let timer
  const guard = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMEOUT), ms)
  })
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
}

/* ------------------------------------------------------------------ */
/* Local cache helpers                                                 */
/* ------------------------------------------------------------------ */

// Firestore rejects undefined values; strip them recursively.
export function clean(value) {
  if (value === undefined) return undefined
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined)
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {}
    for (const [key, item] of Object.entries(value)) {
      const next = clean(item)
      if (next !== undefined) out[key] = next
    }
    return out
  }
  return value
}

export function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota errors */
  }
}

export function sortNewest(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt || b.placedAt || 0) - new Date(a.createdAt || a.placedAt || 0),
  )
}

export function mergeById(existing, incoming, keepLocalFields = []) {
  const map = new Map()
  for (const item of existing || []) map.set(String(item.id), item)
  for (const item of incoming || []) {
    const prior = map.get(String(item.id))
    const merged = { ...prior, ...item }
    for (const field of keepLocalFields) {
      if (prior?.[field] !== undefined) merged[field] = prior[field]
    }
    map.set(String(item.id), merged)
  }
  return sortNewest([...map.values()])
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export async function currentUid() {
  if (!cloudEnabled()) return null
  try {
    const { auth } = await ensureFirebase()
    return auth.currentUser?.uid || null
  } catch {
    return null
  }
}

/**
 * Read one document. Returns the document, `null` when Firestore confirms it
 * does not exist, or `undefined` when the read failed or timed out. Callers
 * must not treat `undefined` as "missing": creating a default document on a
 * timeout is how a slow network could overwrite a real wallet.
 */
export async function cloudGet(collection, id) {
  if (!cloudEnabled() || id == null || id === '') return null
  try {
    const { mod, db } = await api()
    const result = await withTimeout(mod.getDoc(mod.doc(db, collection, String(id))), READ_TIMEOUT)
    if (result === TIMEOUT) return undefined
    if (!result.exists()) return null
    return { id: result.id, ...result.data() }
  } catch (err) {
    console.warn(`[cloud] read ${collection}/${id} failed`, err?.code || err?.message || err)
    return undefined
  }
}

/** Write one document. Resolves true only once Firestore acknowledges it. */
export async function cloudSet(collection, id, data) {
  if (!cloudEnabled() || id == null || id === '') return false
  try {
    const { mod, db } = await api()
    const result = await withTimeout(
      mod.setDoc(mod.doc(db, collection, String(id)), clean(data), { merge: true }),
      WRITE_TIMEOUT,
    )
    if (result === TIMEOUT) {
      console.warn(`[cloud] write ${collection}/${id} timed out`)
      return false
    }
    return true
  } catch (err) {
    console.warn(`[cloud] write ${collection}/${id} failed`, err?.code || err?.message || err)
    return false
  }
}

export async function cloudDelete(collection, id) {
  if (!cloudEnabled() || id == null) return false
  try {
    const { mod, db } = await api()
    const result = await withTimeout(mod.deleteDoc(mod.doc(db, collection, String(id))), WRITE_TIMEOUT)
    return result !== TIMEOUT
  } catch (err) {
    console.warn(`[cloud] delete ${collection}/${id} failed`, err?.code || err?.message || err)
    return false
  }
}

export async function cloudList(collection) {
  if (!cloudEnabled()) return null
  try {
    const { mod, db } = await api()
    const result = await withTimeout(mod.getDocs(mod.collection(db, collection)), READ_TIMEOUT)
    if (result === TIMEOUT) return null
    return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.warn(`[cloud] list ${collection} failed`, err?.code || err?.message || err)
    return null
  }
}

export async function cloudListByUser(collection, uid) {
  if (!cloudEnabled() || !uid) return null
  try {
    const { mod, db } = await api()
    const query = mod.query(mod.collection(db, collection), mod.where('userId', '==', uid))
    const result = await withTimeout(mod.getDocs(query), READ_TIMEOUT)
    if (result === TIMEOUT) return null
    return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (err) {
    console.warn(`[cloud] list ${collection} for ${uid} failed`, err?.code || err?.message || err)
    return null
  }
}

/**
 * Run a Firestore transaction. Used for money movements (approving a deposit,
 * reserving a withdrawal) so the wallet and request can never disagree.
 */
export async function cloudTransaction(work) {
  if (!cloudEnabled()) return null
  const { mod, db } = await api()
  const result = await withTimeout(
    mod.runTransaction(db, (transaction) => work({ mod, db, transaction })),
    15000,
  )
  if (result === TIMEOUT) {
    throw new Error('The server took too long to respond. Check your connection and try again.')
  }
  return result
}

/* ------------------------------------------------------------------ */
/* Hydration                                                           */
/* ------------------------------------------------------------------ */

function mergeWallet(uid, wallet) {
  const wallets = readLocal(LOCAL.wallets, {})
  const existing = wallets[uid] || {}
  wallets[uid] = { ...existing, ...wallet, id: uid }
  writeLocal(LOCAL.wallets, wallets)
}

/** Update the local wallet cache without triggering another cloud write. */
export function cacheWallet(uid, wallet) {
  mergeWallet(uid, wallet)
}

export function replaceUserSlice(uid, key, incoming) {
  if (!incoming) return
  const existing = readLocal(LOCAL[key], [])
  const mine = existing.filter((item) => item.userId !== uid)
  writeLocal(LOCAL[key], sortNewest([...mine, ...incoming]))
}

function mergeUserSlice(uid, key, incoming) {
  if (!incoming) return
  writeLocal(LOCAL[key], mergeById(readLocal(LOCAL[key], []), incoming))
}

/** Pull everything that belongs to one user into the local cache. */
export async function hydrateUserData(uid) {
  if (!cloudEnabled() || !uid) return false
  const [wallet, bets, deposits, withdrawals, notifications] = await Promise.all([
    cloudGet(CLOUD.wallets, uid),
    cloudListByUser(CLOUD.bets, uid),
    cloudListByUser(CLOUD.depositRequests, uid),
    cloudListByUser(CLOUD.withdrawalRequests, uid),
    cloudListByUser(CLOUD.notifications, uid),
  ])

  if (wallet) mergeWallet(uid, wallet)
  if (bets) replaceUserSlice(uid, LOCAL.bets, bets)
  // Requests/notifications are additive: keep anything created while offline.
  mergeUserSlice(uid, LOCAL.depositRequests, deposits)
  mergeUserSlice(uid, LOCAL.withdrawalRequests, withdrawals)
  mergeUserSlice(uid, LOCAL.notifications, notifications)
  return true
}

/** Pull the shared collections an admin/agent needs. */
export async function pullStaffData() {
  if (!cloudEnabled()) return false
  // Agents work bets and payment requests but must not read the user directory.
  const session = readLocal('betvora_session', null)
  const canListUsers = session?.role === 'admin'
  const [users, wallets, bets, deposits, withdrawals] = await Promise.all([
    canListUsers ? cloudList(CLOUD.users) : Promise.resolve(null),
    cloudList(CLOUD.wallets),
    cloudList(CLOUD.bets),
    cloudList(CLOUD.depositRequests),
    cloudList(CLOUD.withdrawalRequests),
  ])

  if (users) {
    // The cloud directory is authoritative: drop profiles that were deleted
    // elsewhere, but keep any locally cached plaintext password for accounts
    // that still exist.
    const local = readLocal(LOCAL.users, [])
    const passwords = new Map(
      local
        .filter((u) => u.password)
        .map((u) => [String(u.id), u.password]),
    )
    const merged = users.map((u) =>
      passwords.has(String(u.id)) ? { ...u, password: passwords.get(String(u.id)) } : u,
    )
    writeLocal(LOCAL.users, sortNewest(merged))
  }
  if (wallets) {
    const local = readLocal(LOCAL.wallets, {})
    for (const wallet of wallets) local[wallet.id] = { ...local[wallet.id], ...wallet }
    writeLocal(LOCAL.wallets, local)
  }
  // Attach each player's identity to their wallet so agents, who cannot list
  // the user directory, can still pick the right player when booking a bet.
  if (users) {
    const local = readLocal(LOCAL.wallets, {})
    const patches = []
    for (const user of users) {
      if (!user?.id || !user.email) continue
      const identity = {
        email: user.email,
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role || 'user',
      }
      const existing = local[user.id]
      if (!existing) continue
      local[user.id] = { ...existing, ...identity, id: user.id }
      if (
        existing.email !== identity.email ||
        existing.fullName !== identity.fullName ||
        existing.role !== identity.role
      ) {
        patches.push(cloudSet(CLOUD.wallets, user.id, identity))
      }
    }
    writeLocal(LOCAL.wallets, local)
    if (patches.length) void Promise.allSettled(patches)
  }
  // Bets and payment requests are always written to the cloud before they are
  // cached locally, so the remote set is authoritative for staff views. Replace
  // (rather than merge) so staff devices drop bets or requests that no longer
  // exist remotely instead of resurrecting them on the next settlement.
  if (bets) writeLocal(LOCAL.bets, sortNewest(bets))
  if (deposits) writeLocal(LOCAL.depositRequests, sortNewest(deposits))
  if (withdrawals) writeLocal(LOCAL.withdrawalRequests, sortNewest(withdrawals))
  return true
}

/** Pull a single user's wallet (used by wallet refresh and approval flows). */
export async function hydrateWallet(uid) {
  if (!cloudEnabled() || !uid) return null
  const wallet = await cloudGet(CLOUD.wallets, uid)
  if (wallet) mergeWallet(uid, wallet)
  return wallet
}

function walletIdentity(profile) {
  if (!profile) return null
  const identity = {
    email: profile.email || '',
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    role: profile.role || 'user',
  }
  return identity.email ? identity : null
}

export async function ensureWalletDoc(uid, profile) {
  if (!cloudEnabled() || !uid) return null
  const existing = await cloudGet(CLOUD.wallets, uid)
  // Unknown (offline / timeout): keep the cached wallet and never write a
  // default balance, or a dropped connection could wipe real money.
  if (existing === undefined) return null
  const identity = walletIdentity(profile)
  if (existing) {
    mergeWallet(uid, identity ? { ...existing, ...identity } : existing)
    // Identity-only merge: never touch balance or transactions here.
    if (identity) void cloudSet(CLOUD.wallets, uid, identity)
    return existing
  }
  const wallet = {
    id: uid,
    balance: 0,
    bonus: 0,
    currency: 'GHS',
    transactions: [],
    ...(identity || {}),
  }
  await cloudSet(CLOUD.wallets, uid, wallet)
  mergeWallet(uid, wallet)
  return wallet
}

/**
 * Merge a player's display identity onto their wallet document so staff can
 * tell players apart when creating bookings. Never writes money fields.
 */
export async function writeWalletIdentity(uid, profile) {
  if (!uid) return false
  const identity = walletIdentity(profile)
  if (!identity) return false
  const wallets = readLocal(LOCAL.wallets, {})
  if (!wallets[uid]) return false
  wallets[uid] = { ...wallets[uid], ...identity, id: uid }
  writeLocal(LOCAL.wallets, wallets)
  if (!cloudEnabled()) return false
  return cloudSet(CLOUD.wallets, uid, identity)
}

/** Public content: match catalogue, promotions and banners. */
export async function hydratePublicData() {
  if (!cloudEnabled()) return false
  const [matches, promotions, banners] = await Promise.all([
    cloudList(CLOUD.matches),
    cloudList(CLOUD.promotions),
    cloudList(CLOUD.banners),
  ])
  let hydrated = false
  if (matches && matches.length) {
    writeLocal(LOCAL.matches, sortNewest(matches))
    hydrated = true
  }
  if (promotions && promotions.length) {
    writeLocal(LOCAL.promotions, sortNewest(promotions))
    hydrated = true
  }
  if (banners && banners.length) {
    writeLocal(LOCAL.banners, sortNewest(banners))
    hydrated = true
  }
  return hydrated
}

/* ------------------------------------------------------------------ */
/* Live subscriptions                                                  */
/* ------------------------------------------------------------------ */

/**
 * Watch a user's wallet document. Returns an unsubscribe function.
 * Used so an admin action on one device reaches the user's open session.
 */
export function subscribeWallet(uid, onWallet) {
  let unsubscribe = () => {}
  if (!cloudEnabled() || !uid) return unsubscribe

  ;(async () => {
    try {
      const { mod, db } = await api()
      unsubscribe = mod.onSnapshot(
        mod.doc(db, CLOUD.wallets, uid),
        (snap) => {
          if (!snap.exists()) return
          const wallet = { id: snap.id, ...snap.data() }
          mergeWallet(uid, wallet)
          onWallet(wallet)
        },
        (err) => console.warn('[cloud] wallet subscription failed', err?.code || err?.message),
      )
    } catch (err) {
      console.warn('[cloud] wallet subscription skipped', err?.code || err?.message)
    }
  })()

  return () => {
    try {
      unsubscribe()
    } catch {
      /* ignore */
    }
  }
}

/** Watch a user's notifications so new ones appear without a reload. */
export function subscribeNotifications(uid, onNotifications) {
  let unsubscribe = () => {}
  if (!cloudEnabled() || !uid) return unsubscribe

  ;(async () => {
    try {
      const { mod, db } = await api()
      const query = mod.query(
        mod.collection(db, CLOUD.notifications),
        mod.where('userId', '==', uid),
      )
      unsubscribe = mod.onSnapshot(
        query,
        (snap) => {
          const incoming = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          if (incoming.length === 0) return
          mergeUserSlice(uid, LOCAL.notifications, incoming)
          onNotifications()
        },
        (err) => console.warn('[cloud] notification subscription failed', err?.code || err?.message),
      )
    } catch (err) {
      console.warn('[cloud] notification subscription skipped', err?.code || err?.message)
    }
  })()

  return () => {
    try {
      unsubscribe()
    } catch {
      /* ignore */
    }
  }
}
