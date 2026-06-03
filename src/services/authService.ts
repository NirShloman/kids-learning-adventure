import { signInAnonymously, User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';

export function getCurrentUser(): User | null {
  return getFirebaseAuth()?.currentUser ?? null;
}

export async function ensureSignedIn(): Promise<User | null> {
  if (!isFirebaseConfigured) return null;

  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await ensureSignedIn();
  return user?.uid ?? null;
}
