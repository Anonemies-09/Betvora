// Mock wallet service backed by localStorage.
// The full betting engine (Phase 18) uses these same functions,
// which later map to Firestore transactions / Cloud Functions.

import { createNotification } from './notificationService'
import { currencySymbol } from '../utils/format'
import { COLLECTIONS, mirrorPersistOne } from './firestoreService'

const WALLET_KEY = 'betvora_wallet'
const BONUS_CLAIMED_KEY = 'betvora_bonus_claimed'

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function iso(daysAgo = 0, hoursAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

export function readWallet() {
  try {
    const raw = localStorage.getItem(WALLET_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && 'bonus' in parsed) return parsed
    }
  } catch {
    /* fall through to seed */
  }
  const initial = {
    balance: 125430,
    bonus: 25000,
    currency: 'GHS',
    transactions: [
      { id: 'tx1004', type: 'win', amount: 18400, note: 'Winnings â€” Bet #BV10289', createdAt: iso(0, 6) },
      { id: 'tx1003', type: 'bet', amount: -5000, note: 'Bet placed â€” #BV10290', createdAt: iso(0, 3) },
      { id: 'tx1002', type: 'deposit', amount: 50000, note: 'Deposit via Mobile Money', createdAt: iso(1) },
      { id: 'tx1001', type: 'bonus', amount: 25000, note: '100% Welcome Bonus', createdAt: iso(1, 2) },
    ],
  }
  localStorage.setItem(WALLET_KEY, JSON.stringify(initial))
  return initial
}

function persist(wallet) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
  mirrorPersistOne(COLLECTIONS.wallets, wallet.id || 'u001', wallet)
  return wallet
}

export async function setCurrency(currency) {
  await delay()
  const wallet = readWallet()
  wallet.currency = currency
  persist(wallet)
  return wallet
}

function pushTransaction(wallet, { type, amount, note }) {
  wallet.transactions.unshift({
    id: `tx${Date.now()}`,
    type,
    amount,
    note,
    createdAt: new Date().toISOString(),
  })
}

export async function getWalletData() {
  await delay()
  return readWallet()
}

export async function deposit(amount, options = {}) {
  await delay()
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  const wallet = readWallet()
  wallet.balance += value
  const method = options.method
  const account = options.account
  pushTransaction(wallet, {
    type: 'deposit',
    amount: value,
    note: method ? `Deposit via ${method}${account ? ` — ${account}` : ''}` : 'Demo Deposit',
    method,
  })
  persist(wallet)
  createNotification({
    type: 'wallet',
    title: 'Deposit successful',
    text: `Your wallet was credited with ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00.`,
  })
  return wallet
}

export async function withdraw(amount, options = {}) {
  await delay()
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  const wallet = readWallet()
  if (value > wallet.balance) throw new Error('Insufficient demo balance.')
  wallet.balance -= value
  const method = options.method
  const account = options.account
  pushTransaction(wallet, {
    type: 'withdraw',
    amount: -value,
    note: method ? `Withdrawal to ${method}${account ? ` — ${account}` : ''}` : 'Demo Withdrawal',
    method,
  })
  persist(wallet)
  createNotification({
    type: 'wallet',
    title: 'Withdrawal processed',
    text: `${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 was withdrawn from your wallet.`,
  })
  return wallet
}

export async function claimBonus() {
  await delay()
  const wallet = readWallet()
  if (localStorage.getItem(BONUS_CLAIMED_KEY)) {
    throw new Error('Welcome bonus already claimed.')
  }
  const value = 100000
  wallet.bonus += value
  pushTransaction(wallet, { type: 'bonus', amount: value, note: '100% Welcome Bonus claimed' })
  localStorage.setItem(BONUS_CLAIMED_KEY, 'true')
  persist(wallet)
  createNotification({
    type: 'wallet',
    title: 'Welcome bonus claimed',
    text: `${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 added to your bonus wallet.`,
  })
  return wallet
}

export async function deductForBet(amount, note) {
  await delay()
  const value = Number(amount)
  const wallet = readWallet()
  if (value > wallet.balance) throw new Error('Insufficient demo balance.')
  wallet.balance -= value
  pushTransaction(wallet, { type: 'bet', amount: -value, note })
  persist(wallet)
  return wallet
}

export async function creditWinnings(amount, note) {
  await delay()
  const value = Number(amount)
  const wallet = readWallet()
  wallet.balance += value
  pushTransaction(wallet, { type: 'win', amount: value, note })
  persist(wallet)
  createNotification({
    type: 'win',
    title: 'Bet won',
    text: `${note} â€” ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 credited to your wallet.`,
  })
  return wallet
}

export async function refundStake(amount, note) {
  await delay()
  const value = Number(amount)
  const wallet = readWallet()
  wallet.balance += value
  pushTransaction(wallet, { type: 'refund', amount: value, note })
  persist(wallet)
  createNotification({
    type: 'system',
    title: 'Bet refunded',
    text: `${note} â€” ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 returned to your wallet.`,
  })
  return wallet
}
