import {
  Difficulty,
  LearnerSettings,
  LocalGameSession,
  LocalLearnerState
} from '../types';

const LEARNER_KEY = 'lomdim-bekef.learner.v1';
const SESSIONS_KEY = 'lomdim-bekef.sessions.v1';
const RECENT_CONTENT_KEY = 'lomdim-bekef.recent-content.v1';
const LEGACY_PLAYERS_KEY = 'kids-learning-adventure.players';
const LEGACY_SESSIONS_KEY = 'kids-learning-adventure.sessions';

interface LegacyPlayer {
  id: string;
  age?: number;
  difficulty?: Difficulty;
  voiceEnabled?: boolean;
}

interface LegacySession extends Omit<LocalGameSession, 'id'> {
  id?: string;
  playerId?: string;
}

type RecentContentMap = Record<string, string[]>;

const defaultLearner: LocalLearnerState = {
  schemaVersion: 1,
  age: 4,
  difficulty: 'medium',
  voiceEnabled: true,
  migratedFromLegacy: false,
  updatedAt: new Date(0).toISOString()
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isValidAge(value: number | undefined): value is LocalLearnerState['age'] {
  return value === 3 || value === 4 || value === 5 || value === 6;
}

function isValidDifficulty(value: Difficulty | undefined): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function migrateLegacyState(): LocalLearnerState {
  const players = readStorage<LegacyPlayer[]>(LEGACY_PLAYERS_KEY, []);
  const firstPlayer = players[0];
  const migrated: LocalLearnerState = {
    ...defaultLearner,
    age: isValidAge(firstPlayer?.age) ? firstPlayer.age : defaultLearner.age,
    difficulty: isValidDifficulty(firstPlayer?.difficulty) ? firstPlayer.difficulty : defaultLearner.difficulty,
    voiceEnabled: typeof firstPlayer?.voiceEnabled === 'boolean' ? firstPlayer.voiceEnabled : defaultLearner.voiceEnabled,
    migratedFromLegacy: Boolean(firstPlayer),
    updatedAt: new Date().toISOString()
  };

  if (firstPlayer) {
    const legacySessions = readStorage<LegacySession[]>(LEGACY_SESSIONS_KEY, []);
    const migratedSessions = legacySessions
      .filter((session) => !session.playerId || session.playerId === firstPlayer.id)
      .map(({ playerId: _playerId, ...session }, index): LocalGameSession => ({
        ...session,
        id: session.id ?? `legacy-session-${index + 1}`
      }))
      .slice(0, 240);
    writeStorage(SESSIONS_KEY, migratedSessions);
  }

  writeStorage(LEARNER_KEY, migrated);
  return migrated;
}

export function getLocalLearnerState(): LocalLearnerState {
  const stored = readStorage<LocalLearnerState | null>(LEARNER_KEY, null);
  return stored?.schemaVersion === 1 ? stored : migrateLegacyState();
}

export function saveLearnerSettings(settings: LearnerSettings): LocalLearnerState {
  const current = getLocalLearnerState();
  const next: LocalLearnerState = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString()
  };
  writeStorage(LEARNER_KEY, next);
  return next;
}

export function getStoredSessions(): LocalGameSession[] {
  getLocalLearnerState();
  return readStorage<LocalGameSession[]>(SESSIONS_KEY, []);
}

export function saveGameSession(session: Omit<LocalGameSession, 'id' | 'completedAt'>): LocalGameSession {
  const next: LocalGameSession = {
    ...session,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `session-${crypto.randomUUID()}`
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    completedAt: new Date().toISOString()
  };
  writeStorage(SESSIONS_KEY, [next, ...getStoredSessions()].slice(0, 240));
  return next;
}

export function getRecentContent(key: string): string[] {
  return readStorage<RecentContentMap>(RECENT_CONTENT_KEY, {})[key] ?? [];
}

export function saveRecentContent(key: string, ids: string[]): void {
  const recent = readStorage<RecentContentMap>(RECENT_CONTENT_KEY, {});
  writeStorage(RECENT_CONTENT_KEY, { ...recent, [key]: ids.slice(0, 20) });
}
