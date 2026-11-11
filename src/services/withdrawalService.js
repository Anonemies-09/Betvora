// Manual withdrawal requests (no payment gateway).
//
// A user requests a payout to their mobile money / bank account. The amount is
// reserved immediately (deducted from the shared wallet) so it cannot be spent
// twice; an admin then completes (pays out) or rejects (refunds) the request.
//
// Creation, completion and rejection each run as a Firestore transaction so
// the request state and the wallet can never disagree across devices.

import { createNotification } from './notificationService'
import * as walletService from './walletService'
import * as authService from './authService'
import {
  CLOUD,
  LOCAL,
  cacheWallet,
  cloudEnabled,
  cloudList,
  cloudTransaction,
  mergeById,
  readLocal,
  writeLocal,
} from './cloudSync'
import { currencySymbol } from '../utils/format'

function currentUserId() {
  return authService.getSession()?.id || ''
}

function readRequests() {
  return readLocal(LOCAL.withdrawalRequests, [])
}

function persist(requests) {
  writeLocal(LOCAL.withdrawalRequests, requests)
}

function upsert(request) {
  const requests = readRequests()
  const index = requests.findIndex((r) => r.id === request.id)
  if (index >= 0) requests[index] = { ...requests[index], ...request }
  else requests.unshift(request)
  persist(requests)
  return request
}

