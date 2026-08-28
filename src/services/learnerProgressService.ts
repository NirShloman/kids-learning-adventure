import type { LearnerSettings, LocalGameSession, LocalLearnerState } from '../types';
import {
  createProfile, deleteAllLearningData, getActiveProfile, getLearningSnapshot,
  getProfileData, saveProfileRecentContent, saveSessionSummary, updateProfile
} from './learningStoreService';

function compatibilityState(): LocalLearnerState {
  const profile = getActiveProfile();
  if (!profile) return { schemaVersion: 3, name: '', gender: null, profileCompleted: false, age: 4,
    difficulty: 'medium', voiceEnabled: true, narrationEnabled: true, soundEffectsEnabled: true,
    musicEnabled: true, migratedFromLegacy: false, updatedAt: new Date(0).toISOString() };
  return { schemaVersion: 3, name: profile.name, gender: profile.gender, profileCompleted: true,
    age: profile.age, difficulty: profile.manualDifficulty, voiceEnabled: profile.narrationEnabled,
    narrationEnabled: profile.narrationEnabled, soundEffectsEnabled: profile.soundEffectsEnabled,
    musicEnabled: profile.musicEnabled, migratedFromLegacy: false, updatedAt: profile.updatedAt };
}

export function getLocalLearnerState(): LocalLearnerState { return compatibilityState(); }

export function saveLearnerSettings(settings: LearnerSettings): LocalLearnerState {
  const profile = getActiveProfile() ?? createProfile({});
  const profileFields = settings as LearnerSettings & Partial<Pick<LocalLearnerState, 'name' | 'gender'>>;
  updateProfile(profile.id, { age: settings.age, manualDifficulty: settings.difficulty, learningMode: 'manual',
    narrationEnabled: settings.narrationEnabled, soundEffectsEnabled: settings.soundEffectsEnabled,
    musicEnabled: settings.musicEnabled,
    ...(profileFields.name !== undefined ? { name: profileFields.name } : {}),
    ...(profileFields.gender !== undefined ? {
      gender: profileFields.gender,
      avatarId: profileFields.gender === 'boy' ? 'nir-kippah' : 'shir'
    } : {}) });
  return compatibilityState();
}

export function getStoredSessions(): LocalGameSession[] {
  const snapshot = getLearningSnapshot(); const profile = getActiveProfile(snapshot);
  if (!profile) return [];
  return getProfileData(profile.id, snapshot).sessions.map((session) => ({ id: session.id,
    gameId: session.gameId ?? 'letters', gameTitle: session.gameId ?? 'תרגול מותאם', mode: 'quiz',
    age: profile.age, difficulty: profile.manualDifficulty, score: session.correct, total: session.total,
    stars: session.total ? Math.round((session.correct / session.total) * 3) : 0, completedAt: session.completedAt }));
}

export function saveGameSession(session: Omit<LocalGameSession, 'id' | 'completedAt'>): LocalGameSession {
  const profile = getActiveProfile(); if (!profile) throw new Error('No active profile');
  const completedAt = new Date().toISOString(); const id = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  saveSessionSummary({ id, profileId: profile.id, gameId: session.gameId, mode: 'manual',
    startedAt: completedAt, completedAt, durationSeconds: 0, correct: session.score, total: session.total });
  return { ...session, id, completedAt };
}

export function getRecentContent(key: string): string[] {
  const profile = getActiveProfile(); return profile ? getProfileData(profile.id).recentContent[key] ?? [] : [];
}
export function saveRecentContent(key: string, ids: string[]): void {
  const profile = getActiveProfile(); if (profile) saveProfileRecentContent(profile.id, key, ids);
}
export function resetLocalLearnerData(): Promise<void> { return deleteAllLearningData(); }
