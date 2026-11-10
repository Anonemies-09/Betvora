// Manual withdrawal requests (no payment gateway).
//
// A user requests a withdrawal to their mobile money / bank account. The
// amount is reserved (deducted) immediately so it cannot be spent twice;
// an admin then completes (pays out) or rejects (refunds) the request.

import { createNotification } from './notificationService'
import * as walletService from './walletService'

const REQUESTS_KEY = 'betvora_withdrawal_requests'

function currentUserId() {
  try {
    const raw = localStorage.getItem('betvora_session')
    return (raw ? JSON.parse(raw) : null)?.id || 'u001'
  } catch {
    return 'u001'
  }
}

function readRequests() {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through */
  }
  return []
}

function persist(requests) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
}

export function getWithdrawalRequests() {
  return readRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getPendingWithdrawalRequests() {
  return getWithdrawalRequests().filter((r) => r.status === 'pending')
}

export async function createWithdrawalRequest({ amount, method, account }) {
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  if (!method) throw new Error('Select a withdrawal method.')
  if (!account || !account.trim()) throw new Error('Enter the destination account.')

  const uid = currentUserId()
  const wallet = walletService.readWallet(uid)
  if (value > wallet.balance) throw new Error('Insufficient balance.')

  // Reserve the funds immediately.
  wallet.balance -= value
  wallet.transactions.unshift({
    id: `tx${Date.now()}`,
    type: 'withdraw',
    amount: -value,
    note: `Withdrawal request to ${method} - ${account.trim()} (pending)`,
    createdAt: new Date().toISOString(),
  })
  walletService.writeWallet(uid, wallet)

  const requests = readRequests()
  const request = {
    id: `wd${Date.now()}`,
    userId: uid,
    amount: value,
    method,
    account: account.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  requests.unshift(request)
  persist(requests)

  createNotification({
    type: 'wallet',
    title: 'Withdrawal request submitted',
    text: `Your withdrawal of ${value} is pending processing.`,
  })

  return request
}

export async function completeWithdrawalRequest(id) {
  const requests = readRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error('Withdrawal request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  request.status = 'completed'
  request.completedAt = new Date().toISOString()
  persist(requests)

  createNotification({
    type: 'wallet',
    title: 'Withdrawal completed',
    text: `Your withdrawal of ${request.amount} has been processed.`,
  })

  return request
}

export async function rejectWithdrawalRequest(id, reason = '') {
  const requests = readRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error('Withdrawal request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  // Refund the reserved funds.
  const uid = request.userId
  const wallet = walletService.readWallet(uid)
  wallet.balance += request.amount
  wallet.transactions.unshift({
    id: `tx${Date.now()}`,
    type: 'refund',
    amount: request.amount,
    note: `Withdrawal request rejected - refund${reason ? `: ${reason}` : ''}`,
    createdAt: new Date().toISOString(),
  })
  walletService.writeWallet(uid, wallet)

  request.status = 'rejected'
  request.rejectedAt = new Date().toISOString()
  request.reason = reason
  persist(requests)

  createNotification({
    type: 'wallet',
    title: 'Withdrawal rejected',
    text: `Your withdrawal request for ${request.amount} was rejected${reason ? `: ${reason}` : '.'}`,
  })

  return request
}