import type {
  AccessibilitySettings, Age, Difficulty, LearnerGender, LearnerProfile,
  LearningEvent, LearningSessionSummary, LearningSnapshotV4, LocalGameSession,
  ProfileLearningData, SessionPlan
} from '../types';
import { applyLearningEvent, effectiveNow, emptyMastery } from '../learning/masteryEngine';
import { getLocalDataStore } from './localDataStore';
import { collectionMilestones, worldCollection, worldProgress } from '../data/worldCollection';

export const SNAPSHOT_KEY = 'lomdim-bekef.learning.v4';
const MIGRATION_MARKER_KEY = 'lomdim-bekef.migration.v4';
const OLD_LEARNER_KEY = 'lomdim-bekef.learner.v1';
const OLD_SESSIONS_KEY = 'lomdim-bekef.sessions.v1';
const OLD_RECENT_KEY = 'lomdim-bekef.recent-content.v1';
const LEGACY_PLAYERS_KEY = 'kids-learning-adventure.players';
const LEGACY_SESSIONS_KEY = 'kids-learning-adventure.sessions';
const MAX_EVENTS = 5_000;
const MAX_SESSIONS = 500;

export const defaultAccessibilitySettings: AccessibilitySettings = {
  noTimeLimit: true, reducedMotion: false, reducedParticles: false,
  reducedBackgroundAudio: false, fewerItems: false, largeTouchTargets: false,
  highContrast: false, slowNarration: false, extendedResponseTime: false,
  disableMovingObstacles: false, strongGuidance: false, strongSnap: false
};

