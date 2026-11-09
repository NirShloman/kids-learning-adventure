import type { LearningSnapshotV4 } from '../types';
import { configureLearningRepository } from '../services/learningStoreService';
import { localPersistence } from '../services/localDataStore';
import { PilotDatabase } from './database';
import { applyOperation, emptySnapshot, operationsBetween, restoreCheckpoints, type Checkpoint, type KindergartenAccount, type LearningOperation, type ProfileRecord, type SyncStatus } from './model';

export interface PilotTransport {
  submit(operation: LearningOperation): Promise<{ deleted: boolean }>;
  pull(kindergartenId: string): Promise<{ records: Record<string, ProfileRecord>; checkpoints: Checkpoint[] }>;
}
export class PilotRepository {
  readonly database: PilotDatabase;
  private snapshot = emptySnapshot();
  private records: Record<string, ProfileRecord> = {};
  private checkpoints: Checkpoint[] = [];
  private sessionId: string = crypto.randomUUID();
  private lastQueuedAt = 0;
  private listeners = new Set<() => void>();
  private status: SyncStatus = { pending: 0, syncing: false, error: false, lastSyncedAt: null };
  private syncing?: Promise<void>;
  private accepting = true;
  private releaseTabLock?: () => void;
  private detachRepository?: () => void;
  constructor(readonly account: KindergartenAccount, private transport: PilotTransport) { this.database = new PilotDatabase(account.uid); }
  getStatus = () => this.status;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private notify(patch: Partial<SyncStatus>) { this.status = { ...this.status, ...patch }; this.listeners.forEach(l => l()); }
  async initialize() {
    this.accepting = true;
    if (navigator.locks && !this.releaseTabLock) await new Promise<void>((resolve,reject)=>{
      void navigator.locks.request(`olamia-pilot-${this.account.uid}`,{ifAvailable:true},lock=>{
        if (!lock) { reject(new Error('הגן כבר פתוח בלשונית אחרת במחשב. סגרו אותה ונסו שוב.')); return; }
        return new Promise<void>(release=>{this.releaseTabLock=release;resolve();});
      }).catch(reject);
    });
    for (const row of await this.database.all<ProfileRecord>('profiles')) this.records[row.profile.id] = row;
    this.checkpoints = await this.database.all<Checkpoint>('checkpoints');
    this.rebuild();
    const pending = await this.database.all<LearningOperation>('outbox');
    this.lastQueuedAt = Math.max(0, ...pending.map(op => Date.parse(op.createdAt)));
    this.notify({ pending: pending.length });
    this.detachRepository = configureLearningRepository({ read: () => this.snapshot, write: snapshot => this.write(snapshot), clear: async () => { throw new Error('יש למחוק ילדים מאזור הצוות, בחיבור לרשת.'); } });
  }
  private rebuild() {
    const active = this.snapshot.activeProfileId;
    this.snapshot = emptySnapshot();
    for (const record of Object.values(this.records)) if (!record.deleted) {
      this.snapshot.profiles.push(record.profile);
      this.snapshot.dataByProfile[record.profile.id] = record.data;
    }
    this.snapshot.profiles.sort((a,b)=>a.name.localeCompare(b.name,'he',{numeric:true})||a.id.localeCompare(b.id));
    this.snapshot.activeProfileId = this.snapshot.profiles.some(p => p.id === active) ? active : null;
  }
  read = () => this.snapshot;
  beginSession(profileId: string, checkpointSessionId?: string) {
    if (!this.records[profileId] || this.records[profileId].deleted) throw new Error('Profile missing');
    this.sessionId = checkpointSessionId ?? crypto.randomUUID();
    this.snapshot = { ...this.snapshot, activeProfileId: profileId, dataByProfile: { ...this.snapshot.dataByProfile, [profileId]: restoreCheckpoints({ ...this.records[profileId].data, activePlan: null, detectives: { ...this.records[profileId].data.detectives, discoveries: this.records[profileId].data.detectives?.discoveries ?? [], rounds: {} } }, this.checkpoints.filter(cp => cp.profileId === profileId && cp.sessionId === this.sessionId)) } };
  }
  sessionsFor(profileId: string) {
    return [...new Set(this.checkpoints.filter(cp => {
      if (cp.profileId !== profileId || !cp.value) return false;
      const value = cp.value as {completedAt?:string|null;index?:number;steps?:unknown[];missionIndex?:number;missionIds?:string[]};
      if (cp.scope === 'adaptive') return value.completedAt === null;
      if (cp.scope.startsWith('detective:')) return (value.index ?? 0) < (value.steps?.length ?? 0);
      return (value.missionIndex ?? 0) < (value.missionIds?.length ?? 0);
    }).map(cp => cp.sessionId))];
  }
  sessionLabel(profileId:string,sessionId:string) {
    const rows=this.checkpoints.filter(cp=>cp.profileId===profileId&&cp.sessionId===sessionId&&cp.value);
    const latest=rows.map(cp=>cp.updatedAt).sort().slice(-1)[0];
    const labels: Record<string,string>={letters:'אותיות',numbers:'מספרים',shapes:'צורות',colors:'צבעים',matching:'התאמה',memory:'זיכרון',patterns:'רצפים',sorting:'מיון',mixed:'משולב'};
    return `${[...new Set(rows.map(cp=>labels[cp.scope.split(':')[1]]??'תרגול מותאם'))].join(', ')} · ${latest?new Date(latest).toLocaleString('he-IL'):''}`;
  }
  private write(next: LearningSnapshotV4) {
    if (!this.accepting) throw new Error('Account closed');
    const operations = operationsBetween(this.snapshot, next, this.account.id, this.sessionId);
    for (const op of operations) { this.lastQueuedAt = Math.max(Date.now(), this.lastQueuedAt + 1); op.createdAt = new Date(this.lastQueuedAt).toISOString(); }
    if (operations.some(op => op.kind === 'delete') && !navigator.onLine) throw new Error('מחיקה דורשת חיבור לרשת.');
    const changed: Record<string, ProfileRecord> = {};
    for (const op of operations) {
      changed[op.profileId] = applyOperation(this.records[op.profileId] ?? null, op);
      this.records[op.profileId] = changed[op.profileId];
      for (const cp of op.checkpoints ?? []) { this.checkpoints = this.checkpoints.filter(row => row.id !== cp.id); this.checkpoints.push(cp); }
    }
    this.snapshot = next;
    if (!operations.length) return;
    this.notify({ pending: this.status.pending + operations.length });
    void localPersistence.enqueue(async () => { await this.database.commit(changed, operations); }).then(() => { if (navigator.onLine) void this.sync(); }).catch(()=>{ /* PersistenceGuard retains the transaction and exposes retry. */ });
  }
  async importSnapshot(source: LearningSnapshotV4) {
    if (!navigator.onLine) throw new Error('העברה דורשת חיבור לרשת.');
    if (await this.database.read('meta', 'imported')) throw new Error('הפרופילים כבר הועברו.');
    if (!await this.database.read('meta', 'importQueued')) {
      const operations: LearningOperation[] = []; const changed: Record<string, ProfileRecord> = {};
      const migrationId = crypto.randomUUID();
      for (const profile of source.profiles) {
        if (this.records[profile.id]) throw new Error('קיים בגן פרופיל עם אותו מזהה. יש לבדוק את ההעברה לפני ניסיון נוסף.');
        const data = source.dataByProfile[profile.id];
        const [create] = operationsBetween(emptySnapshot(), { ...emptySnapshot(), profiles: [profile], dataByProfile: { [profile.id]: { ...data, events: [], sessions: [] } } }, this.account.id, migrationId);
        create.baseline = { mastery: data.mastery, dailyContentCounts: data.dailyContentCounts }; operations.push(create);
        for (let i=0;i<data.events.length;i+=100) operations.push({ id:crypto.randomUUID(),kindergartenId:this.account.id,profileId:profile.id,sessionId:migrationId,createdAt:new Date().toISOString(),kind:'update',historical:true,events:data.events.slice(i,i+100) });
        for (let i=0;i<data.sessions.length;i+=100) operations.push({ id:crypto.randomUUID(),kindergartenId:this.account.id,profileId:profile.id,sessionId:migrationId,createdAt:new Date().toISOString(),kind:'update',historical:true,sessions:data.sessions.slice(i,i+100) });
      }
      for (const op of operations) { this.lastQueuedAt=Math.max(Date.now(),this.lastQueuedAt+1);op.createdAt=new Date(this.lastQueuedAt).toISOString();changed[op.profileId]=applyOperation(changed[op.profileId]??null,op); }
      await localPersistence.enqueue(()=>this.database.commit(changed,operations,[],false,{importQueued:true}));
      Object.assign(this.records,changed); this.checkpoints.push(...operations.flatMap(op=>op.checkpoints??[])); this.rebuild();
      this.notify({pending:this.status.pending+operations.length});
    }
    await localPersistence.flush(); await this.sync();
    if (this.status.pending) throw new Error('ההעברה נשמרה במחשב וממתינה לגיבוי.');
    await this.database.setMeta('imported', true);
    await this.refresh();
  }
  sync(probe = false): Promise<void> {
    if ((!navigator.onLine && !probe) || !this.accepting || (probe && !this.status.pending)) return Promise.resolve();
    if (this.syncing) return this.syncing;
    this.syncing = this.drain(probe).finally(() => { this.syncing = undefined; });
    return this.syncing;
  }
  private async drain(probe: boolean) {
    if ((!navigator.onLine && !probe) || !this.accepting) return;
    this.notify({ syncing: true, error: false });
    try {
      await localPersistence.flush();
      // Never replace live gameplay with remote state. Pull only at a staff boundary.
      for (;;) {
        const operations = await this.database.all<LearningOperation>('outbox');
        operations.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
        if (!operations.length) break;
        for (const op of operations) {
          const result = await this.transport.submit(op);
          window.dispatchEvent(new CustomEvent('pilot:network-confirmed'));
          if (result.deleted && this.records[op.profileId]) {
            this.records[op.profileId] = { profile: { id: op.profileId } as ProfileRecord['profile'], data: {} as ProfileRecord['data'], deleted: true, revision: this.records[op.profileId].revision + 1 };
            await this.database.purgeChild(op.profileId, this.records[op.profileId]);
            this.checkpoints = this.checkpoints.filter(cp=>cp.profileId!==op.profileId);
            if (this.snapshot.activeProfileId === op.profileId) window.dispatchEvent(new CustomEvent('pilot:profile-deleted'));
            this.rebuild();
          }
          await this.database.acknowledge(op.id);
          this.notify({ pending: (await this.database.all('outbox')).length });
        }
      }
      this.notify({ lastSyncedAt: new Date().toISOString() });
    } catch { this.notify({ error: true }); }
    finally { this.notify({ syncing: false }); }
  }
  async refresh() {
    await this.sync();
    if (!navigator.onLine || this.status.pending || this.status.error) return;
    const remote = await this.transport.pull(this.account.id);
    // Called with gameplay unmounted and controls disabled.
    await localPersistence.flush();
    if (this.status.pending) return;
    this.records = remote.records; this.checkpoints = remote.checkpoints;
    await this.database.commit(remote.records, [], remote.checkpoints, true);
    this.rebuild();
  }
  async close() {
    await localPersistence.flush(); await this.sync();
    if (this.status.pending || this.status.error) throw new Error('יש פעולות שטרם גובו. התחברו לרשת ונסו שוב.');
    await this.database.clear(); this.accepting = false; this.detachRepository?.(); this.releaseTabLock?.(); this.releaseTabLock=undefined;
  }
  detach() { this.accepting = false; this.detachRepository?.(); this.releaseTabLock?.(); this.releaseTabLock=undefined; }
}
