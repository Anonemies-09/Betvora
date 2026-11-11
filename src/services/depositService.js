// Manual deposit requests for Telecel Cash (no payment gateway).
//
// A user sends money to the merchant Telecel Cash number (0507655475) and
// submits the transaction reference. The request is shared through Firestore
// and stays "pending" until an admin verifies the payment and approves it.
//
// Approval runs as a Firestore transaction that flips the request to
// "approved" and credits the user's wallet atomically, so an admin on one
// device can credit a user on another device without double-crediting.

import { createNotification } from './notificationService'
import * as walletService from './walletService'
import * as authService from './authService'
import {
  CLOUD,
  LOCAL,
  cacheWallet,
  cloudEnabled,
  cloudList,
  cloudSet,
  cloudTransaction,
  mergeById,
  readLocal,
  writeLocal,
} from './cloudSync'
import { currencySymbol } from '../utils/format'

const TELECEL_NUMBER = '0507655475'

export const DEPOSIT_NUMBER = TELECEL_NUMBER

function currentUserId() {
  return authService.getSession()?.id || ''
}

function readRequests() {
  return readLocal(LOCAL.depositRequests, [])
}

function persist(requests) {
  writeLocal(LOCAL.depositRequests, requests)
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

export function getDepositRequests() {
  return sortRequests(readRequests())
}

export function getPendingDepositRequests() {
  return getDepositRequests().filter((r) => r.status === 'pending')
}

/** Pull the shared request queue (used by the admin wallet screen). */
export async function refreshDepositRequests() {
  if (cloudEnabled()) {
    const remote = await cloudList(CLOUD.depositRequests)
    if (remote) persist(mergeById(readRequests(), remote))
  }
  return getDepositRequests()
}

export async function createDepositRequest({ amount, senderPhone, txRef }) {
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  if (!senderPhone || !senderPhone.trim()) throw new Error('Enter your Telecel number.')
  if (!txRef || !txRef.trim()) throw new Error('Enter the transaction reference from Telecel Cash.')

  const uid = currentUserId()
  if (!uid) throw new Error('You need to be signed in.')

  const request = {
    id: `dep${Date.now()}${Math.floor(Math.random() * 1000)}`,
    userId: uid,
    amount: value,
    senderPhone: senderPhone.trim(),
    txRef: txRef.trim(),
    method: 'Telecel Cash',
    destination: TELECEL_NUMBER,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  if (cloudEnabled()) {
    const saved = await cloudSet(CLOUD.depositRequests, request.id, request)
    if (!saved) throw new Error('Could not submit your deposit request. Check your connection and try again.')
  }

  upsert(request)
  await createNotification({
    type: 'wallet',
    title: 'Deposit request submitted',
    text: `Your deposit of ${currencySymbol('GHS')}${value.toLocaleString()} is pending verification. It will be credited once confirmed.`,
    userId: uid,
  })
  return request
}

export async function approveDepositRequest(id) {
  const requests = readRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error('Deposit request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  if (cloudEnabled()) {
    let result
    try {
      result = await cloudTransaction(async ({ mod, db, transaction }) => {
        const requestRef = mod.doc(db, CLOUD.depositRequests, id)
        const requestSnap = await transaction.get(requestRef)
        if (!requestSnap.exists()) throw new Error('Deposit request not found.')
        const remote = { id: requestSnap.id, ...requestSnap.data() }
        if (remote.status !== 'pending') throw new Error('This request is no longer pending.')

        const walletRef = mod.doc(db, CLOUD.wallets, remote.userId)
        const walletSnap = await transaction.get(walletRef)
        const wallet = walletSnap.exists()
          ? walletSnap.data()
          : { balance: 0, bonus: 0, currency: 'GHS', transactions: [] }
        const value = Number(remote.amount)
        const approvedAt = new Date().toISOString()
        const updated = {
          ...wallet,
          id: remote.userId,
          balance: Number(wallet.balance || 0) + value,
          transactions: [
            {
              id: `tx${Date.now()}${Math.floor(Math.random() * 1000)}`,
              type: 'deposit',
              amount: value,
              note: `Deposit via Telecel Cash - ${remote.senderPhone}`,
              method: 'Telecel Cash',
              createdAt: approvedAt,
            },
            ...(wallet.transactions || []),
          ].slice(0, 400),
        }
        transaction.set(walletRef, updated, { merge: true })
        transaction.set(
          requestRef,
          { status: 'approved', approvedAt, approvedBy: currentUserId() || null },
          { merge: true },
        )
        return { wallet: updated, request: { ...remote, status: 'approved', approvedAt } }
      })
    } catch (err) {
      throw new Error(err?.message || 'Could not approve the deposit. Try again.')
    }

    cacheWallet(result.wallet.id, result.wallet)
    upsert(result.request)
    await createNotification({
      type: 'wallet',
      title: 'Deposit approved',
      text: `Your deposit of ${currencySymbol(result.wallet.currency || 'GHS')}${Number(result.request.amount).toLocaleString()} has been credited to your wallet.`,
      userId: result.request.userId,
    })
    return result.request
  }

  await walletService.deposit(request.amount, {
    method: 'Telecel Cash',
    account: request.senderPhone,
    userId: request.userId,
  })

  request.status = 'approved'
  request.approvedAt = new Date().toISOString()
  upsert(request)

  await createNotification({
    type: 'wallet',
    title: 'Deposit approved',
    text: `Your deposit of ${currencySymbol('GHS')}${Number(request.amount).toLocaleString()} has been credited to your wallet.`,
    userId: request.userId,
  })

  return request
}

export async function rejectDepositRequest(id, reason = '') {
  const requests = readRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error('Deposit request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  const patch = {
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedBy: currentUserId() || null,
    reason,
  }

  if (cloudEnabled()) {
    const saved = await cloudSet(CLOUD.depositRequests, id, patch)
    if (!saved) throw new Error('Could not reject the deposit. Check your connection and try again.')
  }

  request.status = patch.status
  request.rejectedAt = patch.rejectedAt
  request.reason = reason
  upsert(request)

  await createNotification({
    type: 'wallet',
    title: 'Deposit rejected',
    text: `Your deposit request for ${currencySymbol('GHS')}${Number(request.amount).toLocaleString()} was rejected${reason ? `: ${reason}` : '.'}`,
    userId: request.userId,
  })

  return request
}
