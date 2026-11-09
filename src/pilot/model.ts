import type { LearnerProfile, LearningSnapshotV4, ProfileLearningData, LearningEvent, LearningSessionSummary, ExperienceGameId } from '../types';
import type { DiscoveryScope } from '../types/detective.types';
import { applyLearningEvent, emptyMastery } from '../learning/masteryEngine';

export interface KindergartenAccount { id: string; name: string; uid: string }
export type ChildProfile = LearnerProfile;
export interface SyncStatus { pending: number; syncing: boolean; error: boolean; lastSyncedAt: string | null }
export interface Checkpoint { id: string; profileId: string; sessionId: string; scope: string; value: unknown; updatedAt: string }
export interface ProfileRecord { profile: ChildProfile; data: ProfileLearningData; revision: number; deleted?: boolean; migrationSession?: string }
export interface LearningOperation {
  id: string; kindergartenId: string; profileId: string; sessionId: string; createdAt: string;
  kind: 'create' | 'update' | 'delete';
  profile?: Partial<ChildProfile>;
  events?: LearningEvent[];
  sessions?: LearningSessionSummary[];
  progress?: Partial<ProfileLearningData>;
  checkpoints?: Checkpoint[];
  baseline?: Pick<ProfileLearningData, 'mastery' | 'dailyContentCounts'>;
  historical?: boolean;
}
export const emptySnapshot = (): LearningSnapshotV4 => ({ schemaVersion: 4, migrationState: 'complete', activeProfileId: null, profiles: [], dataByProfile: {}, updatedAt: new Date().toISOString() });
export const emptyData = (): ProfileLearningData => ({ mastery: {}, events: [], sessions: [], recentContent: {}, activePlan: null, journey: { unlockedWorlds: ['letters'], completedLevelIds: [], decorationIds: [] }, lastEffectiveNow: new Date().toISOString(), dailyContentCounts: {} });
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
type JsonMap = Record<string, unknown>;
// Patch objects by leaf; aggregate arrays are unions, never replacements from a stale device.
export function mergeProgress(a: unknown, b: unknown): unknown {
  if (Array.isArray(b)) {
    const previous = Array.isArray(a) ? a : [];
    const rows = new Map(previous.map(v => [typeof v === 'object' && v ? JSON.stringify(v.id ?? v) : JSON.stringify(v), v]));
    b.forEach(v => rows.set(typeof v === 'object' && v ? JSON.stringify(v.id ?? v) : JSON.stringify(v), v));
    return [...rows.values()];
  }
  if (b && typeof b === 'object') {
    const result: JsonMap = { ...(a && typeof a === 'object' ? a : {}) };
    for (const [key, value] of Object.entries(b)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Invalid key');
      result[key] = mergeProgress(result[key], value);
    }
    return result;
  }
  return b;
}
function changedLeaves(before: unknown, after: unknown): unknown {
  if (same(before, after)) return undefined;
  if (after && typeof after === 'object' && !Array.isArray(after)) {
    const result: JsonMap = {};
    for (const [key, value] of Object.entries(after)) {
      const delta = changedLeaves((before as JsonMap | undefined)?.[key], value);
      if (delta !== undefined) result[key] = delta;
    }
    return Object.keys(result).length ? result : undefined;
  }
  return after;
}
export function operationsBetween(before: LearningSnapshotV4, after: LearningSnapshotV4, kindergartenId: string, sessionId: string): LearningOperation[] {
  const operations: LearningOperation[] = [];
  for (const profile of after.profiles) {
    const previous = before.profiles.find(p => p.id === profile.id);
    const oldData = before.dataByProfile[profile.id]; const data = after.dataByProfile[profile.id];
    if (previous === profile && oldData === data) continue;
    if (same(previous, profile) && same(oldData, data)) continue;
    const oldEvents = new Set(oldData?.events.map(e => e.id)); const oldSessions = new Set(oldData?.sessions.map(s => s.id));
    const { mastery: _m, events: _e, sessions: _s, dailyContentCounts: _c, activePlan, detectives, adventures, recentContent, ...rest } = data;
    const progress: Partial<ProfileLearningData> = changedLeaves(oldData, rest) as Partial<ProfileLearningData> ?? {};
    if (!same(oldData?.recentContent, recentContent)) progress.recentContent = recentContent;
    if (detectives) progress.detectives = { discoveries: detectives.discoveries.filter(d => !oldData?.detectives?.discoveries.some(v => v.id === d.id)), rounds: {}, ...(detectives.last ? { last: detectives.last } : {}) };
    if (adventures) progress.adventures = Object.fromEntries(Object.entries(adventures).map(([key, value]) => { const { checkpoint: _cp, ...earned } = value!; return [key, earned]; }));
    const checkpoints: Checkpoint[] = [];
    const checkpoint = (scope: string, value: unknown) => checkpoints.push({ id: `${sessionId}:${scope}`, profileId: profile.id, sessionId, scope, value: value ?? null, updatedAt: after.updatedAt });
    if (!same(oldData?.activePlan, activePlan)) checkpoint('adaptive', activePlan);
    for (const scope of new Set([...Object.keys(oldData?.detectives?.rounds ?? {}), ...Object.keys(detectives?.rounds ?? {})])) {
      if (!same(oldData?.detectives?.rounds[scope as DiscoveryScope], detectives?.rounds[scope as DiscoveryScope])) checkpoint(`detective:${scope}`, detectives?.rounds[scope as DiscoveryScope]);
    }
    for (const [game, value] of Object.entries(adventures ?? {})) if (!same(oldData?.adventures?.[game as ExperienceGameId]?.checkpoint, value?.checkpoint)) checkpoint(`adventure:${game}`, value?.checkpoint);
    operations.push({ id: crypto.randomUUID(), kindergartenId, profileId: profile.id, sessionId, createdAt: after.updatedAt, kind: previous ? 'update' : 'create', profile: (previous ? changedLeaves(previous, profile) : profile) as Partial<ChildProfile> | undefined,
      events: data.events.filter(e => !oldEvents.has(e.id)), sessions: data.sessions.filter(s => !oldSessions.has(s.id)), progress, checkpoints });
  }
  for (const profile of before.profiles) if (!after.profiles.some(p => p.id === profile.id)) operations.push({ id: crypto.randomUUID(), kindergartenId, profileId: profile.id, sessionId, createdAt: after.updatedAt, kind: 'delete' });
  // Strip undefined properties before persistence or transport.
  return JSON.parse(JSON.stringify(operations));
}
export function applyOperation(current: ProfileRecord | null, operation: LearningOperation): ProfileRecord {
  if (current?.deleted) return current;
  if (operation.kind === 'delete') {
    if (!current) throw new Error('Profile missing');
    return { ...current, deleted: true, revision: current.revision + 1 };
  }
  if (!current && operation.kind !== 'create') throw new Error('Profile missing');
  if (current && operation.kind === 'create') throw new Error('Profile already exists');
  const profile = mergeProgress(current?.profile ?? {}, operation.profile ?? {}) as ChildProfile;
  profile.id = operation.profileId;
  let data = structuredClone(current?.data ?? emptyData());
  if (operation.baseline) {
    if (current || operation.kind !== 'create') throw new Error('Baseline requires a new profile');
    data.mastery = structuredClone(operation.baseline.mastery); data.dailyContentCounts = { ...operation.baseline.dailyContentCounts };
  }
  if (operation.historical && current?.migrationSession !== operation.sessionId) throw new Error('Wrong migration session');
  data = mergeProgress(data, operation.progress ?? {}) as ProfileLearningData;
  // Recent-content lists are preferences, not earned collections.
  if (operation.progress?.recentContent) data.recentContent = { ...data.recentContent, ...operation.progress.recentContent };
  const known = new Set(data.events.map(e => e.id));
  for (const event of operation.events ?? []) if (!known.has(event.id)) {
    if (!operation.historical) for (const skillId of event.skillIds) data.mastery[skillId] = applyLearningEvent(data.mastery[skillId] ?? emptyMastery(skillId), event, data.mastery);
    data.events.push(event); known.add(event.id);
    const key = `${event.effectiveDay}:${event.contentId}`;
    if (!operation.historical && event.attemptNumber === 1) data.dailyContentCounts[key] = (data.dailyContentCounts[key] ?? 0) + 1;
  }
  data.events = data.events.slice(-5000);
  const summaries = new Map(data.sessions.map(s => [s.id, s]));
  operation.sessions?.forEach(s => summaries.set(s.id, s));
  data.sessions = [...summaries.values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 500);
  return { profile, data, revision: (current?.revision ?? 0) + 1, ...(operation.baseline ? { migrationSession: operation.sessionId } : current?.migrationSession ? { migrationSession: current.migrationSession } : {}) };
}

export function restoreCheckpoints(data: ProfileLearningData, checkpoints: Checkpoint[]): ProfileLearningData {
  const result = structuredClone(data);
  for (const cp of checkpoints) {
    if (cp.scope === 'adaptive') result.activePlan = cp.value as ProfileLearningData['activePlan'];
    if (cp.scope.startsWith('detective:')) { result.detectives ??= { rounds: {}, discoveries: [] }; const key = cp.scope.slice(10) as keyof typeof result.detectives.rounds;
      if (cp.value) result.detectives.rounds[key] = cp.value as NonNullable<typeof result.detectives.rounds[typeof key]>; else delete result.detectives.rounds[key]; }
    if (cp.scope.startsWith('adventure:')) { const key = cp.scope.slice(10) as keyof NonNullable<typeof result.adventures>; result.adventures ??= {}; result.adventures[key] ??= { version: 1, completed: [], recent: [], rewards: [] };
      if (cp.value) result.adventures[key]!.checkpoint = cp.value as NonNullable<typeof result.adventures[typeof key]>['checkpoint']; else delete result.adventures[key]!.checkpoint; }
  }
  return result;
}
