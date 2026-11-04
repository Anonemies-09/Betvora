// Admin-managed homepage banners, backed by localStorage with a Firestore
// mirror (same pattern as the other services).

import { BANNERS } from '../data/demoData'
import { COLLECTIONS, mirrorPersist, mirrorDelete } from './firestoreService'

const BANNERS_KEY = 'betvora_banners'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function readBanners() {
  try {
    const raw = localStorage.getItem(BANNERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to seed */
  }
  const seed = [...BANNERS].sort((a, b) => a.order - b.order)
  localStorage.setItem(BANNERS_KEY, JSON.stringify(seed))
  return seed
}

function persist(banners) {
  localStorage.setItem(BANNERS_KEY, JSON.stringify(banners))
  mirrorPersist(COLLECTIONS.banners, banners)
}

export async function getBanners({ activeOnly = false } = {}) {
  await delay()
  const all = [...readBanners()].sort((a, b) => a.order - b.order)
  return activeOnly ? all.filter((b) => b.active) : all
}

export async function createBanner(data) {
  await delay()
  const banners = readBanners()
  const banner = {
    id: `b${Date.now()}`,
    badge: data.badge || 'PROMO',
    title: data.title,
    subtitle: data.subtitle || '',
    ctaLabel: data.ctaLabel || 'Learn More',
    ctaLink: data.ctaLink || '/promotions',
    icon: data.icon || 'sparkles',
    accent: data.accent || '#FFC107',
    gradient: data.gradient || 'from-gold/50 to-navy',
    order: Number(data.order) || banners.length + 1,
    active: data.active ?? true,
    createdAt: new Date().toISOString(),
  }
  banners.push(banner)
  persist(banners)
  return banner
}

export async function updateBanner(id, patch) {
  await delay()
  const banners = readBanners()
  const index = banners.findIndex((b) => b.id === id)
  if (index === -1) throw new Error('Banner not found.')
  banners[index] = { ...banners[index], ...patch }
  persist(banners)
  return banners[index]
}

export async function setBannerActive(id, active) {
  await delay()
  const banners = readBanners()
  const index = banners.findIndex((b) => b.id === id)
  if (index === -1) throw new Error('Banner not found.')
  banners[index].active = Boolean(active)
  persist(banners)
  return banners[index]
}

export async function deleteBanner(id) {
  await delay()
  persist(readBanners().filter((b) => b.id !== id))
  mirrorDelete(COLLECTIONS.banners, id)
}
