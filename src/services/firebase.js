// Firebase bootstrap — lazy, env-driven.
//
// Every service talks to Firebase only through this module so the app
// never imports `firebase/*` directly. When VITE_FIREBASE_* env vars are
// unset the app runs fully on localStorage (demo/offline mode).
//
// To go live:
//   1. Create a Firebase web app in the console (Project settings → Your apps).
//   2. Copy the config values into a new `.env` file (see `.env.example`).
//   3. The firebase SDK is loaded lazily on first use, so an empty config
//      costs nothing at runtime.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let initPromise = null

export async function ensureFirebase() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Create a .env file with the VITE_FIREBASE_* values (see .env.example).',
    )
  }
  if (!initPromise) {
    initPromise = (async () => {
      const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      const app = getApps().length ? getApps()[0] : initializeApp(config)
      return { app, auth: getAuth(app), db: getFirestore(app) }
    })()
  }
  return initPromise
}

export async function getDb() {
  const { db } = await ensureFirebase()
  return db
}

export async function getAuth() {
  const { auth } = await ensureFirebase()
  return auth
}
