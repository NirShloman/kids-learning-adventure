import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, Auth } from 'firebase/auth';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';

const firebaseEnv = import.meta.env ?? {};
const isFirebaseDisabledForE2E = firebaseEnv.VITE_E2E_DISABLE_FIREBASE === '1';
const shouldUseFirebaseEmulator = firebaseEnv.VITE_E2E_USE_FIREBASE_EMULATOR === '1';

const firebaseConfig = {
  apiKey: firebaseEnv.VITE_FIREBASE_API_KEY,
  authDomain: firebaseEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnv.VITE_FIREBASE_APP_ID,
  measurementId: firebaseEnv.VITE_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = !isFirebaseDisabledForE2E && Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isFirestoreEmulatorConnected = false;
let isAuthEmulatorConnected = false;

function parseEmulatorHost(value: string | undefined, fallbackPort: number): { host: string; port: number } {
  const [host = '127.0.0.1', rawPort] = (value || `127.0.0.1:${fallbackPort}`).split(':');
  const port = Number(rawPort);
  return {
    host,
    port: Number.isFinite(port) ? port : fallbackPort
  };
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function getDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!db) {
    db = getFirestore(firebaseApp);
    if (shouldUseFirebaseEmulator && !isFirestoreEmulatorConnected) {
      const { host, port } = parseEmulatorHost(firebaseEnv.VITE_FIRESTORE_EMULATOR_HOST, 8080);
      connectFirestoreEmulator(db, host, port);
      isFirestoreEmulatorConnected = true;
    }
  }
  return db;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!auth) {
    auth = getAuth(firebaseApp);
    if (shouldUseFirebaseEmulator && !isAuthEmulatorConnected) {
      const authHost = firebaseEnv.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
      connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
      isAuthEmulatorConnected = true;
    }
  }
  return auth;
}
