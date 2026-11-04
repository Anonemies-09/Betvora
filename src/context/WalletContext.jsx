/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as walletService from '../services/walletService'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    walletService
      .getWalletData()
      .then((data) => {
        if (active) setWallet(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const deposit = useCallback(async (amount, options) => {
    const data = await walletService.deposit(amount, options)
    setWallet(data)
    return data
  }, [])

  const withdraw = useCallback(async (amount, options) => {
    const data = await walletService.withdraw(amount, options)
    setWallet(data)
    return data
  }, [])

  const claimBonus = useCallback(async () => {
    const data = await walletService.claimBonus()
    setWallet(data)
    return data
  }, [])

  const refresh = useCallback(async () => {
    const data = await walletService.getWalletData()
    setWallet(data)
    return data
  }, [])

  const setCurrency = useCallback(async (currency) => {
    const data = await walletService.setCurrency(currency)
    setWallet(data)
    return data
  }, [])

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
