import { nativeLearning, platformRuntime } from './platformRuntime';
import { ReliablePersistence } from './reliablePersistence';

export interface LocalDataStore {
  get(key: string): Promise<string | null>;
  getCached(key: string): string | null;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

const nativeValues = new Map<string, string>();
const webPending = new Map<string, string | null>();
export const localPersistence = new ReliablePersistence();
let initialization: Promise<void> | undefined;
const DELETION_KEY = 'lomdim-bekef.migration.v4';
const DELETION_MARKER = '{"state":"deleting"}';
const LEARNING_KEYS = [
  'lomdim-bekef.learning.v4', 'lomdim-bekef.learner.v1',
  'lomdim-bekef.sessions.v1', 'lomdim-bekef.recent-content.v1',
  'kids-learning-adventure.players', 'kids-learning-adventure.sessions'
];

const webStore: LocalDataStore = {
  get: async key => webStore.getCached(key),
  getCached: key => webPending.has(key) ? webPending.get(key)! : window.localStorage.getItem(key),
  set: (key, value) => {
    webPending.set(key, value);
    return localPersistence.enqueue(() => {
      window.localStorage.setItem(key, value);
      if (webPending.get(key) === value) webPending.delete(key);
    });
  },
  remove: key => {
    webPending.set(key, null);
    return localPersistence.enqueue(() => {
      window.localStorage.removeItem(key);
      if (webPending.get(key) === null) webPending.delete(key);
    });
  },
  clear: () => localPersistence.enqueue(() => {
    // One durable tombstone precedes removal of legacy copies. After a crash,
    // initialization resumes this authorized deletion instead of migrating them.
    window.localStorage.setItem(DELETION_KEY, DELETION_MARKER);
    for (const key of LEARNING_KEYS) { window.localStorage.removeItem(key); webPending.delete(key); }
    window.localStorage.removeItem(DELETION_KEY);
    webPending.delete(DELETION_KEY);
  })
};

const nativeStore: LocalDataStore = {
  get: async (key) => nativeValues.get(key) ?? null,
  getCached: (key) => nativeValues.get(key) ?? null,
  set: (key, value) => {
    nativeValues.set(key, value);
    return localPersistence.enqueue(() => nativeLearning.write({ key, value }));
  },
  remove: (key) => {
    nativeValues.delete(key);
    return localPersistence.enqueue(() => nativeLearning.remove({ key }));
  },
  clear: () => {
    nativeValues.clear();
    return localPersistence.enqueue(() => nativeLearning.clear());
  }
};

async function initialize(): Promise<void> {
  if (!platformRuntime.native) {
    window.localStorage.getItem('lomdim-bekef.learning.v4');
    if (window.localStorage.getItem(DELETION_KEY) === DELETION_MARKER) await webStore.clear();
    return;
  }

  const { values } = await nativeLearning.readAll();
  nativeValues.clear();
  Object.entries(values).forEach(([key, value]) => nativeValues.set(key, value));

  // A development or upgraded WebView may still contain the old keys. Import
  // them exactly once, then remove the duplicate browser copy.
  const legacyKeys = [
    'lomdim-bekef.learning.v4',
    'lomdim-bekef.migration.v4',
    'lomdim-bekef.learner.v1',
    'lomdim-bekef.sessions.v1',
    'lomdim-bekef.recent-content.v1',
    'kids-learning-adventure.players',
    'kids-learning-adventure.sessions'
  ];
  for (const key of legacyKeys) {
    if (nativeValues.has(key)) {
      // The durable native value is authoritative; remove stale browser copies
      // so a later reset cannot migrate deleted profiles back into the app.
      window.localStorage.removeItem(key);
      continue;
    }
    const value = window.localStorage.getItem(key);
    if (value === null) continue;
    await nativeLearning.write({ key, value });
    nativeValues.set(key, value);
    window.localStorage.removeItem(key);
  }
}

export async function initializeLocalDataStore(): Promise<void> {
  initialization ??= initialize().catch(error => { initialization = undefined; throw error; });
  await initialization;
}

export function getLocalDataStore(): LocalDataStore {
  return platformRuntime.native ? nativeStore : webStore;
}
