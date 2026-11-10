/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import * as walletService from '../services/walletService'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    walletService
      .getWalletData(userId)
      .then((data) => {
        if (active) setWallet(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  const deposit = useCallback(async (amount, options) => {
    const data = await walletService.deposit(amount, { ...options, userId })
    if (data?.id === userId || !userId) setWallet(data)
    return data
  }, [userId])

  const withdraw = useCallback(async (amount, options) => {
    const data = await walletService.withdraw(amount, { ...options, userId })
    setWallet(data)
    return data
  }, [userId])

  const claimBonus = useCallback(async () => {
    const data = await walletService.claimBonus(userId)
    setWallet(data)
    return data
  }, [userId])

  const refresh = useCallback(async () => {
    const data = await walletService.getWalletData(userId)
    setWallet(data)
    return data
  }, [userId])

  const setCurrency = useCallback(async (currency) => {
    const data = await walletService.setCurrency(currency, userId)
    setWallet(data)
    return data
  }, [userId])

  const value = useMemo(
    () => ({
      wallet,
      balance: wallet?.balance ?? 0,
      bonus: wallet?.bonus ?? 0,
      transactions: wallet?.transactions ?? [],
      currency: wallet?.currency ?? 'GHS',
      loading,
      deposit,
      withdraw,
      claimBonus,
      refresh,
      setCurrency,
    }),
    [wallet, loading, deposit, withdraw, claimBonus, refresh, setCurrency],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider')
  return ctx
}
