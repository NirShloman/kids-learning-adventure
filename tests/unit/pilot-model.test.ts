// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createDefaultProfile } from '../../src/services/learningStoreService';
import { applyOperation, emptyData, emptySnapshot, operationsBetween, restoreCheckpoints, type LearningOperation, type ProfileRecord } from '../../src/pilot/model';
import { operationSchema } from '../../src/pilot/validation';
const profile = createDefaultProfile({ id: 'child-1', name: 'אורי' });
const create = (): LearningOperation => ({ id: crypto.randomUUID(), kindergartenId: 'garden-1', profileId: profile.id, sessionId: 'device-a', createdAt: new Date().toISOString(), kind: 'create', profile });
const event = (id: string) => ({ id, profileId: profile.id, sessionId: 'game-1', contentId: 'letters-1', skillIds: ['hebrew.letter-recognition' as const], gameId: 'letters' as const, evidenceForm: 'visual-choice' as const, correct: true, attemptNumber: 1, hintUsed: false, responseMs: 1000, monotonicMs: 1000, occurredAt: new Date().toISOString(), effectiveDay: '2026-10-19' });
const update = (values: Partial<LearningOperation>): LearningOperation => ({ ...create(), kind: 'update', profile: undefined, ...values });
describe('pilot learning operations', () => {
  it('merges simultaneous achievements and replays repeated events only once', () => {
    let row = applyOperation(null, create());
    const a = update({ events: [event('e1')], progress: { journey: { unlockedWorlds: ['letters'], completedLevelIds: ['a'], decorationIds: ['a'] } } });
    const b = update({ events: [event('e2')], progress: { journey: { unlockedWorlds: ['numbers'], completedLevelIds: ['b'], decorationIds: ['b'] } } });
    row = applyOperation(applyOperation(applyOperation(row, a), b), a);
    expect(row.data.events).toHaveLength(2);
    expect(row.data.mastery['hebrew.letter-recognition']?.evidenceCount).toBe(2);
    expect(row.data.journey.completedLevelIds).toEqual(['a','b']);
  });
  it('patches independent preference leaves without overwriting the other device', () => {
    let row = applyOperation(null, create());
    row = applyOperation(row, update({ profile: { musicVolume: 12, accessibility: { highContrast: true } as typeof profile.accessibility } }));
    row = applyOperation(row, update({ profile: { narrationVolume: 33, accessibility: { slowNarration: true } as typeof profile.accessibility } }));
    expect(row.profile).toMatchObject({ musicVolume: 12, narrationVolume: 33, accessibility: { highContrast: true, slowNarration: true } });
  });
  it('does not resurrect deleted children from another offline device', () => {
    const deleted = applyOperation(applyOperation(null, create()), update({ kind: 'delete' }));
    expect(applyOperation(deleted, create()).deleted).toBe(true);
    expect(applyOperation(deleted, update({ events: [event('late')] })).data.events).toHaveLength(0);
  });
  it('produces leaf preference patches and separate per-session checkpoints', () => {
    const before = { ...emptySnapshot(), profiles: [profile], dataByProfile: { [profile.id]: emptyData() } };
    const after = structuredClone(before); after.profiles[0].accessibility.highContrast = true;
    after.dataByProfile[profile.id].activePlan = { id: 'plan', profileId: profile.id, createdAt: new Date().toISOString(), tasks: [], estimatedMinutes: 5, completedAt: null };
    const operations = operationsBetween(before, after, 'garden-1', 'device-a');
    expect(operations[0].profile).toEqual({ accessibility: { highContrast: true } });
    expect(operations[0].checkpoints?.[0].id).toBe('device-a:adaptive');
    expect(operations[0].progress).not.toHaveProperty('activePlan');
    expect(operationSchema.safeParse(operations[0]).success).toBe(true);
    const a = restoreCheckpoints(emptyData(), operations[0].checkpoints!);
    expect(a.activePlan?.id).toBe('plan');
    expect(restoreCheckpoints(emptyData(), []).activePlan).toBeNull();
  });
  it('stores completed discoveries independently from current rounds', () => {
    const before = { ...emptySnapshot(), profiles: [profile], dataByProfile: { [profile.id]: emptyData() } };
    const after = structuredClone(before);
    after.dataByProfile[profile.id].detectives = { rounds: {}, discoveries: [{ id: 'discovery-1', scope: 'letters', completedAt: new Date().toISOString(), independent: 1, assisted: 0, demonstrated: 0 }] };
    const [op] = operationsBetween(before, after, 'garden-1', 'device-a');
    const row = applyOperation({ profile, data: emptyData(), revision: 1 }, op);
    expect(row.data.detectives?.discoveries).toHaveLength(1);
  });
  it('validates ownership, immutable fields and rejects malformed/prototype payloads', () => {
    expect(operationSchema.safeParse(create()).success).toBe(true);
    expect(operationSchema.safeParse(update({ events: [{ ...event('e1'), profileId: 'other' }] })).success).toBe(false);
    expect(operationSchema.safeParse(update({ profile: { id: 'child-1' } })).success).toBe(false);
    expect(operationSchema.safeParse(update({ progress: { adventures: JSON.parse('{"__proto__":{"polluted":true}}') } })).success).toBe(false);
    expect(operationSchema.safeParse(update({ profile: { age: 9 as 4 } })).success).toBe(false);
  });
  it('keeps 50 profiles isolated across repeated sessions', () => {
    const records: Record<string, ProfileRecord> = {};
    for (let n=0;n<50;n++) {
      const id = `child-${n}`; records[id] = applyOperation(null, { ...create(), profileId:id, profile: { ...profile, id, musicVolume:n } });
      for (let j=0;j<50;j++) records[id] = applyOperation(records[id], { ...update({}), profileId:id, events:[{ ...event(`event-${n}-${j}`), profileId:id }] });
    }
    expect(Object.keys(records)).toHaveLength(50);
    for (let n=0;n<50;n++) { expect(records[`child-${n}`].data.events).toHaveLength(50); expect(records[`child-${n}`].profile.musicVolume).toBe(n); }
  });
});
