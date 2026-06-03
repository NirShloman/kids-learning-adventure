import { enableIndexedDbPersistence } from 'firebase/firestore';
import { getDb } from './firebase';

let persistencePromise: Promise<void> | null = null;

export function enableOptionalFirestorePersistence(): Promise<void> {
  const db = getDb();
  if (!db || typeof window === 'undefined') return Promise.resolve();
  if (!persistencePromise) {
    persistencePromise = enableIndexedDbPersistence(db).then(() => undefined).catch(() => undefined);
  }

  return persistencePromise;
}
