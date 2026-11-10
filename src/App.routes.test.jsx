// @vitest-environment jsdom
// Route coverage: every logged-in and admin route must render real content
// without uncaught/recoverable errors.
import React from 'react'
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import Root from './App'

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

async function waitFor(cond, timeout = 4000) {
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

const ROUTES = [
  ['/home', 'Main Wallet'],
  ['/sports', 'Bet Slip'],
  ['/in-play', 'In-Play'],
  ['/casino', 'The floor is open'],
  ['/virtuals', 'Virtual Sports'],
  ['/crash', 'Crash Games'],
  ['/aviator', 'Aviator'],
  ['/slots', 'The floor is open'],
  ['/match/m001', 'Match not found'],
  ['/bet-slip', 'bet slip'],
  ['/my-bets', 'My Bets'],
  ['/wallet', 'Wallet'],
  ['/promotions', 'Promotions'],
  ['/notifications', 'Notifications'],
  ['/profile', 'Logout'],
  ['/profile/settings', 'Settings'],
  ['/profile/referral', 'Referral'],
  ['/profile/bank', 'Bank'],
  ['/profile/verification', 'Verification'],
  ['/profile/security', 'Security'],
  ['/profile/personal', 'Personal'],
  ['/profile/support', 'Support'],
  ['/welcome', ''],
]

describe('deep route debug — logged in', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'betvora_session',
      JSON.stringify({ id: 'u001', email: 'demo@betvora.app', fullName: 'Demo User', role: 'user' }),
    )
  })

  for (const [path, marker] of ROUTES) {
    it(`renders ${path} without errors`, async () => {
      const { container, errors } = mountAt(path)
      const ok = await waitFor(() => container.innerHTML.length > 500)
      expect(errors).toEqual([])
      expect(ok).toBe(true)
      if (marker) {
        expect(await waitFor(() => container.innerHTML.includes(marker))).toBe(true)
      }
    })
  }
})

describe('deep route debug — admin', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'betvora_session',
      JSON.stringify({ id: 'admin1', email: 'admin@betvora.app', fullName: 'Admin', role: 'admin' }),
    )
  })

  for (const path of ['/admin', '/admin/sports', '/admin/users', '/admin/bets', '/admin/wallet', '/admin/promotions', '/admin/banners']) {
    it(`renders ${path} without errors`, async () => {
      const { container, errors } = mountAt(path)
      const ok = await waitFor(() => container.innerHTML.length > 500)
      expect(errors).toEqual([])
      expect(ok).toBe(true)
    })
  }
})
