import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WalletProvider } from './context/WalletContext'
import { BetSlipProvider } from './context/BetSlipContext'
import { ThemeProvider } from './context/ThemeContext'

import ProtectedRoute from './components/common/ProtectedRoute'

import AuthLayout from './layouts/AuthLayout'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'

import Splash from './pages/auth/Splash'
import PublicHomePage from './pages/auth/PublicHomePage'
import LogoutPage from './pages/auth/LogoutPage'
import Onboarding from './pages/auth/Onboarding'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyOtp from './pages/auth/VerifyOtp'
import ForgotPassword from './pages/auth/ForgotPassword'

import HomePage from './pages/user/HomePage'
import CasinoPage from './pages/user/CasinoPage'
import VirtualSportsPage from './pages/user/VirtualSportsPage'
import CrashGamesPage from './pages/user/CrashGamesPage'
import SportsPage from './pages/user/SportsPage'
import InPlayPage from './pages/user/InPlayPage'
import MatchDetailsPage from './pages/user/MatchDetailsPage'
import BetSlipPage from './pages/user/BetSlipPage'
import MyBetsPage from './pages/user/MyBetsPage'
import WalletPage from './pages/user/WalletPage'
import PromotionsPage from './pages/user/PromotionsPage'
import NotificationsPage from './pages/user/NotificationsPage'
import ProfilePage from './pages/user/ProfilePage'
import PersonalInfoPage from './pages/user/PersonalInfoPage'
import BankAccountsPage from './pages/user/BankAccountsPage'
import VerificationPage from './pages/user/VerificationPage'
import SecurityPage from './pages/user/SecurityPage'
import ReferralPage from './pages/user/ReferralPage'
import SupportPage from './pages/user/SupportPage'
import SettingsPage from './pages/user/SettingsPage'

import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSportsPage from './pages/admin/AdminSportsPage'
import AdminBetsPage from './pages/admin/AdminBetsPage'
import AdminWalletPage from './pages/admin/AdminWalletPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import AdminBannersPage from './pages/admin/AdminBannersPage'
import { AdminRedirect } from './pages/admin/AdminPlaceholder'
import NotFound from './pages/NotFound'
import LegalPage from './pages/legal/LegalPage'
import ConsentNotice from './components/common/ConsentNotice'
import InstallPrompt from './components/common/InstallPrompt'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<PublicHomePage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/terms" element={<LegalPage doc="terms" />} />
        <Route path="/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/cookies" element={<LegalPage doc="cookies" />} />
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />
        <Route
          path="/verify"
          element={
            <AuthLayout showBack={false}>
              <VerifyOtp />
            </AuthLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/casino" element={<CasinoPage />} />
          <Route path="/virtuals" element={<VirtualSportsPage />} />
          <Route path="/crash" element={<CrashGamesPage />} />
          <Route path="/slots" element={<CasinoPage />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/sports/:filterId" element={<SportsPage />} />
          <Route path="/in-play" element={<InPlayPage />} />
          <Route path="/match/:id" element={<MatchDetailsPage />} />
          <Route path="/bet-slip" element={<BetSlipPage />} />
          <Route path="/my-bets" element={<MyBetsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/personal" element={<PersonalInfoPage />} />
          <Route path="/profile/bank" element={<BankAccountsPage />} />
          <Route path="/profile/verification" element={<VerificationPage />} />
          <Route path="/profile/security" element={<SecurityPage />} />
          <Route path="/profile/promotions" element={<PromotionsPage />} />
          <Route path="/profile/referral" element={<ReferralPage />} />
          <Route path="/profile/support" element={<SupportPage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/profile/*" element={<Navigate to="/profile" replace />} />
        </Route>

        <Route
          element={
            <ProtectedRoute staffOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/sports" element={<AdminSportsPage />} />
          <Route path="/admin/bets" element={<AdminBetsPage />} />
          <Route path="/admin/wallet" element={<AdminWalletPage />} />
          <Route path="/admin/promotions" element={<ProtectedRoute adminOnly><AdminPromotionsPage /></ProtectedRoute>} />
          <Route path="/admin/banners" element={<ProtectedRoute adminOnly><AdminBannersPage /></ProtectedRoute>} />
          <Route path="/admin/*" element={<AdminRedirect />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConsentNotice />
      <InstallPrompt />
    </BrowserRouter>
  )
}

export default function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <BetSlipProvider>
            <App />
          </BetSlipProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
