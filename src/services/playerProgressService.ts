import { Age, GameId, GameSession, PlayerProfile } from '../types';

const PLAYERS_STORAGE_KEY = 'kids-learning-adventure.players';
const SESSIONS_STORAGE_KEY = 'kids-learning-adventure.sessions';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
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
  const players = readStorage<PlayerProfile[]>(PLAYERS_STORAGE_KEY, []);
  if (players.length) return players;

  const defaultPlayer = createPlayerProfile('שחקן/ית 1', 4);
  writeStorage(PLAYERS_STORAGE_KEY, [defaultPlayer]);
  return [defaultPlayer];
}

export function savePlayers(players: PlayerProfile[]): void {
  writeStorage(PLAYERS_STORAGE_KEY, players);
}

export function getStoredSessions(): GameSession[] {
  return readStorage<GameSession[]>(SESSIONS_STORAGE_KEY, []);
}

export function saveGameSession(session: Omit<GameSession, 'id' | 'completedAt'>): GameSession {
  const nextSession: GameSession = {
    ...session,
    id: createId('session'),
    completedAt: new Date().toISOString()
  };
  const sessions = [nextSession, ...getStoredSessions()].slice(0, 240);
  writeStorage(SESSIONS_STORAGE_KEY, sessions);
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
