// Admin user management backed by the shared auth store.

import { readUsers, writeUsers } from './authService'
import { COLLECTIONS, mirrorDelete } from './firestoreService'

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function publicUser(user) {
  const copy = { ...user }
  delete copy.password
  return copy
}

export async function getAllUsers({ search = '' } = {}) {
  await delay()
  const query = search.trim().toLowerCase()
  return readUsers()
    .filter((u) =>
      query
        ? u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone.includes(query)
        : true,
    )
    .map(publicUser)
}

export async function setUserVerified(userId, verified) {
  await delay()
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  user.isVerified = verified
  writeUsers(users)
  return publicUser(user)
}

export async function setUserSuspended(userId, suspended) {
  await delay()
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  user.isSuspended = suspended
  writeUsers(users)
  return publicUser(user)
}

export async function setUserRole(userId, role) {
  await delay()
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  if (user.role === 'admin') throw new Error('Admin role cannot be changed here.')
  user.role = role
  writeUsers(users)
  return publicUser(user)
}

export async function deleteUser(userId) {
  await delay()
  writeUsers(readUsers().filter((u) => u.id !== userId))
  mirrorDelete(COLLECTIONS.users, userId)
}

export async function createUser({ fullName, email, phone, password, role = 'user', country = 'GH', currency = 'GHS' }) {
  await delay()
  const users = readUsers()
  const normalized = String(email || '').toLowerCase()
  if (!normalized) throw new Error('Email is required.')
  if (users.some((u) => u.email.toLowerCase() === normalized)) {
    throw new Error('An account with this email already exists.')
  }
  const user = {
    id: `u${Date.now()}`,
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
  users.push(user)
  writeUsers(users)
  return publicUser(user)
}
