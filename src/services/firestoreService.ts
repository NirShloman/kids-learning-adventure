import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import {
  GameSession,
  MatchingPair,
  MemoryCard,
  PatternPuzzle,
  PlayerProfile,
  QuizQuestion,
  SortingChallenge
} from '../types';
import { getCurrentUserId } from './authService';
import { getDb } from './firebase';

type QuizCategory = QuizQuestion['category'];

interface QuestionBankDoc<T> {
  questions?: T[];
  items?: T[];
}

async function requireCloudContext() {
  const db = getDb();
  const ownerId = await getCurrentUserId();
  if (!db || !ownerId) return null;
  return { db, ownerId };
}

export async function getPlayersFromFirestore(): Promise<PlayerProfile[]> {
  const context = await requireCloudContext();
  if (!context) return [];

  const playersQuery = query(collection(context.db, 'players'), where('ownerId', '==', context.ownerId));
  const snapshot = await getDocs(playersQuery);
  return snapshot.docs.map((playerDoc) => playerDoc.data() as PlayerProfile);
}

export async function saveAllPlayersToFirestore(players: PlayerProfile[]): Promise<void> {
  const context = await requireCloudContext();
  if (!context) return;

  await Promise.all(players.map((player) => {
    const cloudPlayer: PlayerProfile = { ...player, ownerId: context.ownerId };
    return setDoc(doc(context.db, 'players', player.id), cloudPlayer, { merge: true });
  }));
}

export async function getSessionsFromFirestore(): Promise<GameSession[]> {
  const context = await requireCloudContext();
  if (!context) return [];

  const sessionsQuery = query(
    collection(context.db, 'sessions'),
    where('ownerId', '==', context.ownerId),
    orderBy('completedAt', 'desc'),
    limit(240)
  );
  const snapshot = await getDocs(sessionsQuery);
  return snapshot.docs.map((sessionDoc) => sessionDoc.data() as GameSession);
}

export async function getSessionsByPlayerFromFirestore(playerId: string): Promise<GameSession[]> {
  const context = await requireCloudContext();
  if (!context) return [];

  const sessionsQuery = query(
    collection(context.db, 'sessions'),
    where('ownerId', '==', context.ownerId),
    where('playerId', '==', playerId),
    orderBy('completedAt', 'desc'),
    limit(120)
  );
  const snapshot = await getDocs(sessionsQuery);
  return snapshot.docs.map((sessionDoc) => sessionDoc.data() as GameSession);
}

export async function saveSessionToFirestore(session: GameSession): Promise<GameSession | null> {
  const context = await requireCloudContext();
  if (!context) return null;

  const cloudSession: GameSession = { ...session, ownerId: context.ownerId, syncStatus: 'synced' };
  await setDoc(doc(context.db, 'sessions', session.id), cloudSession, { merge: true });
  return cloudSession;
}

export async function syncLocalToFirestore(players: PlayerProfile[], sessions: GameSession[]): Promise<void> {
  const context = await requireCloudContext();
  if (!context) return;

  await Promise.all([
    saveAllPlayersToFirestore(players.map((player) => ({ ...player, ownerId: context.ownerId }))),
    Promise.all(sessions.map((session) => saveSessionToFirestore({ ...session, ownerId: context.ownerId })))
  ]);
}

async function getQuestionBankDocument<T>(id: string): Promise<QuestionBankDoc<T> | null> {
  const db = getDb();
  if (!db) return null;

  const snapshot = await getDoc(doc(db, 'questionBank', id));
  return snapshot.exists() ? snapshot.data() as QuestionBankDoc<T> : null;
}

export async function getQuizQuestionsFromFirestore(category: QuizCategory): Promise<QuizQuestion[]> {
  const data = await getQuestionBankDocument<QuizQuestion>(category);
  return data?.questions ?? [];
}

export async function getMatchingPairsFromFirestore(): Promise<MatchingPair[]> {
  const data = await getQuestionBankDocument<MatchingPair>('matchingPairs');
  return data?.items ?? [];
}

export async function getMemoryCardsFromFirestore(): Promise<MemoryCard[]> {
  const data = await getQuestionBankDocument<MemoryCard>('memoryCards');
  return data?.items ?? [];
}

export async function getPatternPuzzlesFromFirestore(): Promise<PatternPuzzle[]> {
  const data = await getQuestionBankDocument<PatternPuzzle>('patternPuzzles');
  return data?.items ?? [];
}

export async function getSortingChallengesFromFirestore(): Promise<SortingChallenge[]> {
  const data = await getQuestionBankDocument<SortingChallenge>('sortingChallenges');
  return data?.items ?? [];
}

export async function getQuestionBankVersion(): Promise<number | null> {
  const db = getDb();
  if (!db) return null;

  const snapshot = await getDoc(doc(db, 'questionBank', '_meta'));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as { version?: number };
  return typeof data.version === 'number' ? data.version : null;
}
