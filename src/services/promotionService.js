// Promotions (admin-controlled), backed by localStorage.
// Phase 15: admin CRUD here feeds the user-facing pages.

import { COLLECTIONS, mirrorPersist, mirrorDelete } from './firestoreService'

const PROMOTIONS_KEY = 'betvora_promotions'

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readPromotions() {
  try {
    const raw = localStorage.getItem(PROMOTIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through */
  }
  localStorage.setItem(PROMOTIONS_KEY, JSON.stringify([]))
  return []
}

function persist(promotions) {
  localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(promotions))
  mirrorPersist(COLLECTIONS.promotions, promotions)
}

export async function getPromotions({ activeOnly = false } = {}) {
  await delay()
  const all = readPromotions()
  return activeOnly ? all.filter((p) => p.status === 'active') : all
}

export async function createPromotion(data) {
  await delay()
  const promotions = readPromotions()
  const promotion = {
    id: `p${Date.now()}`,
    tag: data.tag || 'NEW',
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    percentage: Number(data.percentage) || 0,
    maxBonus: Number(data.maxBonus) || 0,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status || 'draft',
    gradient: data.gradient || 'from-gold to-gold-600',
    createdAt: new Date().toISOString(),
  }
  promotions.unshift(promotion)
  persist(promotions)
  return promotion
}

export async function updatePromotion(id, patch) {
  await delay()
  const promotions = readPromotions()
  const index = promotions.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('Promotion not found.')
  promotions[index] = { ...promotions[index], ...patch }
  persist(promotions)
  return promotions[index]
}

export async function deletePromotion(id) {
  await delay()
  persist(readPromotions().filter((p) => p.id !== id))
  mirrorDelete(COLLECTIONS.promotions, id)
}
