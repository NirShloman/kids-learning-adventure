import { Age, GameId, GameSession, PlayerProfile } from '../types';
import { getDefaultDifficultyByAge } from '../data/levels';
import { progressRepository } from './progressRepository';
import {
  getPlayersFromFirestore,
  getSessionsFromFirestore,
  saveAllPlayersToFirestore,
  saveSessionToFirestore,
  syncLocalToFirestore
} from './firestoreService';
import { trackEvent } from './analyticsService';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPlayerProfile(name: string, age: Age): PlayerProfile {
  return {
    id: createId('player'),
    name: name.trim() || 'שחקן/ית חדש/ה',
    age,
    difficulty: getDefaultDifficultyByAge(age),
    createdAt: new Date().toISOString()
  };
}

function normalizePlayerProfile(player: PlayerProfile): PlayerProfile {
  return {
    ...player,
    difficulty: player.difficulty ?? getDefaultDifficultyByAge(player.age)
  };
}

function ensureDefaultPlayers(players: PlayerProfile[]): PlayerProfile[] {
  if (players.length) return players.map(normalizePlayerProfile);

  const defaultPlayer = createPlayerProfile('שחקן/ית 1', 4);
  progressRepository.savePlayers([defaultPlayer]);
  return [defaultPlayer];
}

export function getStoredPlayers(): PlayerProfile[] {
  const players = ensureDefaultPlayers(progressRepository.getPlayers());
  progressRepository.savePlayers(players);
  return players;
}

export function savePlayers(players: PlayerProfile[]): void {
  progressRepository.savePlayers(players);
  saveAllPlayersToFirestore(players).catch(() => {
    trackEvent('firestore_sync_failed');
    // Cloud sync is best-effort; local progress remains the source of truth.
  });
}

export function getStoredSessions(): GameSession[] {
  return progressRepository.getSessions();
}

export function saveSessions(sessions: GameSession[]): void {
  progressRepository.saveSessions(sessions);
}

export function saveGameSession(session: Omit<GameSession, 'id' | 'completedAt'>): GameSession {
  const nextSession: GameSession = {
    ...session,
    id: createId('session'),
    completedAt: new Date().toISOString(),
    syncStatus: session.syncStatus ?? 'pending'
  };
  const sessions = [nextSession, ...getStoredSessions()].slice(0, 240);
  progressRepository.saveSessions(sessions);

  saveSessionToFirestore(nextSession)
    .then((syncedSession) => {
      if (!syncedSession) return;
      const updatedSessions = getStoredSessions().map((storedSession) => (
        storedSession.id === syncedSession.id ? syncedSession : storedSession
      ));
      progressRepository.saveSessions(updatedSessions);
      trackEvent('firestore_sync_success');
    })
    .catch(() => {
      trackEvent('firestore_sync_failed');
      progressRepository.saveSessions(getStoredSessions().map((storedSession) => (
        storedSession.id === nextSession.id ? { ...storedSession, syncStatus: 'pending' } : storedSession
      )));
    });

  return nextSession;
}

export async function loadPlayersWithSync(): Promise<PlayerProfile[]> {
  const localPlayers = getStoredPlayers();

  try {
    const remotePlayers = await getPlayersFromFirestore();
    if (remotePlayers.length) {
      const normalizedRemote = remotePlayers.map(normalizePlayerProfile);
      progressRepository.savePlayers(normalizedRemote);
      return normalizedRemote;
    }

    await syncLocalToFirestore(localPlayers, getStoredSessions());
    trackEvent('firestore_sync_success');
    return localPlayers;
  } catch {
    trackEvent('firestore_sync_failed');
    return localPlayers;
  }
}

export async function loadSessionsWithSync(): Promise<GameSession[]> {
  const localSessions = getStoredSessions();

  try {
    const remoteSessions = await getSessionsFromFirestore();
    if (remoteSessions.length) {
      progressRepository.saveSessions(remoteSessions);
      return remoteSessions;
    }

    await syncLocalToFirestore(getStoredPlayers(), localSessions);
    trackEvent('firestore_sync_success');
    return localSessions;
  } catch {
    trackEvent('firestore_sync_failed');
    return localSessions;
  }
}

export function getSessionsByPlayer(sessions: GameSession[], playerId: string): GameSession[] {
  return sessions.filter((session) => session.playerId === playerId);
}

export function getGameLabel(gameId: GameId): string {
  const labels: Record<GameId, string> = {
    letters: 'אותיות',
    numbers: 'מספרים',
    shapes: 'צורות',
    colors: 'צבעים',
    matching: 'התאמה',
    memory: 'זיכרון',
    patterns: 'רצפים',
    sorting: 'מיון וסיווג'
  };

  return labels[gameId];
}
