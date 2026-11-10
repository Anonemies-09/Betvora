// Manual deposit requests for Telecel Cash (no payment gateway).
//
// A user initiates a deposit by sending money to the merchant Telecel Cash
// number (0507655475) and submitting the transaction reference. The request
// stays "pending" until an admin verifies the payment and approves it, at
// which point the wallet is credited.

import { createNotification } from './notificationService'
import * as walletService from './walletService'

const REQUESTS_KEY = 'betvora_deposit_requests'
const TELECEL_NUMBER = '0507655475'

export const DEPOSIT_NUMBER = TELECEL_NUMBER

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

export function getDepositRequests() {
  return readRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getPendingDepositRequests() {
  return getDepositRequests().filter((r) => r.status === 'pending')
}

export async function createDepositRequest({ amount, senderPhone, txRef }) {
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  if (!senderPhone || !senderPhone.trim()) throw new Error('Enter your Telecel number.')
  if (!txRef || !txRef.trim()) throw new Error('Enter the transaction reference from Telecel Cash.')

  const requests = readRequests()
  const request = {
    id: `dep${Date.now()}`,
    amount: value,
    senderPhone: senderPhone.trim(),
    txRef: txRef.trim(),
    method: 'Telecel Cash',
    destination: TELECEL_NUMBER,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  requests.unshift(request)
  persist(requests)

  createNotification({
    type: 'wallet',
    title: 'Deposit request submitted',
    text: `Your deposit of ${value} is pending verification. It will be credited once confirmed.`,
  })

  return request
}

export async function approveDepositRequest(id) {
  const requests = readRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error('Deposit request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  await walletService.deposit(request.amount, {
    method: 'Telecel Cash',
    account: request.senderPhone,
  })

  request.status = 'approved'
  request.approvedAt = new Date().toISOString()
  persist(requests)

  createNotification({
    type: 'wallet',
    title: 'Deposit approved',
    text: `Your deposit of ${request.amount} has been credited to your wallet.`,
  })

  return request
}

export async function rejectDepositRequest(id, reason = '') {
  const requests = readRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) throw new Error('Deposit request not found.')
  if (request.status !== 'pending') throw new Error('This request is no longer pending.')

  request.status = 'rejected'
  request.rejectedAt = new Date().toISOString()
  request.reason = reason
  persist(requests)

  createNotification({
    type: 'wallet',
    title: 'Deposit rejected',
    text: `Your deposit request for ${request.amount} was rejected${reason ? `: ${reason}` : '.'}`,
  })

  return request
}