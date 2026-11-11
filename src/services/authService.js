// Auth service.
//
// Firebase Authentication owns credentials; Firestore owns the shared profile
// (`users/{uid}`). localStorage keeps a synchronous profile/session cache so
// the UI can render instantly and the app still works on a flaky connection.
//
// Existing accounts that were created in an earlier localStorage-only build
// are migrated the first time their owner signs in: the Firebase Auth account
// is created with the same credentials and their local money data is moved to
// the new uid.

import { isFirebaseConfigured, ensureFirebase, firebaseConfig } from './firebase'
import {
  CLOUD,
  LOCAL,
  cloudGet,
  cloudSet,
  ensureWalletDoc,
  hydrateUserData,
  readLocal,
  writeLocal,
} from './cloudSync'

const USERS_KEY = LOCAL.users
const SESSION_KEY = 'betvora_session'
const PENDING_KEY = 'betvora_pending'

function delay(ms = 450) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safe(promise) {
  return Promise.resolve(promise).catch(() => undefined)
}

const STAFF_SEEDS = [
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
    createdAt: '2026-01-01T00:00:00.000Z',
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
    createdAt: '2026-01-01T00:00:00.000Z',
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
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

export const STAFF_EMAILS = STAFF_SEEDS.map((seed) => seed.email)

function staffSeedFor(email) {
  const normalized = String(email || '').toLowerCase()
  return STAFF_SEEDS.find((seed) => seed.email === normalized) || null
}

function seedProfiles() {
  return STAFF_SEEDS.map((seed) => ({ ...seed }))
}

export function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    if (!Array.isArray(users) || users.length === 0) {
      // Staff seeds only exist in local-only mode. With Firebase configured,
      // the real profiles (keyed by Firebase uid) are the only user records.
      if (isFirebaseConfigured) return []
      writeUsers(seedProfiles())
      return seedProfiles()
    }

    // Drop legacy preview accounts. Staff seeds stay present only offline.
    let changed = false
    let migrated = users.filter(
      (u) => u.id !== 'u000' && u.email !== 'admin@betvora.app' && u.email !== 'demo@betvora.app',
    )
    if (migrated.length !== users.length) changed = true

    if (!isFirebaseConfigured) {
      for (const seed of STAFF_SEEDS) {
        const exists = migrated.some((u) => String(u.email || '').toLowerCase() === seed.email)
        if (!exists) {
          migrated = [...migrated, { ...seed }]
          changed = true
        }
      }
    } else {
      // Clean out stale seed rows left by earlier builds.
      const cleaned = migrated.filter(
        (u) => !['admin1', 'admin2', 'agent1'].includes(String(u.id)),
      )
      if (cleaned.length !== migrated.length) {
        migrated = cleaned
        changed = true
      }
    }

    if (changed) writeUsers(migrated)
    return migrated
  } catch {
    return isFirebaseConfigured ? [] : seedProfiles()
  }
}

export function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* ignore quota errors */
  }
}

function cacheProfile(profile) {
  if (!profile) return
  const users = readUsers()
  const email = String(profile.email || '').toLowerCase()
  const index = users.findIndex(
    (u) => u.id === profile.id || (email && String(u.email || '').toLowerCase() === email),
  )
  if (index >= 0) {
    users[index] = {
      ...users[index],
      ...profile,
      password: users[index].password ?? profile.password,
    }
  } else {
    users.push(profile)
  }
  writeUsers(users)
}

function sanitize(user) {
  if (!user) return null
  const copy = { ...user }
  delete copy.password
  return copy
}

function stripPassword(user) {
  return sanitize(user)
}

function findUser(users, identifier) {
  const value = String(identifier || '').trim()
  const lower = value.toLowerCase()
  return users.find(
    (u) =>
      String(u.email || '').toLowerCase() === lower ||
      String(u.phone || '').replace(/\s/g, '') === value.replace(/\s/g, ''),
  )
}

