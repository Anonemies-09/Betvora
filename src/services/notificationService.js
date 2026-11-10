// Notification centre, backed by localStorage.
// Phase 16 UI + engine events push through here.

import { COLLECTIONS, mirrorPersist } from './firestoreService'

const NOTIFICATIONS_KEY = 'betvora_notifications'

const SEED = []

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

function browserNotificationsEnabled() {
  try {
    const raw = localStorage.getItem('betvora_settings')
    const settings = raw ? JSON.parse(raw) : {}
    return settings.browserNotifications !== false
  } catch {
    return true
  }
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (!browserNotificationsEnabled()) return
  try {
    // `silent: false` lets the browser/OS play the device's default
    // notification sound. No custom sound is specified on purpose.
    new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      silent: false,
    })
  } catch {
    /* ignore - notifications may be blocked by the browser */
  }
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
    showBrowserNotification(title, text)
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
