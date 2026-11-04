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

export async function deleteUser(userId) {
  await delay()
  writeUsers(readUsers().filter((u) => u.id !== userId))
  mirrorDelete(COLLECTIONS.users, userId)
}