function sortRequests(requests) {
  return [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getWithdrawalRequests() {
  return sortRequests(readRequests())
}

export function getPendingWithdrawalRequests() {
  return getWithdrawalRequests().filter((r) => r.status === 'pending')
}

/** Pull the shared request queue (used by the admin wallet screen). */
export async function refreshWithdrawalRequests() {
  if (cloudEnabled()) {
    const remote = await cloudList(CLOUD.withdrawalRequests)
    if (remote) persist(mergeById(readRequests(), remote))
  }
  return getWithdrawalRequests()
}

export async function createWithdrawalRequest({ amount, method, account }) {
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  if (!method) throw new Error('Select a withdrawal method.')
  if (!account || !account.trim()) throw new Error('Enter the destination account.')

  const uid = currentUserId()
  if (!uid) throw new Error('You need to be signed in.')

  const request = {
    id: `wd${Date.now()}${Math.floor(Math.random() * 1000)}`,
    userId: uid,
    amount: value,
    method,
    account: account.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  if (cloudEnabled()) {
    let result
    try {
      result = await cloudTransaction(async ({ mod, db, transaction }) => {
        const walletRef = mod.doc(db, CLOUD.wallets, uid)
        const walletSnap = await transaction.get(walletRef)
        const wallet = walletSnap.exists()
          ? walletSnap.data()
          : { balance: 0, bonus: 0, currency: 'GHS', transactions: [] }
        if (value > Number(wallet.balance || 0)) throw new Error('Insufficient balance.')
        const updated = {
          ...wallet,
          id: uid,
          balance: Number(wallet.balance || 0) - value,
          transactions: [
            {
              id: `tx${Date.now()}${Math.floor(Math.random() * 1000)}`,
              type: 'withdraw',
              amount: -value,
              note: `Withdrawal request to ${method} - ${account.trim()} (pending)`,
              createdAt: request.createdAt,
            },
            ...(wallet.transactions || []),
          ].slice(0, 400),
        }
        transaction.set(walletRef, updated, { merge: true })
        transaction.set(mod.doc(db, CLOUD.withdrawalRequests, request.id), request)
        return { wallet: updated }
      })
    } catch (err) {
      throw new Error(err?.message || 'Could not submit your withdrawal. Try again.')
    }

    cacheWallet(uid, result.wallet)
    upsert(request)
    await createNotification({
      type: 'wallet',
      title: 'Withdrawal request submitted',
      text: `Your withdrawal of ${currencySymbol('GHS')}${value.toLocaleString()} is pending processing.`,
      userId: uid,
    })
    return request
  }

  // Local-only mode.
  const wallet = walletService.readWallet(uid)
  if (value > Number(wallet.balance || 0)) throw new Error('Insufficient balance.')
  wallet.balance = Number(wallet.balance || 0) - value
  wallet.transactions.unshift({
    id: `tx${Date.now()}${Math.floor(Math.random() * 1000)}`,
    type: 'withdraw',
    amount: -value,
    note: `Withdrawal request to ${method} - ${account.trim()} (pending)`,
    createdAt: new Date().toISOString(),
  })
  walletService.writeWallet(uid, wallet)

  upsert(request)
  await createNotification({
    type: 'wallet',
    title: 'Withdrawal request submitted',
    text: `Your withdrawal of ${currencySymbol('GHS')}${value.toLocaleString()} is pending processing.`,
    userId: uid,
  })
  return request
}

export async function completeWithdrawalRequest(id) {
  const request = readRequests().find((r) => r.id === id)
  if (!request) throw new Error('Withdrawal request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  const completedAt = new Date().toISOString()

  if (cloudEnabled()) {
    try {
      await cloudTransaction(async ({ mod, db, transaction }) => {
        const ref = mod.doc(db, CLOUD.withdrawalRequests, id)
        const snap = await transaction.get(ref)
        if (!snap.exists()) throw new Error('Withdrawal request not found.')
        if (snap.data().status !== 'pending') throw new Error('This request is no longer pending.')
        transaction.set(
          ref,
          { status: 'completed', completedAt, completedBy: currentUserId() || null },
          { merge: true },
        )
        return true
      })
    } catch (err) {
      throw new Error(err?.message || 'Could not complete the withdrawal. Try again.')
    }
  }

  request.status = 'completed'
  request.completedAt = completedAt
  upsert(request)

  await createNotification({
    type: 'wallet',
    title: 'Withdrawal completed',
    text: `Your withdrawal of ${currencySymbol('GHS')}${Number(request.amount).toLocaleString()} has been processed.`,
    userId: request.userId,
  })

  return request
}

export async function rejectWithdrawalRequest(id, reason = '') {
  const request = readRequests().find((r) => r.id === id)
  if (!request) throw new Error('Withdrawal request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  const rejectedAt = new Date().toISOString()

  if (cloudEnabled()) {
    let result
    try {
      result = await cloudTransaction(async ({ mod, db, transaction }) => {
        const ref = mod.doc(db, CLOUD.withdrawalRequests, id)
        const snap = await transaction.get(ref)
        if (!snap.exists()) throw new Error('Withdrawal request not found.')
        const remote = { id: snap.id, ...snap.data() }
        if (remote.status !== 'pending') throw new Error('This request is no longer pending.')

        const walletRef = mod.doc(db, CLOUD.wallets, remote.userId)
        const walletSnap = await transaction.get(walletRef)
        const wallet = walletSnap.exists()
          ? walletSnap.data()
          : { balance: 0, bonus: 0, currency: 'GHS', transactions: [] }
        const value = Number(remote.amount)
        const updated = {
          ...wallet,
          id: remote.userId,
          balance: Number(wallet.balance || 0) + value,
          transactions: [
            {
              id: `tx${Date.now()}${Math.floor(Math.random() * 1000)}`,
              type: 'refund',
              amount: value,
              note: `Withdrawal request rejected - refund${reason ? `: ${reason}` : ''}`,
              createdAt: rejectedAt,
            },
            ...(wallet.transactions || []),
          ].slice(0, 400),
        }
        transaction.set(walletRef, updated, { merge: true })
        transaction.set(
          ref,
          { status: 'rejected', rejectedAt, rejectedBy: currentUserId() || null, reason },
          { merge: true },
        )
        return { wallet: updated }
      })
    } catch (err) {
      throw new Error(err?.message || 'Could not reject the withdrawal. Try again.')
    }
    cacheWallet(result.wallet.id, result.wallet)
  } else {
    // Local-only mode: return the reserved funds.
    const wallet = walletService.readWallet(request.userId)
    wallet.balance = Number(wallet.balance || 0) + Number(request.amount)
    wallet.transactions.unshift({
      id: `tx${Date.now()}${Math.floor(Math.random() * 1000)}`,
      type: 'refund',
      amount: request.amount,
      note: `Withdrawal request rejected - refund${reason ? `: ${reason}` : ''}`,
      createdAt: new Date().toISOString(),
    })
    walletService.writeWallet(request.userId, wallet)
  }

  request.status = 'rejected'
  request.rejectedAt = rejectedAt
  request.reason = reason
  upsert(request)

  await createNotification({
    type: 'wallet',
    title: 'Withdrawal rejected',
    text: `Your withdrawal request for ${currencySymbol('GHS')}${Number(request.amount).toLocaleString()} was rejected${reason ? `: ${reason}` : '.'}`,
    userId: request.userId,
  })

  return request
}