function nowIso(): string { return new Date().toISOString(); }
function createId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function read<T>(key: string, fallback: T): T {
  try { const value = getLocalDataStore().getCached(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function writeSnapshot(snapshot: LearningSnapshotV4): LearningSnapshotV4 {
  // Earned keepsakes outlive the bounded session / discovery history.
  for (const data of Object.values(snapshot.dataByProfile)) {
    const decorations = new Set(data.journey.decorationIds);
    for (const world of worldCollection) {
      const { count } = worldProgress(data, world.gameId);
      for (const milestone of collectionMilestones) if (count >= milestone) decorations.add(`keepsake:${world.gameId}:${milestone}`);
    }
    data.journey = { ...data.journey, decorationIds: [...decorations] };
  }
  void getLocalDataStore().set(SNAPSHOT_KEY, JSON.stringify(snapshot)); return snapshot;
}
function isAge(value: unknown): value is Age { return value === 3 || value === 4 || value === 5 || value === 6; }
function isDifficulty(value: unknown): value is Difficulty { return value === 'easy' || value === 'medium' || value === 'hard'; }
function emptyProfileData(at: string): ProfileLearningData {
  return { mastery: {}, events: [], sessions: [], recentContent: {}, activePlan: null,
    journey: { unlockedWorlds: ['letters'], completedLevelIds: [], decorationIds: [] },
    lastEffectiveNow: at, dailyContentCounts: {} };
}

export function createDefaultProfile(overrides: Partial<LearnerProfile> = {}): LearnerProfile {
  const at = nowIso();
  return { id: createId('profile'), name: '', age: 4, gender: null, avatarId: 'shir',
    learningMode: 'automatic', manualDifficulty: 'medium', narrationEnabled: true,
    soundEffectsEnabled: true, musicEnabled: true, narrationVolume: 80,
    soundEffectsVolume: 75, musicVolume: 45,
    createdAt: at, updatedAt: at, ...overrides,
    accessibility: { ...defaultAccessibilitySettings, ...overrides.accessibility } };
}

interface OldLearner { schemaVersion?: number; name?: string; gender?: LearnerGender | null; age?: Age; difficulty?: Difficulty; voiceEnabled?: boolean; narrationEnabled?: boolean; soundEffectsEnabled?: boolean; musicEnabled?: boolean }
interface LegacyPlayer { id: string; name?: string; age?: Age; difficulty?: Difficulty; voiceEnabled?: boolean; gender?: LearnerGender }

function migratedSnapshot(): LearningSnapshotV4 {
  const old = read<OldLearner | null>(OLD_LEARNER_KEY, null);
  const legacyPlayers = read<LegacyPlayer[]>(LEGACY_PLAYERS_KEY, []);
  const first = legacyPlayers[0];
  const source = old ?? first;
  if (!source) return { schemaVersion: 4, migrationState: 'complete', activeProfileId: null, profiles: [], dataByProfile: {}, updatedAt: nowIso() };
  const profile = createDefaultProfile({ name: source.name ?? '', age: isAge(source.age) ? source.age : 4,
    gender: source.gender ?? null, avatarId: source.gender === 'boy' ? 'nir-kippah' : 'shir',
    manualDifficulty: isDifficulty(source.difficulty) ? source.difficulty : 'medium',
    narrationEnabled: old?.narrationEnabled ?? source.voiceEnabled ?? true,
    soundEffectsEnabled: old?.soundEffectsEnabled ?? true, musicEnabled: old?.musicEnabled ?? true });
  const oldSessions = read<Array<LocalGameSession & { playerId?: string }>>(OLD_SESSIONS_KEY, read(LEGACY_SESSIONS_KEY, []));
  const sessions: LearningSessionSummary[] = oldSessions.filter((session) => !first || !session.playerId || session.playerId === first.id)
    .slice(0, MAX_SESSIONS).map((session, index) => ({ id: session.id ?? `legacy-session-${index + 1}`,
      profileId: profile.id, gameId: session.gameId, mode: 'manual', startedAt: session.completedAt,
      completedAt: session.completedAt, durationSeconds: 0, correct: session.score, total: session.total }));
  const at = nowIso();
  const data = { ...emptyProfileData(at), sessions, recentContent: read<Record<string, string[]>>(OLD_RECENT_KEY, {}) };
  return { schemaVersion: 4, migrationState: 'complete', activeProfileId: profile.id, profiles: [profile], dataByProfile: { [profile.id]: data }, updatedAt: at };
}

export function getLearningSnapshot(): LearningSnapshotV4 {
  const stored = read<LearningSnapshotV4 | null>(SNAPSHOT_KEY, null);
  if (stored?.schemaVersion === 4) return stored;
  const snapshot = migratedSnapshot();
  void getLocalDataStore().set(MIGRATION_MARKER_KEY, JSON.stringify({ state: 'writing', startedAt: nowIso() }));
  writeSnapshot(snapshot);
  void getLocalDataStore().set(MIGRATION_MARKER_KEY, JSON.stringify({ state: 'complete', completedAt: nowIso() }));
  return snapshot;
}

export function getActiveProfile(snapshot = getLearningSnapshot()): LearnerProfile | null {
  return snapshot.profiles.find((profile) => profile.id === snapshot.activeProfileId) ?? null;
}
export function getProfileData(profileId: string, snapshot = getLearningSnapshot()): ProfileLearningData {
  return snapshot.dataByProfile[profileId] ?? emptyProfileData(snapshot.updatedAt);
}
export function createProfile(overrides: Partial<LearnerProfile>): LearnerProfile {
  const snapshot = getLearningSnapshot(); const profile = createDefaultProfile(overrides);
  writeSnapshot({ ...snapshot, activeProfileId: profile.id, profiles: [...snapshot.profiles, profile],
    dataByProfile: { ...snapshot.dataByProfile, [profile.id]: emptyProfileData(profile.createdAt) }, updatedAt: nowIso() });
  return profile;
}
export function updateProfile(profileId: string, updates: Partial<LearnerProfile>): LearnerProfile {
  const snapshot = getLearningSnapshot(); const current = snapshot.profiles.find((profile) => profile.id === profileId);
  if (!current) throw new Error('Profile not found');
  const profile = { ...current, ...updates, accessibility: { ...current.accessibility, ...updates.accessibility }, id: current.id, createdAt: current.createdAt, updatedAt: nowIso() };
  writeSnapshot({ ...snapshot, profiles: snapshot.profiles.map((item) => item.id === profileId ? profile : item), updatedAt: profile.updatedAt }); return profile;
}
export function selectProfile(profileId: string): LearnerProfile {
  const snapshot = getLearningSnapshot(); const profile = snapshot.profiles.find((item) => item.id === profileId);
  if (!profile) throw new Error('Profile not found');
  writeSnapshot({ ...snapshot, activeProfileId: profileId, updatedAt: nowIso() }); return profile;
}
export function deleteProfile(profileId: string): LearningSnapshotV4 {
  const snapshot = getLearningSnapshot(); const profiles = snapshot.profiles.filter((profile) => profile.id !== profileId);
  const dataByProfile = { ...snapshot.dataByProfile }; delete dataByProfile[profileId];
  return writeSnapshot({ ...snapshot, profiles, dataByProfile,
    activeProfileId: snapshot.activeProfileId === profileId ? profiles[0]?.id ?? null : snapshot.activeProfileId, updatedAt: nowIso() });
}

export type NewLearningEvent = Omit<LearningEvent, 'id' | 'occurredAt' | 'effectiveDay'> & { occurredAt?: string };
export function recordLearningEvent(input: NewLearningEvent): LearningEvent {
  const snapshot = getLearningSnapshot(); const profile = snapshot.profiles.find((item) => item.id === input.profileId);
  if (!profile) throw new Error('Profile not found');
  const data = getProfileData(profile.id, snapshot); const now = effectiveNow(new Date(input.occurredAt ?? nowIso()), data.lastEffectiveNow);
  const event: LearningEvent = { ...input, id: createId('event'), occurredAt: now.toISOString(), effectiveDay: now.toISOString().slice(0, 10) };
  const mastery = { ...data.mastery };
  for (const skillId of event.skillIds) mastery[skillId] = applyLearningEvent(mastery[skillId] ?? emptyMastery(skillId), event, mastery, now);
  const countKey = `${event.effectiveDay}:${event.contentId}`;
  const nextData: ProfileLearningData = { ...data, mastery, events: [...data.events, event].slice(-MAX_EVENTS), lastEffectiveNow: now.toISOString(),
    dailyContentCounts: { ...data.dailyContentCounts, [countKey]: (data.dailyContentCounts[countKey] ?? 0) + 1 } };
  writeSnapshot({ ...snapshot, dataByProfile: { ...snapshot.dataByProfile, [profile.id]: nextData }, updatedAt: nowIso() }); return event;
}
export function saveSessionSummary(summary: LearningSessionSummary): void {
  const snapshot = getLearningSnapshot(); const data = getProfileData(summary.profileId, snapshot);
  writeSnapshot({ ...snapshot, dataByProfile: { ...snapshot.dataByProfile, [summary.profileId]: { ...data, sessions: [summary, ...data.sessions].slice(0, MAX_SESSIONS) } }, updatedAt: nowIso() });
}

export function getAdventureProgress(profileId: string, gameId: import('../types').ExperienceGameId): import('../types/adventure.types').AdventureProgress {
  return getProfileData(profileId).adventures?.[gameId] ?? { version: 1, completed: [], rewards: [], recent: [] };
}

/** Persist evidence and its checkpoint together, so reload cannot duplicate a learning action. */
export function saveAdventureProgress(profileId: string, gameId: import('../types').ExperienceGameId,
  progress: import('../types/adventure.types').AdventureProgress, evidence?: NewLearningEvent): void {
  const snapshot = getLearningSnapshot();
  if (!snapshot.profiles.some(profile => profile.id === profileId)) return;
  const data = getProfileData(profileId, snapshot);
  let nextData = data;
  if (evidence && !data.events.some(event => event.sessionId === evidence.sessionId && event.contentId === evidence.contentId && event.attemptNumber === evidence.attemptNumber)) {
    const now = effectiveNow(new Date(), data.lastEffectiveNow);
    const event: LearningEvent = { ...evidence, id: createId('event'), occurredAt: now.toISOString(), effectiveDay: now.toISOString().slice(0, 10) };
    const mastery = { ...data.mastery };
    for (const skillId of event.skillIds) mastery[skillId] = applyLearningEvent(mastery[skillId] ?? emptyMastery(skillId), event, mastery, now);
    const countKey = `${event.effectiveDay}:${event.contentId}`;
    nextData = { ...data, mastery, events: [...data.events, event].slice(-MAX_EVENTS), lastEffectiveNow: now.toISOString(),
      dailyContentCounts: { ...data.dailyContentCounts, [countKey]: (data.dailyContentCounts[countKey] ?? 0) + 1 } };
  }
  writeSnapshot({ ...snapshot, dataByProfile: { ...snapshot.dataByProfile, [profileId]: {
    ...nextData, adventures: { ...nextData.adventures, [gameId]: progress }
  } }, updatedAt: nowIso() });
}
export function saveActivePlan(profileId: string, plan: SessionPlan | null): void {
  const snapshot = getLearningSnapshot(); const data = getProfileData(profileId, snapshot);
  writeSnapshot({ ...snapshot, dataByProfile: { ...snapshot.dataByProfile, [profileId]: { ...data, activePlan: plan } }, updatedAt: nowIso() });
}

export function getDetectiveProgress(profileId: string): import('../types/detective.types').DetectiveProgress {
  return getProfileData(profileId).detectives ?? { rounds: {}, discoveries: [] };
}

/** Evidence and the matching gameplay checkpoint share one local atomic snapshot. */
export function saveDetectiveRound(profileId: string, scope: import('../types/detective.types').DiscoveryScope,
  round: import('../types/detective.types').DetectiveRound, evidence?: NewLearningEvent): void {
  const snapshot = getLearningSnapshot();
  if (!snapshot.profiles.some(profile => profile.id === profileId)) return;
  let data = getProfileData(profileId, snapshot);
  if (evidence && !data.events.some(event => event.sessionId === evidence.sessionId && event.contentId === evidence.contentId && event.attemptNumber === evidence.attemptNumber)) {
    const now = effectiveNow(new Date(), data.lastEffectiveNow);
    const event: LearningEvent = { ...evidence, id: createId('event'), occurredAt: now.toISOString(), effectiveDay: now.toISOString().slice(0, 10) };
    const mastery = { ...data.mastery };
    for (const skillId of event.skillIds) mastery[skillId] = applyLearningEvent(mastery[skillId] ?? emptyMastery(skillId), event, mastery, now);
    const countKey = `${event.effectiveDay}:${event.contentId}`;
    // A retry is another attempt, not another presentation of the content.
    data = { ...data, mastery, events: [...data.events, event].slice(-MAX_EVENTS), lastEffectiveNow: now.toISOString(),
      dailyContentCounts: { ...data.dailyContentCounts, [countKey]: (data.dailyContentCounts[countKey] ?? 0) + (event.attemptNumber === 1 ? 1 : 0) } };
  }
  const progress = data.detectives ?? {rounds: {}, discoveries: []};
  writeSnapshot({...snapshot, dataByProfile: {...snapshot.dataByProfile, [profileId]: {...data,
    detectives: {...progress, rounds: {...progress.rounds, [scope]: round}}}}, updatedAt: nowIso()});
}

export function finishDetectiveRound(profileId: string, scope: import('../types/detective.types').DiscoveryScope,
  round: import('../types/detective.types').DetectiveRound): import('../types/detective.types').DiscoveryResult {
  const snapshot = getLearningSnapshot(), data = getProfileData(profileId, snapshot);
  const progress = data.detectives ?? {rounds: {}, discoveries: []};
  const existing = progress.discoveries.find(value => value.id === round.id);
  if (existing) return existing;
  const outcomes = Object.values(round.outcomes);
  const result = {id: round.id, scope, completedAt: nowIso(), independent: outcomes.filter(v=>v==='independent').length,
    assisted: outcomes.filter(v=>v==='assisted').length, demonstrated: outcomes.filter(v=>v==='demonstrated').length};
  const rounds = {...progress.rounds}; delete rounds[scope];
  writeSnapshot({...snapshot, dataByProfile: {...snapshot.dataByProfile, [profileId]: {...data,
    detectives: {rounds, discoveries: [...progress.discoveries, result].slice(-200), last: result}}}, updatedAt: nowIso()});
  return result;
}
export function completeJourneyLevel(profileId: string, levelId: string, gameId: LocalGameSession['gameId']): void {
  const snapshot = getLearningSnapshot(); const data = getProfileData(profileId, snapshot);
  const order: LocalGameSession['gameId'][] = ['letters', 'numbers', 'shapes', 'colors'];
  const nextWorld = order[order.indexOf(gameId) + 1];
  const journey = {
    unlockedWorlds: [...new Set([...data.journey.unlockedWorlds, gameId, ...(nextWorld ? [nextWorld] : [])])],
    completedLevelIds: [...new Set([...data.journey.completedLevelIds, levelId])],
    decorationIds: [...new Set([...data.journey.decorationIds, `decoration-${gameId}`])]
  };
  writeSnapshot({ ...snapshot, dataByProfile: { ...snapshot.dataByProfile, [profileId]: { ...data, journey } }, updatedAt: nowIso() });
}
export function getProfileRecentContent(profileId: string, key: string): string[] { return getProfileData(profileId).recentContent[key] ?? []; }
export function saveProfileRecentContent(profileId: string, key: string, ids: string[]): void {
  const snapshot = getLearningSnapshot(); const data = getProfileData(profileId, snapshot);
  const next = { ...data, recentContent: { ...data.recentContent, [key]: ids.slice(0, 20) } };
  writeSnapshot({ ...snapshot, dataByProfile: { ...snapshot.dataByProfile, [profileId]: next }, updatedAt: nowIso() });
}
export async function deleteAllLearningData(): Promise<void> {
  const store = getLocalDataStore();
  for (const key of [SNAPSHOT_KEY, MIGRATION_MARKER_KEY, OLD_LEARNER_KEY, OLD_SESSIONS_KEY, OLD_RECENT_KEY, LEGACY_PLAYERS_KEY, LEGACY_SESSIONS_KEY]) await store.remove(key);
  if (typeof caches !== 'undefined') for (const key of await caches.keys()) await caches.delete(key);
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
}
