import { nativeLearning, platformRuntime } from './platformRuntime';

export interface LocalDataStore {
  get(key: string): Promise<string | null>;
  getCached(key: string): string | null;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

const nativeValues = new Map<string, string>();
let initialized = false;

const webStore: LocalDataStore = {
  get: async (key) => window.localStorage.getItem(key),
  getCached: (key) => window.localStorage.getItem(key),
  set: async (key, value) => window.localStorage.setItem(key, value),
  remove: async (key) => window.localStorage.removeItem(key),
  clear: async () => window.localStorage.clear()
};

let nativeMutationQueue: Promise<void> = Promise.resolve();

function enqueueNativeMutation(mutation: () => Promise<unknown>): Promise<void> {
  nativeMutationQueue = nativeMutationQueue
    .catch(() => undefined)
    .then(async () => {
      await mutation();
    });
  return nativeMutationQueue;
}

const nativeStore: LocalDataStore = {
  get: async (key) => nativeValues.get(key) ?? null,
  getCached: (key) => nativeValues.get(key) ?? null,
  set: (key, value) => {
    nativeValues.set(key, value);
    return enqueueNativeMutation(() => nativeLearning.write({ key, value }));
  },
  remove: (key) => {
    nativeValues.delete(key);
    return enqueueNativeMutation(() => nativeLearning.remove({ key }));
  },
  clear: () => {
    nativeValues.clear();
    return enqueueNativeMutation(() => nativeLearning.clear());
  }
};

export async function initializeLocalDataStore(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!platformRuntime.native) return;

  const { values } = await nativeLearning.readAll();
  Object.entries(values).forEach(([key, value]) => nativeValues.set(key, value));

  // A development or upgraded WebView may still contain the old keys. Import
  // them exactly once, then remove the duplicate browser copy.
  const legacyKeys = [
    'lomdim-bekef.learner.v1',
    'lomdim-bekef.sessions.v1',
    'lomdim-bekef.recent-content.v1',
    'kids-learning-adventure.players',
    'kids-learning-adventure.sessions'
  ];
  for (const key of legacyKeys) {
    if (nativeValues.has(key)) continue;
    const value = window.localStorage.getItem(key);
    if (value === null) continue;
    nativeValues.set(key, value);
    await nativeLearning.write({ key, value });
    window.localStorage.removeItem(key);
  }
}

export function getLocalDataStore(): LocalDataStore {
  return platformRuntime.native ? nativeStore : webStore;
}
