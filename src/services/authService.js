// Auth service. Backed by localStorage (auto-fallback demo mode) and, when
// VITE_FIREBASE_* is configured, Firebase Authentication with the local
// store kept as the working profile mirror.

import { DEMO_USER } from '../data/demoData'
import { isFirebaseConfigured, ensureFirebase } from './firebase'
import { COLLECTIONS, mirrorPersist, writeDoc } from './firestoreService'

const USERS_KEY = 'betvora_users'
const SESSION_KEY = 'betvora_session'
const PENDING_KEY = 'betvora_pending'
const DEMO_PASSWORD = 'Demo@123'
const ADMIN_PASSWORD = 'Admin@123'

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const NEW_ADMINS = [
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
]

export function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    if (!users.length) {
      const demo = {
        ...DEMO_USER,
        password: DEMO_PASSWORD,
        country: 'GH',
        currency: 'GHS',
        createdAt: new Date().toISOString(),
      }
      writeUsers([demo, ...NEW_ADMINS])
      return [demo, ...NEW_ADMINS]
    }

    // Migrate: drop the legacy admin account and ensure the two new admins exist.
    let changed = false
    let migrated = users.filter((u) => u.id !== 'u000' && u.email !== 'admin@betvora.app')
    if (migrated.length !== users.length) changed = true

    for (const admin of NEW_ADMINS) {
      const exists = migrated.some((u) => u.id === admin.id || u.email === admin.email)
      if (!exists) {
        migrated = [...migrated, { ...admin, createdAt: admin.createdAt }]
        changed = true
      }
    }

    if (changed) writeUsers(migrated)
    return migrated
  } catch {
    const demo = { ...DEMO_USER, password: DEMO_PASSWORD }
    return [demo, ...NEW_ADMINS]
  }
}

export function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  // Mirror to Firestore without passwords (never persist plaintext creds).
  mirrorPersist(
    COLLECTIONS.users,
    users.map((u) => ({ ...u, password: undefined })),
  )
}

function sanitize(user) {
  if (!user) return null
  const copy = { ...user }
  delete copy.password
  return copy
}

function findUser(users, identifier) {
  const id = String(identifier || '').toLowerCase()
  return users.find((u) => u.email.toLowerCase() === id || u.phone === identifier)
}

export async function register(payload) {
  if (isFirebaseConfigured) {
    try {
      return await registerWithFirebase(payload)
    } catch (err) {
      // Firebase Auth may be unreachable/slow; keep the app usable offline.
      return registerLocal(payload)
    }
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
  await delay()
  const { createUserWithEmailAndPassword } = await import('firebase/auth')
  const { auth } = await ensureFirebase()
  const normalized = email.toLowerCase()
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()
  const credential = await createUserWithEmailAndPassword(auth, normalized, password)
  const user = {
    id: credential.user.uid,
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
    isVerified: true,
    isSuspended: false,
    role: 'user',
    referralCode: `BV-${fullName.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  }
  await writeDoc(COLLECTIONS.users, user.id, user)
  const users = readUsers()
  users.push(user)
  writeUsers(users)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sanitize(user)))
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
  if (users.some((u) => u.email.toLowerCase() === normalized)) {
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
  localStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ email: user.email, code: '123456', purpose: 'verify' }),
  )
  return sanitize(user)
}

export async function login(payload) {
  if (isFirebaseConfigured) {
    try {
      return await loginWithFirebase(payload)
    } catch (err) {
      return loginLocal(payload)
    }
  }
  return loginLocal(payload)
}

async function loginWithFirebase({ identifier, password }) {
  await delay()
  const users = readUsers()
  const localUser = findUser(users, identifier)
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  const { auth } = await ensureFirebase()
  const email = localUser?.email || (/@/.test(identifier) ? String(identifier).toLowerCase() : '')

  let firebaseOk = false
  try {
    await Promise.race([
      signInWithEmailAndPassword(auth, email || identifier, password),
      new Promise((_, reject) => setTimeout(() => reject(new Error('firebase-auth-timeout')), 4000)),
    ])
    firebaseOk = true
  } catch (err) {
    // Demo convenience: local accounts may still sign in even when Firebase
    // Auth is unreachable, restricted, or the account was never created there.
    if (!localUser || localUser.password !== password) throw err
  }

  if (!localUser) throw new Error('Invalid email/phone or password.')
  if (localUser.isSuspended) {
    throw new Error('This account has been suspended. Contact support.')
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sanitize(localUser)))
  return sanitize(localUser)
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
  localStorage.setItem(SESSION_KEY, JSON.stringify(sanitize(user)))
  return sanitize(user)
}

export async function verifyOtp({ email, code }) {
  await delay()
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
  if (pending.email !== email) {
    throw new Error('No verification is pending for this account.')
  }
  if (pending.code !== code) {
    throw new Error('Invalid verification code. Please try again.')
  }
  const users = readUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error('Account not found.')
  user.isVerified = true
  writeUsers(users)
  localStorage.removeItem(PENDING_KEY)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sanitize(user)))
  return sanitize(user)
}

export async function requestPasswordReset({ email }) {
  await delay()
  const users = readUsers()
  const user = findUser(users, email)
  if (!user) {
    throw new Error('No account found for this email.')
  }
  localStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ email: user.email, code: '654321', purpose: 'reset' }),
  )
  return true
}

export async function resetPassword({ email, code, password }) {
  await delay()
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
  if (pending.email !== email || pending.purpose !== 'reset') {
    throw new Error('No password reset is pending for this account.')
  }
  if (pending.code !== code) {
    throw new Error('Invalid verification code. Please try again.')
  }
  const users = readUsers()
  const user = findUser(users, email)
  if (!user) throw new Error('Account not found.')
  user.password = password
  writeUsers(users)
  localStorage.removeItem(PENDING_KEY)
  return sanitize(user)
}

export async function updateProfile(userId, updates) {
  await delay(350)
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('Account not found.')
  Object.assign(user, updates)
  writeUsers(users)
  const clean = sanitize(user)
  localStorage.setItem(SESSION_KEY, JSON.stringify(clean))
  return clean
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  await delay(350)
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('Account not found.')
  if (user.password !== currentPassword) {
    throw new Error('Current password is incorrect.')
  }
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.')
  }
  user.password = newPassword
  writeUsers(users)
  return true
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function logout() {
  if (isFirebaseConfigured) {
    import('firebase/auth')
      .then(({ signOut }) => ensureFirebase().then(({ auth }) => signOut(auth)))
      .catch(() => {})
  }
  localStorage.removeItem(SESSION_KEY)
}

export { DEMO_PASSWORD, ADMIN_PASSWORD }
