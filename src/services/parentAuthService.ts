import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured');
  return auth;
}

export function watchParentAuth(onChange: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    onChange(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, onChange);
}

export function getCurrentParentUser(): User | null {
  return getFirebaseAuth()?.currentUser ?? null;
}

export async function signInParent(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export async function registerParent(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export function signOutParent(): Promise<void> {
  return signOut(requireAuth());
}
