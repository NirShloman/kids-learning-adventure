// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/platformRuntime', () => ({ nativeLearning: {}, platformRuntime: { native: false, platform: 'web' } }));
beforeEach(() => { vi.resetModules(); vi.restoreAllMocks(); localStorage.clear(); });

describe('interrupted local deletion', () => {
  it('resumes an authorized deletion after restart without migrating legacy profiles', async () => {
    localStorage.setItem('lomdim-bekef.learning.v4', 'current');
    localStorage.setItem('lomdim-bekef.learner.v1', 'legacy');
    localStorage.setItem('unrelated-key', 'keep');
    const original = Storage.prototype.removeItem;
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
      if (key === 'lomdim-bekef.learner.v1') throw new Error('interrupted deletion');
      original.call(this, key);
    });
    const first = await import('../../src/services/localDataStore');
    await expect(first.getLocalDataStore().clear()).rejects.toThrow('interrupted deletion');
    expect(localStorage.getItem('lomdim-bekef.migration.v4')).toBe('{"state":"deleting"}');
    expect(localStorage.getItem('lomdim-bekef.learner.v1')).toBe('legacy');
    remove.mockRestore();
    vi.resetModules();
    const restarted = await import('../../src/services/localDataStore');
    await restarted.initializeLocalDataStore();
    expect(localStorage.getItem('lomdim-bekef.learner.v1')).toBeNull();
    expect(localStorage.getItem('lomdim-bekef.migration.v4')).toBeNull();
    expect(localStorage.getItem('unrelated-key')).toBe('keep');
  });
});
