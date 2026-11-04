import { describe, expect, it } from 'vitest'
import { formatCurrency, currencySymbol, formatOdds, getBetNumber } from './format'

describe('formatCurrency', () => {
  it('formats GHS with cedi symbol', () => {
    expect(formatCurrency(25750)).toBe('₵25,750.00')
    expect(formatCurrency(1250)).toBe('₵1,250.00')
  })

  it('formats NGN with naira symbol', () => {
    expect(formatCurrency(100000, 'NGN')).toBe('₦100,000.00')
  })

  it('formats other regional currencies', () => {
    expect(formatCurrency(50000, 'KES')).toBe('KSh50,000.00')
    expect(formatCurrency(1000, 'ZAR')).toBe('R1,000.00')
    expect(formatCurrency(250000, 'TZS')).toBe('TSh250,000.00')
  })

  it('handles zero and negatives', () => {
    expect(formatCurrency(0)).toBe('₵0.00')
    expect(formatCurrency(-500)).toBe('₵-500.00')
  })

  it('falls back safely on invalid input', () => {
    expect(formatCurrency(undefined)).toBe('₵0.00')
    expect(formatCurrency('abc')).toBe('₵0.00')
  })
})

describe('currencySymbol', () => {
  it('maps known codes and falls back to cedi', () => {
    expect(currencySymbol('GHS')).toBe('₵')
    expect(currencySymbol('UGX')).toBe('USh')
    expect(currencySymbol('XOF')).toBe('CFA')
    expect(currencySymbol('UNKNOWN')).toBe('₵')
  })
})

describe('formatOdds', () => {
  it('keeps two decimals', () => {
    expect(formatOdds(1.45)).toBe('1.45')
    expect(formatOdds(2)).toBe('2.00')
    expect(formatOdds(6.8)).toBe('6.80')
  })

  it('falls back on invalid input', () => {
    expect(formatOdds()).toBe('0.00')
  })
})

describe('getBetNumber', () => {
  it('pads to five digits with BV prefix', () => {
    expect(getBetNumber('10291')).toBe('#BV10291')
    expect(getBetNumber(1)).toBe('#BV00001')
  })
})
