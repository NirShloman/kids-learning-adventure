import { GameSession, PlayerProfile } from '../types';

const PLAYERS_STORAGE_KEY = 'kids-learning-adventure.players';
const SESSIONS_STORAGE_KEY = 'kids-learning-adventure.sessions';

export interface ProgressRepository {
  getPlayers: () => PlayerProfile[];
  savePlayers: (players: PlayerProfile[]) => void;
  getSessions: () => GameSession[];
  saveSessions: (sessions: GameSession[]) => void;
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

export const localProgressRepository: ProgressRepository = {
  getPlayers: () => readStorage<PlayerProfile[]>(PLAYERS_STORAGE_KEY, []),
  savePlayers: (players) => writeStorage(PLAYERS_STORAGE_KEY, players),
  getSessions: () => readStorage<GameSession[]>(SESSIONS_STORAGE_KEY, []),
  saveSessions: (sessions) => writeStorage(SESSIONS_STORAGE_KEY, sessions)
};

export interface CloudProgressAdapter {
  pull: () => Promise<{ players: PlayerProfile[]; sessions: GameSession[] }>;
  push: (players: PlayerProfile[], sessions: GameSession[]) => Promise<void>;
}

export const progressRepository = localProgressRepository;
