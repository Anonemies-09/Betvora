// Wallet service.
//
// Firestore (`wallets/{uid}`) is the shared source of truth; localStorage is
// the synchronous cache. Every mutation writes locally first (instant UI) and
// then commits to Firestore so the same user sees the same balance on every
// device and admins can credit a wallet remotely.
//
// The betting engine uses these same functions; they operate on the wallet of
// the user identified by the optional `userId` argument, or the currently
// signed-in user when omitted.

import { createNotification } from './notificationService'
import { currencySymbol } from '../utils/format'
import { CLOUD, cloudEnabled, cloudSet, hydrateWallet } from './cloudSync'

const WALLETS_KEY = 'betvora_wallets'
const LEGACY_WALLET_KEY = 'betvora_wallet'
const BONUS_CLAIMED_KEY = 'betvora_bonus_claimed'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getCurrentUserId() {
  if (typeof localStorage === 'undefined') return ''
  try {
    const raw = localStorage.getItem('betvora_session')
    const session = raw ? JSON.parse(raw) : null
    return session?.id || ''
  } catch {
    return ''
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
      const uid = parsed?.id || getCurrentUserId()
      const wallets = uid ? { [uid]: { ...parsed, id: uid } } : {}
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
  try {
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
  } catch {
    /* ignore quota errors */
  }
}

function defaultWallet(userId) {
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
  if (!uid) return defaultWallet('')
  const wallets = readWallets()
  if (!wallets[uid]) {
    wallets[uid] = defaultWallet(uid)
    writeWallets(wallets)
  }
  return wallets[uid]
}

export function readAllWallets() {
  return Object.values(readWallets())
}

function saveLocal(uid, wallet) {
  wallet.id = uid
  const wallets = readWallets()
  wallets[uid] = wallet
  writeWallets(wallets)
  return wallet
}

/** Synchronous local save plus a background cloud write. */
export function writeWallet(userId, wallet) {
  const uid = userId || wallet?.id || getCurrentUserId()
  if (!uid) return wallet
  saveLocal(uid, wallet)
  void cloudSet(CLOUD.wallets, uid, wallet)
  return wallet
}

/** Local save plus an awaited cloud write; returns whether the cloud accepted it. */
async function commitWallet(uid, wallet) {
  saveLocal(uid, wallet)
  return cloudSet(CLOUD.wallets, uid, wallet)
}

export async function getWalletData(userId) {
  const uid = userId || getCurrentUserId()
  if (!uid) return defaultWallet('')
  // Pull the shared copy first so a new device sees the real balance.
  await hydrateWallet(uid)
  await delay(120)
  return readWallet(uid)
}

export async function refreshWallet(userId) {
  return getWalletData(userId)
}

export async function setCurrency(currency, userId) {
  await delay(120)
  const uid = userId || getCurrentUserId()
  if (!uid) return defaultWallet('')
  const wallet = readWallet(uid)
  wallet.currency = currency
  await commitWallet(uid, wallet)
  return wallet
}

function pushTransaction(wallet, { type, amount, note, method }) {
  wallet.transactions.unshift({
    id: `tx${Date.now()}${Math.floor(Math.random() * 1000)}`,
    type,
    amount,
    note,
    method,
    createdAt: new Date().toISOString(),
  })
  // Keep the ledger bounded so a wallet document stays small.
  if (wallet.transactions.length > 400) wallet.transactions.length = 400
}

function payload(value, options) {
  return {
    method: options.method,
    account: options.account,
  }
}

export async function deposit(amount, options = {}) {
  await delay(150)
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  const uid = options.userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  wallet.balance = Number(wallet.balance || 0) + value
  const { method, account } = payload(value, options)
  pushTransaction(wallet, {
    type: 'deposit',
    amount: value,
    note: method ? `Deposit via ${method}${account ? ` - ${account}` : ''}` : 'Deposit',
    method,
  })
  await commitWallet(uid, wallet)
  await createNotification({
    type: 'wallet',
    title: 'Deposit successful',
    text: `Your wallet was credited with ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00.`,
    userId: uid,
  })
  return wallet
}

export async function withdraw(amount, options = {}) {
  await delay(150)
  const value = Number(amount)
  if (!value || value <= 0) throw new Error('Enter a valid amount.')
  const uid = options.userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  if (value > Number(wallet.balance || 0)) throw new Error('Insufficient balance.')
  wallet.balance = Number(wallet.balance || 0) - value
  const { method, account } = payload(value, options)
  pushTransaction(wallet, {
    type: 'withdraw',
    amount: -value,
    note: method ? `Withdrawal to ${method}${account ? ` - ${account}` : ''}` : 'Withdrawal',
    method,
  })
  await commitWallet(uid, wallet)
  await createNotification({
    type: 'wallet',
    title: 'Withdrawal processed',
    text: `${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 was withdrawn from your wallet.`,
    userId: uid,
  })
  return wallet
}

export async function claimBonus(userId) {
  await delay(150)
  const uid = userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  const key = `${BONUS_CLAIMED_KEY}_${uid}`
  if (wallet.bonusClaimed || localStorage.getItem(key)) {
    throw new Error('Welcome bonus already claimed.')
  }
  const value = 100000
  wallet.bonus = Number(wallet.bonus || 0) + value
  wallet.bonusClaimed = true
  pushTransaction(wallet, { type: 'bonus', amount: value, note: '100% Welcome Bonus claimed' })
  try {
    localStorage.setItem(key, 'true')
  } catch {
    /* ignore */
  }
  await commitWallet(uid, wallet)
  await createNotification({
    type: 'wallet',
    title: 'Welcome bonus claimed',
    text: `${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 added to your bonus wallet.`,
    userId: uid,
  })
  return wallet
}

export async function deductForBet(amount, note, userId) {
  await delay(120)
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  if (value > Number(wallet.balance || 0)) throw new Error('Insufficient balance.')
  const previous = { balance: wallet.balance, transactions: [...(wallet.transactions || [])] }
  wallet.balance = Number(wallet.balance || 0) - value
  pushTransaction(wallet, { type: 'bet', amount: -value, note })
  const saved = await commitWallet(uid, wallet)
  if (cloudEnabled() && !saved) {
    // Roll the cache back so the UI never shows a stake that was not recorded.
    wallet.balance = previous.balance
    wallet.transactions = previous.transactions
    saveLocal(uid, wallet)
    throw new Error('Could not reach the wallet server. Your stake was not taken.')
  }
  return wallet
}

export async function creditWinnings(amount, note, userId) {
  await delay(120)
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  wallet.balance = Number(wallet.balance || 0) + value
  pushTransaction(wallet, { type: 'win', amount: value, note })
  await commitWallet(uid, wallet)
  await createNotification({
    type: 'win',
    title: 'Bet won',
    text: `${note} — ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 credited to your wallet.`,
    userId: uid,
  })
  return wallet
}

/** Credit a game (casino/slot) win without a betting-slip notification. */
export async function creditGameWinnings(amount, note, userId) {
  await delay(120)
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  wallet.balance = Number(wallet.balance || 0) + value
  pushTransaction(wallet, { type: 'win', amount: value, note })
  await commitWallet(uid, wallet)
  return wallet
}

export async function creditBonus(amount, note, userId) {
  await delay(120)
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  wallet.bonusBalance = Number(wallet.bonusBalance || 0) + value
  pushTransaction(wallet, { type: 'bonus', amount: value, note })
  await commitWallet(uid, wallet)
  return wallet
}
export async function refundStake(amount, note, userId) {
  await delay(120)
  const value = Number(amount)
  const uid = userId || getCurrentUserId()
  if (!uid) throw new Error('You need to be signed in.')
  const wallet = readWallet(uid)
  wallet.balance = Number(wallet.balance || 0) + value
  pushTransaction(wallet, { type: 'refund', amount: value, note })
  await commitWallet(uid, wallet)
  await createNotification({
    type: 'system',
    title: 'Bet refunded',
    text: `${note} — ${currencySymbol(wallet.currency)}${value.toLocaleString()}.00 returned to your wallet.`,
    userId: uid,
  })
  return wallet
}
