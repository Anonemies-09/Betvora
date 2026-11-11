// Notification centre.
//
// Notifications are per-user: each document carries a `userId` so the same
// message appears on every device the user signs in on. localStorage remains
// the synchronous cache and the cloud copy is written in the background.

import { CLOUD, cloudEnabled, cloudSet, readLocal, writeLocal, sortNewest } from './cloudSync'

const NOTIFICATIONS_KEY = 'betvora_notifications'

function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function currentUserId() {
  try {
    const raw = localStorage.getItem('betvora_session')
    const session = raw ? JSON.parse(raw) : null
    return session?.id || ''
  } catch {
    return ''
  }
}

function readNotifications() {
  return readLocal(NOTIFICATIONS_KEY, [])
}

function persist(notifications) {
  writeLocal(NOTIFICATIONS_KEY, notifications)
}

function mine() {
  const uid = currentUserId()
  const all = readNotifications()
  if (!uid) return []
  return all.filter((n) => n.userId === uid)
}

export async function getNotifications() {
  await delay()
  return sortNewest(mine())
}

export function getUnreadCount() {
  return mine().filter((n) => !n.read).length
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

export async function createNotification({ type = 'system', title, text, userId }) {
  const uid = userId || currentUserId()
  if (!uid) return []

  const notification = {
    id: `n${Date.now()}${Math.floor(Math.random() * 1000)}`,
    userId: uid,
    type,
    title,
    text,
    read: false,
    createdAt: new Date().toISOString(),
  }

  const all = readNotifications()
  all.unshift(notification)
  persist(all)

  // Background cloud write keeps the UI instant.
  if (cloudEnabled()) {
    void cloudSet(CLOUD.notifications, notification.id, notification)
  }

  // Only pop the device notification for the user who is actually signed in.
  if (typeof window !== 'undefined' && uid === currentUserId()) {
    window.dispatchEvent(new CustomEvent('betvora:notify'))
    showBrowserNotification(title, text)
  }
  return all
}

export async function markRead(id) {
  const all = readNotifications()
  const target = all.find((n) => n.id === id)
  if (target) target.read = true
  persist(all)
  if (target && cloudEnabled()) {
    void cloudSet(CLOUD.notifications, id, { ...target, read: true })
  }
}

export async function markAllRead() {
  const uid = currentUserId()
  const all = readNotifications()
  for (const notification of all) {
    if (notification.userId === uid) {
      notification.read = true
      if (cloudEnabled()) {
        void cloudSet(CLOUD.notifications, notification.id, { read: true })
      }
    }
  }
  persist(all)
}
