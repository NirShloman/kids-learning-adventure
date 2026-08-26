// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createProfile, deleteProfile, getLearningSnapshot, getProfileData, recordLearningEvent, selectProfile } from '../../src/services/learningStoreService';

beforeEach(() => window.localStorage.clear());

describe('v4 local learning snapshot', () => {
  it('migrates a v3 learner and sessions without losing the old source', () => {
    localStorage.setItem('lomdim-bekef.learner.v1', JSON.stringify({ schemaVersion: 3, name: 'נועה', age: 5, difficulty: 'hard', narrationEnabled: false, soundEffectsEnabled: false, musicEnabled: true }));
    localStorage.setItem('lomdim-bekef.sessions.v1', JSON.stringify([{ id: 'old-session', gameId: 'letters', score: 4, total: 5, completedAt: '2026-01-01T00:00:00.000Z' }]));
    const snapshot = getLearningSnapshot();
    expect(snapshot.schemaVersion).toBe(4);
    expect(snapshot.profiles[0]).toMatchObject({ name: 'נועה', age: 5, manualDifficulty: 'hard', narrationEnabled: false });
    expect(getProfileData(snapshot.profiles[0].id, snapshot).sessions[0]).toMatchObject({ id: 'old-session', correct: 4, total: 5 });
    expect(localStorage.getItem('lomdim-bekef.learner.v1')).not.toBeNull();
  });

  it('isolates progress and deletion between profiles', () => {
    const first = createProfile({ name: 'אורי' }); const second = createProfile({ name: 'נועה' });
    selectProfile(first.id);
    recordLearningEvent({ profileId: first.id, sessionId: 's1', contentId: 'letters-001', skillIds: ['hebrew.letter-recognition'], gameId: 'letters', evidenceForm: 'visual-choice', correct: true, attemptNumber: 1, hintUsed: false, responseMs: 1000, monotonicMs: 1 });
    expect(getProfileData(first.id).events).toHaveLength(1);
    expect(getProfileData(second.id).events).toHaveLength(0);
    deleteProfile(first.id);
    expect(getLearningSnapshot().profiles.map((profile) => profile.id)).toEqual([second.id]);
    expect(getProfileData(second.id).events).toHaveLength(0);
  });
});
