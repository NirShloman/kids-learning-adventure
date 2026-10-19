import { describe, expect, it } from 'vitest';
import { worldProgress } from '../../src/data/worldCollection';
import type { ProfileLearningData } from '../../src/types';

function data(): ProfileLearningData {
  return { mastery: {}, events: [], sessions: [], recentContent: {}, activePlan: null, journey: { unlockedWorlds: [], completedLevelIds: [], decorationIds: [] }, lastEffectiveNow: '', dailyContentCounts: {} };
}
describe('world keepsakes', () => {
  it('credits old rewards alongside new creations without counting the same mission twice', () => {
    const saved = data();
    saved.adventures = { letters: { version: 1, completed: ['old', 'new'], rewards: ['old', 'new'], recent: [], creations: [{ id: 'a', missionId: 'new', seed: 1, completedAt: '' }, { id: 'b', missionId: 'new', seed: 2, completedAt: '' }] } };
    expect(worldProgress(saved, 'letters')).toMatchObject({ count: 3, earned: 2, next: 6, remaining: 3 });
    expect(worldProgress(saved, 'numbers').earned).toBe(0);
  });
  it('does not double award duplicate discoveries and accepts assisted rounds', () => {
    const saved = data();
    const discovery = { id: 'd1', scope: 'memory' as const, completedAt: '', independent: 0, assisted: 6, demonstrated: 2 };
    saved.detectives = { rounds: {}, discoveries: [discovery, discovery] };
    expect(worldProgress(saved, 'memory')).toMatchObject({ count: 1, earned: 1, remaining: 2 });
  });
  it('keeps earned rewards after bounded history is trimmed and keeps profiles separate', () => {
    const saved = data();
    saved.journey.decorationIds = ['keepsake:letters:1', 'keepsake:letters:3', 'keepsake:letters:6'];
    expect(worldProgress(saved, 'letters')).toMatchObject({ earned: 3, next: undefined, remaining: 0 });
    expect(worldProgress(data(), 'letters').earned).toBe(0);
    expect(worldProgress(saved, 'shapes').earned).toBe(0);
  });
  it('handles an empty collection and preserves mixed discoveries separately', () => {
    const saved = data();
    saved.detectives = { rounds: {}, discoveries: [{ id: 'mixed', scope: 'mixed', completedAt: '', independent: 6, assisted: 0, demonstrated: 0 }] };
    expect(worldProgress(saved, 'mixed').count).toBe(1);
    expect(worldProgress(saved, 'letters')).toMatchObject({ earned: 0, next: 1, remaining: 1 });
  });
});
