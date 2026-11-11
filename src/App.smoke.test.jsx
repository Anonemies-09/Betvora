// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import Root from './App'

// The smoke tests seed a localStorage session only. Real Firebase sessions
// cannot exist in jsdom, so restore the cached session and keep all cloud
// traffic local for deterministic, offline test runs.
vi.mock('./services/authService', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    restoreSession: async () => {
      try {
        return JSON.parse(localStorage.getItem('betvora_session'))
      } catch {
        return null
      }
    },
  }
})

vi.mock('./services/cloudSync', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    cloudEnabled: () => false,
    cloudGet: async () => null,
    cloudList: async () => null,
    cloudListByUser: async () => null,
    cloudSet: async () => true,
    cloudDelete: async () => true,
    hydrateUserData: async () => {},
    hydrateWallet: async () => {},
    ensureWalletDoc: async () => {},
    hydratePublicData: async () => {},
    pullStaffData: async () => {},
    subscribeWallet: () => () => {},
    subscribeNotifications: () => () => {},
  }
})

const roots = []

function mountAt(path) {
  window.history.pushState({}, '', path)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const errors = []
  const root = createRoot(container, {
    onUncaughtError: (error) => errors.push(error),
    onRecoverableError: (error) => errors.push(error),
  })
  root.render(<Root />)
  roots.push(root)
  return { container, errors }
}

async function waitFor(cond, timeout = 3000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (cond()) return true
    await new Promise((r) => setTimeout(r, 25))
  }
  return cond()
}

afterEach(async () => {
  roots.splice(0).forEach((root) => root.unmount())
  document.body.innerHTML = ''
  localStorage.clear()
  await new Promise((r) => setTimeout(r, 50))
})

describe('app smoke — logged-in user', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'betvora_session',
      JSON.stringify({
        id: 'u001',
        email: 'demo@betvora.app',
        fullName: 'Demo User',
        referralCode: 'BVDEMO1',
        isVerified: true,
        role: 'user',
        createdAt: new Date().toISOString(),
      }),
    )
  })

  it('renders /home with the dashboard content', async () => {
    const { container, errors } = mountAt('/home')
    expect(await waitFor(() => container.innerHTML.includes('Main Wallet'))).toBe(true)
    expect(errors).toEqual([])
  })

  it('renders /sports with matches and bet slip column', async () => {
    const { container, errors } = mountAt('/sports')
    expect(await waitFor(() => container.innerHTML.includes('Bet Slip'))).toBe(true)
    expect(await waitFor(() => container.innerHTML.includes('Featured'))).toBe(true)
    expect(errors).toEqual([])
  })

  it('renders /bet-slip page', async () => {
    const { container, errors } = mountAt('/bet-slip')
    expect(await waitFor(() => container.innerHTML.includes('Your bet slip is empty'))).toBe(true)
    expect(errors).toEqual([])
  })

  it('renders /profile with logout button', async () => {
    const { container, errors } = mountAt('/profile')
    expect(await waitFor(() => container.innerHTML.includes('Logout'))).toBe(true)
    expect(errors).toEqual([])
  })
})

describe('app smoke — public routes', () => {
  it('renders /welcome without throwing', async () => {
    const { container, errors } = mountAt('/welcome')
    expect(await waitFor(() => container.innerHTML.length > 100)).toBe(true)
    expect(errors).toEqual([])
  })

  it('renders /login without throwing', async () => {
    const { container, errors } = mountAt('/login')
    expect(await waitFor(() => container.innerHTML.length > 100)).toBe(true)
    expect(errors).toEqual([])
  })

  it('/logout clears the session', async () => {
    localStorage.setItem(
      'betvora_session',
      JSON.stringify({ id: 'u001', email: 'demo@betvora.app', fullName: 'Demo User' }),
    )
    const { container, errors } = mountAt('/logout')
    expect(await waitFor(() => localStorage.getItem('betvora_session') === null)).toBe(true)
    expect(await waitFor(() => container.innerHTML.length > 100)).toBe(true)
    expect(errors).toEqual([])
  })
})
