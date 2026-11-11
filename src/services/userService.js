// Admin user management, backed by the shared Firestore profile collection.

import { readUsers, writeUsers, createAuthAccount } from './authService'
import { isFirebaseConfigured } from './firebase'
import {
  CLOUD,
  LOCAL,
  cloudDelete,
  cloudEnabled,
  cloudList,
  cloudSet,
  mergeById,
  readLocal,
  writeLocal,
} from './cloudSync'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function publicUser(user) {
  const copy = { ...user }
  delete copy.password
  return copy
}

function persistUsers(users) {
  writeUsers(users)
}

function upsertLocal(user) {
  const users = readUsers()
  const index = users.findIndex((u) => u.id === user.id)
  if (index >= 0) users[index] = { ...users[index], ...user }
  else users.push(user)
  persistUsers(users)
}

export async function refreshUsers() {
  if (cloudEnabled()) {
    const remote = await cloudList(CLOUD.users)
    if (remote) {
      writeLocal(LOCAL.users, mergeById(readLocal(LOCAL.users, []), remote, ['password']))
    }
  }
  return getAllUsers()
}

export async function getAllUsers({ search = '' } = {}) {
  await delay()
  const query = search.trim().toLowerCase()
  return readUsers()
    .filter((u) =>
      query
        ? String(u.fullName || '').toLowerCase().includes(query) ||
          String(u.email || '').toLowerCase().includes(query) ||
          String(u.phone || '').includes(query)
        : true,
    )
    .map(publicUser)
}

async function saveUser(user) {
  if (cloudEnabled()) {
    const saved = await cloudSet(CLOUD.users, user.id, publicUser(user))
    if (!saved) throw new Error('Could not save the account change. Check your connection and try again.')
  }
  upsertLocal(user)
  return publicUser(user)
}

export async function setUserVerified(userId, verified) {
  await delay()
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  user.isVerified = verified
  return saveUser(user)
}

export async function setUserSuspended(userId, suspended) {
  await delay()
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  user.isSuspended = suspended
  return saveUser(user)
}

export async function updateUser(userId, updates) {
  await delay()
  const users = readUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) throw new Error('User not found.')
  const allowed = ['fullName', 'firstName', 'lastName', 'phone', 'country', 'currency', 'isVerified', 'isSuspended', 'role']
  for (const field of allowed) {
    if (updates[field] !== undefined) users[index][field] = updates[field]
  }
  if (updates.fullName && !updates.firstName) {
    const parts = String(updates.fullName).trim().split(/\s+/)
    users[index].firstName = parts[0] || ''
    users[index].lastName = parts.slice(1).join(' ') || ''
  }
  const saved = await saveUser(users[index])
  return saved
}
export async function setUserRole(userId, role) {
  await delay()
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  if (user.role === 'admin') throw new Error('Admin role cannot be changed here.')
  user.role = role
  return saveUser(user)
}

export async function deleteUser(userId) {
  await delay()
  writeUsers(readUsers().filter((u) => u.id !== userId))
  if (cloudEnabled()) await cloudDelete(CLOUD.users, userId)
}

export async function createUser({
  fullName,
  email,
  phone,
  password,
  role = 'user',
  country = 'GH',
  currency = 'GHS',
}) {
  await delay()
  const users = readUsers()
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) throw new Error('Email is required.')
  if (password && String(password).length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  if (users.some((u) => String(u.email || '').toLowerCase() === normalized)) {
    throw new Error('An account with this email already exists.')
  }

  let id = `u${Date.now()}`
  if (isFirebaseConfigured) {
    try {
      const uid = await createAuthAccount(normalized, password)
      if (uid) id = uid
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.')
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error('Choose a stronger password (at least 8 characters).')
      }
      throw new Error(err?.message || 'Could not create the sign-in account.')
    }
  }

  const user = {
    id,
    fullName: fullName || '',
    email: normalized,
    phone: phone || '',
    password,
    country,
    currency,
    isVerified: true,
    isSuspended: false,
    role,
    referralCode: `BV-${String(fullName || '').replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  }

  if (cloudEnabled()) {
    const saved = await cloudSet(CLOUD.users, user.id, publicUser(user))
    if (!saved) throw new Error('Could not save the new account. Check your connection and try again.')
  }
  upsertLocal(user)
  return publicUser(user)
}
