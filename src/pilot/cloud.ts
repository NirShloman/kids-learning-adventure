import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, getDocsFromServer, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import type { Checkpoint, KindergartenAccount, LearningOperation, ProfileRecord } from './model';

const app = initializeApp({ apiKey: import.meta.env.VITE_PILOT_API_KEY, authDomain: import.meta.env.VITE_PILOT_AUTH_DOMAIN, projectId: import.meta.env.VITE_PILOT_PROJECT_ID, appId: import.meta.env.VITE_PILOT_APP_ID }, 'kindergarten-pilot');
export const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west1');
if ((import.meta.env.DEV || import.meta.env.MODE === 'pilot-test') && import.meta.env.VITE_PILOT_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8088);
  connectFunctionsEmulator(functions, '127.0.0.1', 5008);
}
export const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
export const observeAccount = (callback: Parameters<typeof onAuthStateChanged>[1]) => onAuthStateChanged(auth, callback);
export async function reauthenticate(password: string): Promise<void> {
  if (!auth.currentUser?.email) throw new Error('Sign in required');
  await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, password));
}
export async function call<T>(name: string, data: unknown = {}): Promise<T> { return (await httpsCallable<unknown, T>(functions, name)(data)).data; }
export const accountInfo = () => call<KindergartenAccount & { pinSet: boolean }>('pilotAccount');
export const submitOperation = (operation: LearningOperation) => call<{ deleted: boolean }>('pilotApply', operation);
export async function pullRecords(kindergartenId: string): Promise<{ records: Record<string, ProfileRecord>; checkpoints: Checkpoint[] }> {
  const [profiles, states, checkpoints] = await Promise.all([
    getDocsFromServer(collection(db, 'kindergartens', kindergartenId, 'profiles')),
    getDocsFromServer(collection(db, 'kindergartens', kindergartenId, 'states')),
    getDocsFromServer(collection(db, 'kindergartens', kindergartenId, 'checkpoints'))
  ]);
  const records: Record<string, ProfileRecord> = {};
  const data = new Map(states.docs.map(doc => [doc.id, doc.data()]));
  profiles.docs.forEach(doc => { records[doc.id] = { ...doc.data(), data: data.get(doc.id)?.data } as ProfileRecord; });
  return { records, checkpoints: checkpoints.docs.map(doc => doc.data() as Checkpoint) };
}
