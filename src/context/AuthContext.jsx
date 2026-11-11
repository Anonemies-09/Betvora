/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authService
      .restoreSession()
      .then((restored) => {
        if (active) setUser(restored || null)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const loggedIn = await authService.login(credentials)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (data) => {
    const created = await authService.register(data)
    if (created) setUser(created)
    return created
  }, [])

  const verifyOtp = useCallback(async (data) => {
    const verified = await authService.verifyOtp(data)
    setUser(verified)
    return verified
  }, [])

  const requestPasswordReset = useCallback((data) => authService.requestPasswordReset(data), [])
  const resetPassword = useCallback((data) => authService.resetPassword(data), [])

  const updateProfile = useCallback(
    async (updates) => {
      const updated = await authService.updateProfile(user.id, updates)
      setUser(updated)
      return updated
    },
    [user],
  )

  const changePassword = useCallback(
    (payload) => authService.changePassword(user.id, payload),
    [user],
  )

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      verifyOtp,
      requestPasswordReset,
      resetPassword,
      updateProfile,
      changePassword,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      verifyOtp,
      requestPasswordReset,
      resetPassword,
      updateProfile,
      changePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
