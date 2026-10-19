// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ readAll: vi.fn(), write: vi.fn(), remove: vi.fn(), clear: vi.fn() }));
vi.mock('../../src/services/platformRuntime', () => ({
  nativeLearning: native, platformRuntime: { native: true, platform: 'android' }
}));

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  localStorage.clear();
  native.readAll.mockResolvedValue({ values: {} });
  native.write.mockResolvedValue(undefined);
});

describe('native storage initialization and migration', () => {
  it('can retry failed initialization rather than starting with an empty store', async () => {
    native.readAll.mockRejectedValueOnce(new Error('corrupt file')).mockResolvedValueOnce({ values: { checkpoint: 'saved' } });
    const store = await import('../../src/services/localDataStore');
    await expect(store.initializeLocalDataStore()).rejects.toThrow('corrupt file');
    await store.initializeLocalDataStore();
    expect(store.getLocalDataStore().getCached('checkpoint')).toBe('saved');
    expect(native.readAll).toHaveBeenCalledTimes(2);
  });
  it('retains the source of a failed migration until the native write succeeds', async () => {
    localStorage.setItem('lomdim-bekef.learning.v4', 'source profile');
    native.write.mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined);
    const store = await import('../../src/services/localDataStore');
    await expect(store.initializeLocalDataStore()).rejects.toThrow('disk full');
    expect(localStorage.getItem('lomdim-bekef.learning.v4')).toBe('source profile');
    await store.initializeLocalDataStore();
    expect(store.getLocalDataStore().getCached('lomdim-bekef.learning.v4')).toBe('source profile');
    expect(localStorage.getItem('lomdim-bekef.learning.v4')).toBeNull();
  });
  it('never replaces a native snapshot with an older web copy', async () => {
    localStorage.setItem('lomdim-bekef.learning.v4', 'old web profile');
    native.readAll.mockResolvedValue({ values: { 'lomdim-bekef.learning.v4': 'native progress' } });
    const store = await import('../../src/services/localDataStore');
    await store.initializeLocalDataStore();
    expect(store.getLocalDataStore().getCached('lomdim-bekef.learning.v4')).toBe('native progress');
    expect(native.write).not.toHaveBeenCalled();
    expect(localStorage.getItem('lomdim-bekef.learning.v4')).toBeNull();
  });
  it('keeps a failed write visible and retries it before a newer checkpoint', async () => {
    const store = await import('../../src/services/localDataStore');
    await store.initializeLocalDataStore();
    native.write.mockRejectedValueOnce(new Error('disk full')).mockResolvedValue(undefined);
    const first = store.getLocalDataStore().set('checkpoint', 'one');
    const second = store.getLocalDataStore().set('checkpoint', 'two');
    await expect(first).rejects.toThrow('disk full');
    expect(store.getLocalDataStore().getCached('checkpoint')).toBe('two');
    expect(native.write).toHaveBeenCalledTimes(1);
    await store.localPersistence.retry();
    await second;
    expect(native.write.mock.calls.map(([value]) => value.value)).toEqual(['one', 'one', 'two']);
  });
});
