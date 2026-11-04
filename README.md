# BETVORA — Where Africa Wins Together

Demo betting platform built with **React + Vite + Tailwind CSS + Lucide React**.

> Demo product. All money is simulated demo money — no real payments.

## Stack

- Frontend: React 19 + Vite
- Styling: Tailwind CSS v4 (CSS-first config in `src/index.css`)
- Icons: Lucide React
- Data layer: mock services in `src/services/` backed by localStorage (Firebase slot-in planned)

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run lint     # oxlint
npm run test     # vitest unit tests (betting engine, formatters)
```

## Demo credentials

- Email: `demo@betvora.app` / Password: `Demo@123`
- OTP verification: `123456` (first 4 digits)
- Password reset code: `654321`
- Admin: `admin@betvora.app` / `Admin@123` (id `u000`, seeded as verified admin)

## Demo notes

- All money is simulated. The betting engine is real: selections store an
  `outcomeKey` (e.g. `home`, `draw`, `homeOrDraw`, `over25`, `yes`, `2-1`)
  and admin match settlement evaluates every pending bet, crediting winners,
  marking losers, and refunding voided stakes.
- Firebase is scaffolded (`firebase.json`, `firestore.rules`,
  `firestore.indexes.json`, `.env.example`) but not enabled; services run on
  localStorage mocks with Firebase-ready signatures. See
  `src/services/firebase.js` for the go-live steps.

## Go live & deploy

### 1. Manual deploy (Firebase Hosting)

```bash
firebase login
firebase deploy --only hosting,firestore   # hosting + rules + indexes
```

The default project is `betvora-d0b2b` (see `.firebaserc`).

### 2. Auto-deploy on every push to `main`

A GitHub Actions workflow is already in place (`.github/workflows/deploy.yml`).
To activate it:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create betvora --private --source=. --push   # or create on github.com then add remote
```

Then add a CI token so the workflow can deploy:

1. In the Firebase console → **Project settings → Service accounts → Generate new private key**.
   Keep the JSON safe — it is your service account credentials.
2. Get a deploy token:
   ```bash
   firebase login:ci
   ```
   This prints a long `FIREBASE_TOKEN`.
3. On GitHub → repo **Settings → Secrets and variables → Actions**, add:
   - `FIREBASE_TOKEN` = the token from step 2.

Every push to `main` now builds and deploys Hosting + Firestore automatically.

### 3. Custom domain

1. `firebase hosting:channel:deploy preview` (optional) or go straight to the
   **Hosting** tab of the Firebase console → **Add custom domain**.
2. Add the two records it shows (an `A` record and a `TXT` verification record)
   at your DNS provider. This is the only step that must happen outside the
   Firebase console.
3. Click **Verify** and let the cert provision (a few minutes to a couple of
   hours). HTTPS is automatic. Keep the `*.` subdomain record to also cover
   `www`.

## Project structure

```
src/
├── assets/
├── components/
│   ├── common/     Button, Input, Card, Badge, Modal, Tabs, Dropdown, Logo...
│   ├── layout/     TopHeader, Sidebar, BottomNavigation
│   ├── sports/     MatchCard, OddsButton, SportCategory, LeagueCard...
│   ├── betting/    BetSlipItem
│   ├── wallet/     WalletCard
│   └── home/       PromotionBanner
├── pages/
│   ├── auth/       Splash, Onboarding, Login, Register, VerifyOtp, ForgotPassword
│   ├── user/       Home, Sports, In-Play, Match Details, Bet Slip, My Bets, Wallet,
│   │               Profile + personal/verification/security/promotions/referral/support/settings
│   └── admin/      Dashboard, Users, Sports, Bets, Wallet, Promotions
├── layouts/        AuthLayout, UserLayout, AdminLayout
├── services/       firebase (stub), auth, bet, match, wallet, promotion, notification, user
├── context/        AuthContext, BetSlipContext, WalletContext
├── data/           demoData.js (sports, leagues, matches, markets, promotions, demo bets)
└── utils/          format.js, cn.js
```

## Roadmap progress

- [x] 01 Project Setup
- [x] 02 Folder Architecture
- [x] 03 Design System
- [x] 04 Global Layout
- [x] 05 Authentication UI (mock auth)
- [x] 06 Home
- [x] 07 Sports & Matches catalogue
- [x] 08 In-Play
- [x] 09 Match Details + Odds
- [x] 10 Bet Slip
- [x] 11 Demo Wallet
- [x] 12 Firebase scaffolding (config, rules, indexes — activation pending)
- [x] 13 Auth + data services (mock, Firebase-ready)
- [x] 14 Admin console (dashboard, users, sports, bets, wallet, promotions)
- [x] 15 Promotions
- [x] 16 Notifications
- [x] 17 Profile & settings sub-pages
- [x] 18 Betting engine + settlement flow
- [x] 19 Firestore security rules
- [x] 20 Unit tests (Vitest — 19 passing)
- [x] 21 Deploy (Firebase Hosting: `firebase deploy` + GitHub Actions auto-deploy)
