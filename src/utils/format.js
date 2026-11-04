const SYMBOLS = {
  GHS: '₵',
  NGN: '₦',
  KES: 'KSh',
  TZS: 'TSh',
  UGX: 'USh',
  ZAR: 'R',
  EGP: 'E£',
  MAD: 'MAD',
  ETB: 'Br',
  RWF: 'RF',
  ZMW: 'K',
  ZWL: 'Z$',
  XOF: 'CFA',
  XAF: 'CFA',
  CDF: 'FC',
  MGA: 'Ar',
  USD: '$',
  EUR: '€',
  GBP: '£',
}

export function currencySymbol(currency) {
  return SYMBOLS[currency] || SYMBOLS.GHS
}

export function formatCurrency(amount, currency = 'GHS') {
  const symbol = currencySymbol(currency)
  const value = Number(amount) || 0
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatOdds(odds) {
  const value = Number(odds) || 0
  return value.toFixed(2)
}

export function formatDate(input, options = {}) {
  const date = new Date(input)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: options.withYear ? 'numeric' : undefined,
    ...options,
  })
}

export function formatTime(input) {
  const date = new Date(input)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function getBetNumber(id) {
  return `#BV${String(id).padStart(5, '0')}`
}

export function flagEmoji(code) {
  if (!code || code.length !== 2) return code
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)),
  )
}
