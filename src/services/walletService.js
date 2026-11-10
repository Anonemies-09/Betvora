// Wallet service. Backed by localStorage, keyed per user, and (when
// Firebase is configured) mirrored to Firestore per user.
//
// The betting engine uses these same functions; they operate on the
// wallet of the user identified by the optional `userId` argument, or
// the currently signed-in user when omitted.

import { createNotification } from './notificationService'
import { currencySymbol } from '../utils/format'
import { COLLECTIONS, mirrorPersistOne } from './firestoreService'

const WALLETS_KEY = 'betvora_wallets'
const LEGACY_WALLET_KEY = 'betvora_wallet'
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

function getCurrentUserId() {
  if (typeof localStorage === 'undefined') return 'u001'
  try {
    const raw = localStorage.getItem('betvora_session')
    const session = raw ? JSON.parse(raw) : null
    return session?.id || 'u001'
  } catch {
    return 'u001'
  }
}

function readWallets() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(WALLETS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    }
  } catch {
    /* fall through */
  }

  // Migrate the legacy single global wallet (if any) into the per-user store.
  try {
    const legacy = localStorage.getItem(LEGACY_WALLET_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      const uid = parsed?.id || 'u001'
      const wallets = { [uid]: { ...parsed, id: uid } }
      localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
      return wallets
    }
  } catch {
    /* ignore */
  }

  return {}
}

function writeWallets(wallets) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
}

function defaultWallet(userId) {
  if (userId === 'u001') {
    return {
      id: userId,
      balance: 125430,
      bonus: 25000,
      currency: 'GHS',
      transactions: [
        { id: 'tx1004', type: 'win', amount: 18400, note: 'Winnings — Bet #BV10289', createdAt: iso(0, 6) },
        { id: 'tx1003', type: 'bet', amount: -5000, note: 'Bet placed — #BV10290', createdAt: iso(0, 3) },
        { id: 'tx1002', type: 'deposit', amount: 50000, note: 'Deposit via Mobile Money', createdAt: iso(1) },
        { id: 'tx1001', type: 'bonus', amount: 25000, note: '100% Welcome Bonus', createdAt: iso(1, 2) },
      ],
    }
  }
  return {
    id: userId,
    balance: 0,
    bonus: 0,
    currency: 'GHS',
    transactions: [],
  }
}

export function readWallet(userId) {
  const uid = userId || getCurrentUserId()
  const wallets = readWallets()
  if (!wallets[uid]) {
    wallets[uid] = defaultWallet(uid)
    writeWallets(wallets)
    mirrorPersistOne(COLLECTIONS.wallets, uid, wallets[uid])
  }
  return wallets[uid]
}

export function readAllWallets() {
  const wallets = readWallets()
  return Object.values(wallets)
}

function writeWallet(userId, wallet) {
  const uid = userId || wallet?.id || getCurrentUserId()
  const wallets = readWallets()
  wallet.id = uid
  wallets[uid] = wallet
  writeWallets(wallets)
  mirrorPersistOne(COLLECTIONS.wallets, uid, wallet)
  return wallet
}

export async function getWalletData(userId) {
  await delay()
  return readWallet(userId)
}

export async function setCurrency(currency, userId) {
  await delay()
  const uid = userId || getCurrentUserId()
  const wallet = readWallet(uid)
  wallet.currency = currency
  writeWallet(uid, wallet)
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

export async function deposit(amount, options = {}) {
  await delay()
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  const uid = options.userId || getCurrentUserId()
  const wallet = readWallet(uid)
  wallet.balance += value
  const method = options.method
  const account = options.account
  pushTransaction(wallet, {
    type: 'deposit',
    amount: value,
    note: method ? `Deposit via ${method}${account ? ` - ${account}` : ''}` : 'Demo Deposit',
    method,
  })
  writeWallet(uid, wallet)
  if (uid === getCurrentUserId()) {
    createNotification({
      type: 'wallet',
      title: 'Deposit successful',
      text: `Your wallet was credited with ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00.`,
    })
  }
  return wallet
}

export async function withdraw(amount, options = {}) {
  await delay()
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  const uid = options.userId || getCurrentUserId()
  const wallet = readWallet(uid)
  if (value > wallet.balance) throw new Error('Insufficient demo balance.')
  wallet.balance -= value
  const method = options.method
  const account = options.account
  pushTransaction(wallet, {
    type: 'withdraw',
    amount: -value,
    note: method ? `Withdrawal to ${method}${account ? ` - ${account}` : ''}` : 'Demo Withdrawal',
    method,
  })
  writeWallet(uid, wallet)
  if (uid === getCurrentUserId()) {
    createNotification({
      type: 'wallet',
      title: 'Withdrawal processed',
      text: `${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 was withdrawn from your wallet.`,
    })
  }
  return wallet
}

export async function claimBonus(userId) {
  await delay()
  const uid = userId || getCurrentUserId()
  const wallet = readWallet(uid)
  const key = `${BONUS_CLAIMED_KEY}_${uid}`
  if (localStorage.getItem(key)) {
    throw new Error('Welcome bonus already claimed.')
  }
  const value = 100000
  wallet.bonus += value
  pushTransaction(wallet, { type: 'bonus', amount: value, note: '100% Welcome Bonus claimed' })
  localStorage.setItem(key, 'true')
  writeWallet(uid, wallet)
  if (uid === getCurrentUserId()) {
    createNotification({
      type: 'wallet',
      title: 'Welcome bonus claimed',
      text: `${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 added to your bonus wallet.`,
    })
  }
  return wallet
}

export async function deductForBet(amount, note, userId) {
  await delay()
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  const wallet = readWallet(uid)
  if (value > wallet.balance) throw new Error('Insufficient demo balance.')
  wallet.balance -= value
  pushTransaction(wallet, { type: 'bet', amount: -value, note })
  writeWallet(uid, wallet)
  return wallet
}

export async function creditWinnings(amount, note, userId) {
  await delay()
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  const wallet = readWallet(uid)
  wallet.balance += value
  pushTransaction(wallet, { type: 'win', amount: value, note })
  writeWallet(uid, wallet)
  if (uid === getCurrentUserId()) {
    createNotification({
      type: 'win',
      title: 'Bet won',
      text: `${note} — ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 credited to your wallet.`,
    })
  }
  return wallet
}

export async function refundStake(amount, note, userId) {
  await delay()
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  const wallet = readWallet(uid)
  wallet.balance += value
  pushTransaction(wallet, { type: 'refund', amount: value, note })
  writeWallet(uid, wallet)
  if (uid === getCurrentUserId()) {
    createNotification({
      type: 'system',
      title: 'Bet refunded',
      text: `${note} — ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 returned to your wallet.`,
    })
  }
  return wallet
}