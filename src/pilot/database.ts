import type { LearningOperation, ProfileRecord, Checkpoint } from './model';

export interface PilotCache {
  records: Record<string, ProfileRecord>; checkpoints: Checkpoint[]; trusted: boolean;
  pin?: { salt: string; hash: string }; offlineVersion?: string; imported?: boolean;
}
export class PilotDatabase {
  private db: Promise<IDBDatabase>;
  constructor(readonly uid: string) {
    this.db = new Promise((resolve, reject) => {
      const request = indexedDB.open(`olamia-pilot-${uid}`, 1);
      request.onupgradeneeded = () => { for (const name of ['profiles', 'outbox', 'meta', 'checkpoints']) request.result.createObjectStore(name); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Close other app tabs'));
    });
  }
  async read<T>(store: string, key: string): Promise<T | undefined> {
    const db = await this.db;
    return new Promise((resolve, reject) => { const request = db.transaction(store).objectStore(store).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  }
  async all<T>(store: string): Promise<T[]> {
    const db = await this.db;
    return new Promise((resolve, reject) => { const request = db.transaction(store).objectStore(store).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  }
  async commit(records: Record<string, ProfileRecord>, operations: LearningOperation[], checkpoints: Checkpoint[] = [], replace = false, metadata: Record<string, unknown> = {}): Promise<void> {
    const db = await this.db;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['profiles', 'outbox', 'checkpoints', 'meta'], 'readwrite');
      for (const [key,value] of Object.entries(metadata)) tx.objectStore('meta').put(value,key);
      if (replace) { tx.objectStore('profiles').clear(); tx.objectStore('checkpoints').clear(); }
      for (const [id, record] of Object.entries(records)) tx.objectStore('profiles').put(record, id);
      for (const operation of operations) {
        tx.objectStore('outbox').put(operation, operation.id);
        for (const cp of operation.checkpoints ?? []) tx.objectStore('checkpoints').put(cp, cp.id);
      }
      for (const cp of checkpoints) tx.objectStore('checkpoints').put(cp, cp.id);
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Storage failed'));
    });
  }
  async acknowledge(id: string): Promise<void> { await this.mutate('outbox', store => store.delete(id)); }
  async purgeChild(profileId: string, tombstone: ProfileRecord): Promise<void> {
    const db = await this.db;
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(['profiles','outbox','checkpoints'],'readwrite');tx.objectStore('profiles').put(tombstone,profileId);
      for (const name of ['outbox','checkpoints']) { const cursor=tx.objectStore(name).openCursor();cursor.onsuccess=()=>{const row=cursor.result;if(!row)return;if(row.value.profileId===profileId)row.delete();row.continue();}; }
      tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
    });
  }
  async setMeta<T>(key: string, value: T): Promise<void> { await this.mutate('meta', store => store.put(value, key)); }
  private async mutate(store: string, run: (store: IDBObjectStore) => void): Promise<void> {
    const db = await this.db;
    return new Promise((resolve, reject) => { const tx = db.transaction(store, 'readwrite'); run(tx.objectStore(store)); tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error); });
  }
  async clear(): Promise<void> {
    const db = await this.db;
    await new Promise<void>((resolve, reject) => { const tx = db.transaction(['profiles', 'outbox', 'meta', 'checkpoints'], 'readwrite'); for (const name of ['profiles', 'outbox', 'meta', 'checkpoints']) tx.objectStore(name).clear(); tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error); });
    db.close();
  }
}
