import { Age, GameId, GameSession, PlayerProfile } from '../types';
import { progressRepository } from './progressRepository';

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
    createdAt: new Date().toISOString()
  };
}

export function getStoredPlayers(): PlayerProfile[] {
  const players = progressRepository.getPlayers();
  if (players.length) return players;

  const defaultPlayer = createPlayerProfile('שחקן/ית 1', 4);
  progressRepository.savePlayers([defaultPlayer]);
  return [defaultPlayer];
}

export function savePlayers(players: PlayerProfile[]): void {
  progressRepository.savePlayers(players);
}

export function getStoredSessions(): GameSession[] {
  return progressRepository.getSessions();
}

export function saveGameSession(session: Omit<GameSession, 'id' | 'completedAt'>): GameSession {
  const nextSession: GameSession = {
    ...session,
    id: createId('session'),
    completedAt: new Date().toISOString(),
    syncStatus: session.syncStatus ?? 'local'
  };
  const sessions = [nextSession, ...getStoredSessions()].slice(0, 240);
  progressRepository.saveSessions(sessions);
  return nextSession;
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
