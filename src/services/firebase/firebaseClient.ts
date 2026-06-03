import { Firestore } from 'firebase/firestore';
import { getDb, getFirebaseApp, isFirebaseConfigured } from '../firebase';

export function getFirestoreClient(): Firestore | null {
  return getDb();
}

export function requireFirestoreClient(): Firestore {
  const db = getFirestoreClient();
  if (!db) {
    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* environment variables first.');
  }
  return db;
}

export { getFirebaseApp, isFirebaseConfigured };
