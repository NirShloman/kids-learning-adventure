import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import { GameSession, PlayerProfile } from '../types';
import { getDb } from './firebase';

interface CloudProgressPayload {
  players: PlayerProfile[];
  sessions: GameSession[];
}

function requireDb() {
  const db = getDb();
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

export async function pushProgressToCloud(parentId: string, players: PlayerProfile[], sessions: GameSession[]): Promise<GameSession[]> {
  const db = requireDb();
  await setDoc(doc(db, 'parents', parentId), { updatedAt: new Date().toISOString() }, { merge: true });

  await Promise.all(players.map((player) => (
    setDoc(doc(db, 'parents', parentId, 'children', player.id), { ...player, ownerId: parentId }, { merge: true })
  )));

  const syncedSessions = sessions.map((session) => ({ ...session, ownerId: parentId, syncStatus: 'synced' as const }));
  await Promise.all(syncedSessions.map((session) => (
    setDoc(doc(db, 'parents', parentId, 'sessions', session.id), session, { merge: true })
  )));

  return syncedSessions;
}

export async function pullProgressFromCloud(parentId: string): Promise<CloudProgressPayload> {
  const db = requireDb();
  const [childrenSnapshot, sessionsSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'parents', parentId, 'children'), where('ownerId', '==', parentId))),
    getDocs(query(collection(db, 'parents', parentId, 'sessions'), where('ownerId', '==', parentId), orderBy('completedAt', 'desc')))
  ]);

  const players = childrenSnapshot.docs.map((childDoc) => childDoc.data() as PlayerProfile);
  const sessions = sessionsSnapshot.docs.map((sessionDoc) => sessionDoc.data() as GameSession);

  return { players, sessions };
}