function isNetworkError(err) {
  const code = err?.code || ''
  const message = String(err?.message || '')
  return (
    code === 'auth/network-request-failed' ||
    code === 'auth/timeout' ||
    message.includes('firebase-auth-timeout') ||
    message.includes('network')
  )
}

function mapRegisterError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return new Error('An account with this email already exists.')
    case 'auth/invalid-email':
      return new Error('Enter a valid email address.')
    case 'auth/weak-password':
      return new Error('Choose a stronger password (at least 8 characters).')
    case 'auth/operation-not-allowed':
      return new Error('Email sign-up is not enabled. Contact support.')
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please wait a moment and try again.')
    case 'auth/network-request-failed':
      return new Error('Cannot reach the server. Check your connection and try again.')
    default:
      return new Error(err?.message || 'Could not create your account.')
  }
}

function setSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sanitize(user)))
  } catch {
    /* ignore quota errors */
  }
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

function buildBasicProfile(firebaseUser) {
  const email = String(firebaseUser.email || '').toLowerCase()
  const name = firebaseUser.displayName || email.split('@')[0] || 'BETVORA player'
  return {
    id: firebaseUser.uid,
    firstName: name.split(' ')[0] || '',
    lastName: name.split(' ').slice(1).join(' '),
    fullName: name,
    email,
    phone: firebaseUser.phoneNumber || '',
    country: 'GH',
    currency: 'GHS',
    isVerified: Boolean(firebaseUser.emailVerified),
    isSuspended: false,
    role: 'user',
    referralCode: `BV-${name.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  }
}

/** Fetch the shared profile for a Firebase user, creating it if necessary. */
async function resolveProfile(firebaseUser) {
  const uid = firebaseUser.uid
  const email = String(firebaseUser.email || '').toLowerCase()
  const cloudProfile = await cloudGet(CLOUD.users, uid)
  let profile = cloudProfile

  if (!profile) {
    const local = readUsers().find(
      (u) =>
        String(u.email || '').toLowerCase() === email ||
        u.id === uid,
    )
    const seed = staffSeedFor(email)
    if (local) {
      profile = { ...local, id: uid }
    } else if (seed) {
      profile = { ...seed, id: uid }
    } else {
      profile = buildBasicProfile(firebaseUser)
    }
    // Only create the shared profile when Firestore confirmed it is missing.
    // On a timeout/offline we keep this session local and retry next login.
    if (cloudProfile === null) {
      await safe(cloudSet(CLOUD.users, uid, stripPassword(profile)))
    }
  }

  profile.id = uid
  if (email) profile.email = email
  if (!profile.fullName) {
    profile.fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || email
  }
  if (!profile.currency) profile.currency = 'GHS'
  if (!profile.country) profile.country = 'GH'
  // Repair profiles stored before the shared schema was complete (some staff
  // records had only id/email/role), so directory screens always get a name.
  if (cloudProfile && (!cloudProfile.fullName || !cloudProfile.currency)) {
    await safe(cloudSet(CLOUD.users, uid, stripPassword(profile)))
  }
  // Keep the flags the security rules compare present on every profile.
  if (typeof profile.isSuspended !== 'boolean') profile.isSuspended = false
  if (typeof profile.isVerified !== 'boolean') profile.isVerified = true
  // Staff identities are fixed: the role is never taken from a mutable cache.
  const seed = staffSeedFor(email)
  if (seed) profile.role = seed.role
  if (!profile.role) profile.role = 'user'
  cacheProfile(profile)
  return profile
}

/** Move a pre-Firebase local account's money data onto its Firebase uid. */
async function migrateLocalAccount(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return
  try {
    const wallets = readLocal(LOCAL.wallets, {})
    if (wallets[oldId]) {
      wallets[newId] = { ...wallets[oldId], id: newId }
      delete wallets[oldId]
      writeLocal(LOCAL.wallets, wallets)
      await safe(cloudSet(CLOUD.wallets, newId, wallets[newId]))
    }
    for (const [key, collection] of [
      [LOCAL.bets, CLOUD.bets],
      [LOCAL.depositRequests, CLOUD.depositRequests],
      [LOCAL.withdrawalRequests, CLOUD.withdrawalRequests],
      [LOCAL.notifications, CLOUD.notifications],
    ]) {
      const items = readLocal(key, [])
      let changed = false
      for (const item of items) {
        if (item.userId === oldId) {
          item.userId = newId
          changed = true
          await safe(cloudSet(collection, item.id, item))
        }
      }
      if (changed) writeLocal(key, items)
    }
  } catch {
    /* migration is best effort */
  }
}

async function finishLogin(firebaseUser, localUser) {
  const profile = await resolveProfile(firebaseUser)

  if (profile.isSuspended) {
    await safe(
      import('firebase/auth').then(({ signOut }) =>
        ensureFirebase().then(({ auth }) => signOut(auth)),
      ),
    )
    throw new Error('This account has been suspended. Contact support.')
  }

  if (localUser && localUser.id !== firebaseUser.uid) {
    await migrateLocalAccount(localUser.id, firebaseUser.uid)
  }

  setSession(profile)
  // Pull the shared data in the background so signing in is instant; the
  // wallet context hydrates its own balance in parallel.
  void safe(hydrateUserData(firebaseUser.uid))
  void safe(ensureWalletDoc(firebaseUser.uid))
  return sanitize(profile)
}

export async function register(payload) {
  if (isFirebaseConfigured) {
    return registerWithFirebase(payload)
  }
  return registerLocal(payload)
}

async function registerWithFirebase({
  firstName,
  lastName,
  email,
  phone,
  password,
  dob,
  idType,
  idNumber,
  country = 'GH',
  currency = 'GHS',
  referredBy = '',
}) {
  await delay(300)
  const { createUserWithEmailAndPassword } = await import('firebase/auth')
  const { auth } = await ensureFirebase()
  const normalized = String(email || '').trim().toLowerCase()
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()

  let credential
  try {
    credential = await createUserWithEmailAndPassword(auth, normalized, password)
  } catch (err) {
    throw mapRegisterError(err)
  }

  const user = {
    id: credential.user.uid,
    firstName,
    lastName,
    fullName,
    email: normalized,
    phone,
    dob,
    idType,
    idNumber,
    country,
    currency,
    referredBy: referredBy || undefined,
    isVerified: true,
    isSuspended: false,
    role: 'user',
    referralCode: `BV-${fullName.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  }

  cacheProfile(user)
  setSession(user)
  await safe(cloudSet(CLOUD.users, user.id, stripPassword(user)))
  await safe(ensureWalletDoc(user.id))
  return sanitize(user)
}

async function registerLocal({
  firstName,
  lastName,
  email,
  phone,
  password,
  dob,
  idType,
  idNumber,
  country = 'GH',
  currency = 'GHS',
  referredBy = '',
}) {
  await delay()
  const users = readUsers()
  const normalized = email.toLowerCase()
  if (users.some((u) => String(u.email || '').toLowerCase() === normalized)) {
    throw new Error('An account with this email already exists.')
  }
  if (users.some((u) => u.phone === phone)) {
    throw new Error('An account with this phone number already exists.')
  }
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()
  const user = {
    id: `u${Date.now()}`,
    firstName,
    lastName,
    fullName,
    email: normalized,
    phone,
    password,
    dob,
    idType,
    idNumber,
    country,
    currency,
    referredBy: referredBy || undefined,
    isVerified: false,
    isSuspended: false,
    role: 'user',
    referralCode: `BV-${fullName.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  writeUsers(users)
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ email: user.email, code: '123456', purpose: 'verify' }),
    )
  } catch {
    /* ignore */
  }
  return sanitize(user)
}

export async function login(payload) {
  if (isFirebaseConfigured) {
    try {
      return await loginWithFirebase(payload)
    } catch (err) {
      // Only a connectivity failure falls back to the cached local account.
      if (isNetworkError(err)) return loginLocal(payload)
      throw err
    }
  }
  return loginLocal(payload)
}

async function loginWithFirebase({ identifier, password }) {
  await delay(250)
  const users = readUsers()
  const localUser = findUser(users, identifier)
  const typed = String(identifier || '').trim()
  const email = localUser?.email || (/@/.test(typed) ? typed.toLowerCase() : '')

  if (!email) {
    throw new Error('Enter the email address linked to your account.')
  }

  const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth')
  const { auth } = await ensureFirebase()

  let credential
  try {
    credential = await signInWithEmailAndPassword(auth, email, password)
  } catch (err) {
    if (isNetworkError(err)) throw err

    const canMigrate = localUser && localUser.password === password
    if (!canMigrate) {
      if (err?.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait a moment and try again.')
      }
      throw new Error('Invalid email/phone or password.')
    }

    // First sign-in for an account created before Firebase Auth existed.
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password)
    } catch (createErr) {
      if (createErr?.code === 'auth/email-already-in-use') {
        throw new Error('Invalid email/phone or password.')
      }
      throw mapRegisterError(createErr)
    }
  }

  return finishLogin(credential.user, localUser)
}

async function loginLocal({ identifier, password }) {
  await delay()
  const users = readUsers()
  const user = findUser(users, identifier)
  if (!user || user.password !== password) {
    throw new Error('Invalid email/phone or password.')
  }
  if (!user.isVerified) {
    throw new Error('Please verify your account before logging in.')
  }
  if (user.isSuspended) {
    throw new Error('This account has been suspended. Contact support.')
  }
  setSession(user)
  return sanitize(user)
}

function waitForAuthUser(auth, preferUser) {
  return new Promise((resolve) => {
    let settled = false
    let unsubscribe = () => {}
    let grace = null

    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (grace) clearTimeout(grace)
      try {
        unsubscribe()
      } catch {
        /* ignore */
      }
      resolve(value)
    }

    const timer = setTimeout(() => finish(null), 9000)

    unsubscribe = auth.onAuthStateChanged(
      (user) => {
        if (user) return finish(user)
        if (!preferUser) return finish(null)
        // A cached session exists: give Firebase a moment to restore it.
        if (!grace) grace = setTimeout(() => finish(null), 2000)
      },
      () => finish(null),
    )
  })
}

/**
 * Restore the signed-in user on boot. Firebase Auth persists the session, so
 * this also picks up a login made in another tab/device session.
 */
export async function restoreSession() {
  const cached = getSession()
  if (!isFirebaseConfigured) return cached

  try {
    const { auth } = await ensureFirebase()
    const firebaseUser = await waitForAuthUser(auth, Boolean(cached))

    if (!firebaseUser) {
      // If Firebase could not verify the user (offline or slow connection),
      // keep the cached session instead of signing a real user out mid-session.
      if (cached) return cached
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    const profile = await resolveProfile(firebaseUser)
    if (profile.isSuspended) {
      await safe(
        import('firebase/auth').then(({ signOut }) => signOut(auth)),
      )
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    setSession(profile)
    void safe(hydrateUserData(firebaseUser.uid))
    void safe(ensureWalletDoc(firebaseUser.uid))
    return sanitize(profile)
  } catch {
    // Offline: trust the cached session rather than signing the user out.
    return cached
  }
}

export async function verifyOtp({ email, code }) {
  await delay()
  let pending = {}
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
  } catch {
    pending = {}
  }
  if (pending.email !== email) {
    throw new Error('No verification is pending for this account.')
  }
  if (pending.code !== code) {
    throw new Error('Invalid verification code. Please try again.')
  }
  const users = readUsers()
  const user = users.find((u) => String(u.email || '').toLowerCase() === email.toLowerCase())
  if (!user) throw new Error('Account not found.')
  user.isVerified = true
  writeUsers(users)
  await safe(cloudSet(CLOUD.users, user.id, stripPassword(user)))
  localStorage.removeItem(PENDING_KEY)
  setSession(user)
  return sanitize(user)
}

export async function requestPasswordReset({ email }) {
  await delay(250)
  if (isFirebaseConfigured) {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth')
      const { auth } = await ensureFirebase()
      await sendPasswordResetEmail(auth, String(email || '').trim().toLowerCase())
    } catch (err) {
      // Never reveal whether an account exists.
      if (isNetworkError(err)) {
        throw new Error('Cannot reach the server. Check your connection and try again.')
      }
    }
    return { sent: true }
  }

  const users = readUsers()
  const user = findUser(users, email)
  if (!user) {
    throw new Error('No account found for this email.')
  }
  localStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ email: user.email, code: '654321', purpose: 'reset' }),
  )
  return { sent: false }
}

export async function resetPassword({ email, code, password }) {
  if (isFirebaseConfigured && !localStorage.getItem(PENDING_KEY)) {
    throw new Error('Open the reset link we emailed you to choose a new password.')
  }
  await delay()
  let pending = {}
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
  } catch {
    pending = {}
  }
  if (pending.email !== email || pending.purpose !== 'reset') {
    throw new Error('No password reset is pending for this account.')
  }
  if (pending.code !== code) {
    throw new Error('Invalid verification code. Please try again.')
  }
  if (String(password || '').length < 8) {
    throw new Error('New password must be at least 8 characters.')
  }
  const users = readUsers()
  const user = findUser(users, email)
  if (!user) throw new Error('Account not found.')
  user.password = password
  writeUsers(users)
  localStorage.removeItem(PENDING_KEY)
  return sanitize(user)
}

const EDITABLE_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'fullName',
  'phone',
  'dob',
  'idType',
  'idNumber',
  'country',
  'currency',
  'referredBy',
  'isVerified',
  'avatar',
  'bankAccounts',
  'preferences',
]

export async function updateProfile(userId, updates) {
  await delay(250)
  const users = readUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) throw new Error('Account not found.')

  const patch = {}
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (updates[field] !== undefined) patch[field] = updates[field]
  }
  users[index] = { ...users[index], ...patch }
  writeUsers(users)

  const clean = sanitize(users[index])
  setSession(clean)
  await safe(cloudSet(CLOUD.users, userId, clean))
  return clean
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  await delay(250)
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('Account not found.')
  if (String(newPassword || '').length < 8) {
    throw new Error('New password must be at least 8 characters.')
  }

  if (isFirebaseConfigured) {
    try {
      const { signInWithEmailAndPassword, updatePassword } = await import('firebase/auth')
      const { auth } = await ensureFirebase()
      const email = auth.currentUser?.email || user.email
      await signInWithEmailAndPassword(auth, email, currentPassword)
      await updatePassword(auth.currentUser, newPassword)
    } catch (err) {
      if (isNetworkError(err)) {
        throw new Error('Cannot reach the server. Check your connection and try again.')
      }
      if (
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/invalid-login-credentials'
      ) {
        throw new Error('Current password is incorrect.')
      }
      throw new Error(err?.message || 'Could not update your password.')
    }
  } else if (user.password !== currentPassword) {
    throw new Error('Current password is incorrect.')
  }

  user.password = newPassword
  writeUsers(users)
  return true
}

export function logout() {
  if (isFirebaseConfigured) {
    import('firebase/auth')
      .then(({ signOut }) => ensureFirebase().then(({ auth }) => signOut(auth)))
      .catch(() => {})
  }
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Create a Firebase Auth account without disturbing the signed-in admin
 * session. Used by the admin "Create Agent" flow.
 */
export async function createAuthAccount(email, password) {
  if (!isFirebaseConfigured) return null
  const [{ initializeApp, deleteApp }, { getAuth, createUserWithEmailAndPassword, signOut }] =
    await Promise.all([import('firebase/app'), import('firebase/auth')])

  const appName = `betvora-admin-${Date.now()}`
  const secondary = initializeApp(firebaseConfig, appName)
  try {
    const secondaryAuth = getAuth(secondary)
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const uid = credential.user.uid
    await safe(signOut(secondaryAuth))
    return uid
  } finally {
    await safe(deleteApp(secondary))
  }
}
