// Notification centre, backed by localStorage.
// Phase 16 UI + engine events push through here.

import { COLLECTIONS, mirrorPersist } from './firestoreService'

const NOTIFICATIONS_KEY = 'betvora_notifications'

const SEED = [
  { id: 'n1001', type: 'bet', title: 'Bet placed', text: 'Your bet #BV10291 has been placed successfully.', read: false, createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: 'n1002', type: 'win', title: 'Bet won', text: 'Congratulations! Bet #BV10288 has won.', read: false, createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  { id: 'n1003', type: 'wallet', title: 'Wallet credited', text: 'Your wallet has been credited with ₵1,250.00.', read: false, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n1004', type: 'system', title: 'Verification successful', text: 'Your account has been verified.', read: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n1005', type: 'promo', title: 'New promotion available', text: 'Welcome bonus: 100% up to ₦100,000.', read: true, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
]

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to seed */
  }
  const seed = SEED.map((n) => ({ ...n }))
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(seed))
  return seed
}

function persist(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  mirrorPersist(COLLECTIONS.notifications, notifications)
}

export async function getNotifications() {
  await delay()
  return readNotifications().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function createNotification({ type = 'system', title, text }) {
  const notifications = readNotifications()
  notifications.unshift({
    id: `n${Date.now()}`,
    type,
    title,
    text,
    read: false,
    createdAt: new Date().toISOString(),
  })
  persist(notifications)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('betvora:notify'))
  }
  return notifications
}

export async function markRead(id) {
  const notifications = readNotifications()
  const target = notifications.find((n) => n.id === id)
  if (target) target.read = true
  persist(notifications)
}

export async function markAllRead() {
  const notifications = readNotifications()
  notifications.forEach((n) => {
    n.read = true
  })
  persist(notifications)
}

export function getUnreadCount() {
  return readNotifications().filter((n) => !n.read).length
}
