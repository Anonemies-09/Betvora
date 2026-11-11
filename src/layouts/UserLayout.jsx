import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import TopHeader from '../components/layout/TopHeader'
import Sidebar from '../components/layout/Sidebar'
import BottomNavigation from '../components/layout/BottomNavigation'

export default function UserLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-navy">
      <TopHeader onOpenMenu={() => setMenuOpen(true)} />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNavigation />

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-80 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-navy p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-white/50">
                Menu
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full bg-white/5 p-2 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Sidebar mobile />
          </div>
        </div>
      )}
    </div>
  )
}
