import { CLOUD, LOCAL, cloudEnabled, cloudGet, cloudSet, cloudList, readLocal, writeLocal } from './cloudSync'
import { creditBonus } from './walletService'
import { createNotification } from './notificationService'
import * as authService from './authService'

const CACHE_KEY = LOCAL.promoCodes

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export async function createPromoCode({ code, bonus, expiryDays = 30, usageLimit = 100 }) {
  const normalized = normalizeCode(code)
  if (!normalized || normalized.length < 4) throw new Error('Enter a valid promo code.')
  const value = Number(bonus)
  if (!value || value <= 0) throw new Error('Enter a valid bonus amount.')
  const record = {
    code: normalized,
    bonus: value,
    expiryDays: Number(expiryDays) || 30,
    usageLimit: Number(usageLimit) || 100,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (Number(expiryDays) || 30) * 86400000).toISOString(),
  }
  if (cloudEnabled()) {
    const saved = await cloudSet(CLOUD.promoCodes, normalized, record)
    if (!saved) throw new Error('Could not save the promo code.')
  }
  const cache = readLocal(CACHE_KEY, {})
  cache[normalized] = record
  writeLocal(CACHE_KEY, cache)
  return record
}

export async function listPromoCodes() {
  if (cloudEnabled()) {
    const remote = await cloudList(CLOUD.promoCodes)
    if (remote) {
      const cache = {}
      for (const item of remote) cache[item.id || item.code] = item
      writeLocal(CACHE_KEY, cache)
      return remote
    }
  }
  return Object.values(readLocal(CACHE_KEY, {}))
}

export async function redeemPromoCode(input) {
  const code = normalizeCode(input)
  if (!code) throw new Error('Enter a promo code.')

  const uid = authService.getSession()?.id
  if (!uid) throw new Error('You need to be signed in.')

  let record = null
  if (cloudEnabled()) {
    const cloud = await cloudGet(CLOUD.promoCodes, code)
    if (cloud === undefined) throw new Error('Could not reach the server. Try again.')
    if (cloud === null) throw new Error('That promo code was not found.')
    record = cloud
  } else {
    record = readLocal(CACHE_KEY, {})[code] || null
    if (!record) throw new Error('Promo codes need an internet connection.')
  }

  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new Error('That promo code has expired.')
  }

  // Check prior redemption.
  if (cloudEnabled()) {
    const all = await cloudList(CLOUD.promoRedemptions)
    const prior = (all || []).find((r) => r.code === code && r.userId === uid)
    if (prior) throw new Error('You have already used this promo code.')
    const usage = (all || []).filter((r) => r.code === code).length
    if (usage >= (record.usageLimit || 100)) throw new Error('That promo code has reached its usage limit.')
  }

  await creditBonus(record.bonus, `Promo code ${code}`, uid)
  if (cloudEnabled()) {
    await cloudSet(CLOUD.promoRedemptions, `${code}-${uid}`, {
      code,
      userId: uid,
      amount: record.bonus,
      createdAt: new Date().toISOString(),
    })
  }
  await createNotification({
    type: 'wallet',
    title: 'Promo code redeemed',
    text: `${record.bonus} bonus credited to your wallet.`,
    userId: uid,
  })
  return { code, bonus: record.bonus }
}
