// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createProfile, configureLearningRepository, getLearningSnapshot, recordLearningEvent, updateProfile } from '../../src/services/learningStoreService';
import { localPersistence } from '../../src/services/localDataStore';
import { PilotRepository, type PilotTransport } from '../../src/pilot/repository';
import { applyOperation, type LearningOperation, type ProfileRecord, type Checkpoint } from '../../src/pilot/model';
import { operationSchema } from '../../src/pilot/validation';
import { PilotDatabase } from '../../src/pilot/database';

function server() {
  const records: Record<string, ProfileRecord> = {}; const checkpoints = new Map<string,Checkpoint>(); const receipts = new Set<string>();
  const transport: PilotTransport = {
    submit: vi.fn(async (op: LearningOperation) => { if (!receipts.has(op.id)) { records[op.profileId] = applyOperation(records[op.profileId] ?? null, op); op.checkpoints?.forEach(cp => checkpoints.set(cp.id,cp)); receipts.add(op.id); } return { deleted: !!records[op.profileId].deleted }; }),
    pull: vi.fn(async () => ({ records: structuredClone(records), checkpoints: [...checkpoints.values()] }))
  };
  return { transport, records };
}
const account = () => ({ id: 'garden', name: 'גן בדיקה', uid: crypto.randomUUID() });
beforeEach(() => { vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false); });
afterEach(() => { configureLearningRepository(undefined); vi.restoreAllMocks(); });
describe('durable pilot repository', () => {
  it('persists 50 children and preferences across browser restart, then synchronizes in order', async () => {
    const cloud = server(), a = account(); let repo = new PilotRepository(a, cloud.transport); await repo.initialize();
    for (let i=0;i<50;i++) createProfile({ name: `ילד ${i}`, musicVolume:i });
    await localPersistence.flush(); expect(cloud.transport.submit).not.toHaveBeenCalled();
    repo.detach(); repo = new PilotRepository(a, cloud.transport); await repo.initialize();
    expect(getLearningSnapshot().profiles).toHaveLength(50);
    expect(getLearningSnapshot().profiles.find(p => p.name === 'ילד 25')?.musicVolume).toBe(25);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true); await repo.sync();
    expect(repo.getStatus()).toMatchObject({ pending:0,error:false }); expect(Object.keys(cloud.records)).toHaveLength(50);
  });
  it('retains outbox after an acknowledged-server/lost-response failure and retries without double credit', async () => {
    const cloud = server(), a = account(), repo = new PilotRepository(a, cloud.transport); await repo.initialize();
    const child = createProfile({ name:'אורי' }); repo.beginSession(child.id);
    recordLearningEvent({ profileId:child.id,sessionId:'s1',contentId:'letter-1',skillIds:['hebrew.letter-recognition'],gameId:'letters',evidenceForm:'visual-choice',correct:true,attemptNumber:1,hintUsed:false,responseMs:1,monotonicMs:1 });
    await localPersistence.flush();
    const submit = cloud.transport.submit; let lost=true;
    cloud.transport.submit = async op => { const response = await submit(op); if(lost) { lost=false; throw new Error('Lost response'); } return response; };
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true); await repo.sync(); expect(repo.getStatus().pending).toBeGreaterThan(0); await repo.sync();
    expect(repo.getStatus().pending).toBe(0); expect(cloud.records[child.id].data.events).toHaveLength(1);
  });
  it('does not clear unsynchronized data on logout', async () => {
    const cloud = server(), repo = new PilotRepository(account(),cloud.transport); await repo.initialize(); createProfile({name:'נועה'}); await localPersistence.flush();
    await expect(repo.close()).rejects.toThrow(); expect((await repo.database.all('outbox')).length).toBe(1);
  });
  it('merges independent changes from two computers without replacing a child’s achievements', async () => {
    const cloud = server(), a = account(), first = new PilotRepository(a,cloud.transport); await first.initialize(); const child = createProfile({name:'אורי'}); await localPersistence.flush();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true); await first.sync(); first.detach();
    const second = new PilotRepository({...a,uid:crypto.randomUUID()},cloud.transport); await second.initialize(); await second.refresh();
    updateProfile(child.id,{narrationVolume:12}); await localPersistence.flush(); await second.sync(); second.detach();
    await first.initialize(); updateProfile(child.id,{musicVolume:23}); await localPersistence.flush(); await first.sync(); await first.refresh();
    expect(first.read().profiles[0]).toMatchObject({ narrationVolume:12,musicVolume:23 });
  });
  it('keeps cached children of different accounts in separate databases', async () => {
    const a = account(), b = account(), first = new PilotRepository(a,server().transport); await first.initialize(); createProfile({name:'א'}); await localPersistence.flush(); first.detach();
    const other = new PilotRepository(b,server().transport); await other.initialize(); expect(other.read().profiles).toHaveLength(0);
    expect((await new PilotDatabase(a.uid).all('profiles')).length).toBe(1);
  });
  it('migrates long histories in bounded operations without counting existing mastery twice', async()=>{
    configureLearningRepository(undefined);localStorage.clear();const child=createProfile({name:'ילד ותיק'});
    for(let i=0;i<250;i++)recordLearningEvent({profileId:child.id,sessionId:'history',contentId:'letters-1',skillIds:['hebrew.letter-recognition'],gameId:'letters',evidenceForm:'visual-choice',correct:true,attemptNumber:1,hintUsed:false,responseMs:1,monotonicMs:1});
    await localPersistence.flush();const source=structuredClone(getLearningSnapshot());const cloud=server(),repo=new PilotRepository(account(),cloud.transport);await repo.initialize();
    vi.spyOn(navigator,'onLine','get').mockReturnValue(true);await repo.importSnapshot(source);
    expect(cloud.records[child.id].data.mastery['hebrew.letter-recognition']?.evidenceCount).toBe(250);expect(cloud.records[child.id].data.events).toHaveLength(250);
    for(const [op]of vi.mocked(cloud.transport.submit).mock.calls)expect(operationSchema.safeParse(op).success).toBe(true);
    expect(localStorage.getItem('lomdim-bekef.learning.v4')).not.toBeNull();await expect(repo.importSnapshot(source)).rejects.toThrow('כבר הועברו');
  });
  it('keeps the failed local transaction available for explicit retry without unhandled rejection',async()=>{
    const repo=new PilotRepository(account(),server().transport);await repo.initialize();
    vi.spyOn(repo.database,'commit').mockRejectedValueOnce(new Error('Quota exceeded'));
    const child=createProfile({name:'נועה'});
    await expect(localPersistence.flush()).rejects.toThrow('Quota exceeded');
    expect(localPersistence.getStatus().failed).toBe(true);
    await localPersistence.retry();
    expect((await repo.database.read<ProfileRecord>('profiles',child.id))?.profile.name).toBe('נועה');
    expect((await repo.database.all('outbox')).length).toBe(1);
  });
  it('retries queued writes when the browser misses its online event',async()=>{
    const cloud=server(),repo=new PilotRepository(account(),cloud.transport);await repo.initialize();createProfile({name:'אורי'});await localPersistence.flush();
    expect(navigator.onLine).toBe(false);await repo.sync(true);expect(repo.getStatus().pending).toBe(0);expect(Object.keys(cloud.records)).toHaveLength(1);
  });
  it('does not detach the new account when an old account finishes an asynchronous cleanup',async()=>{
    const first=new PilotRepository(account(),server().transport);await first.initialize();createProfile({name:'אורי'});await localPersistence.flush();
    const second=new PilotRepository(account(),server().transport);await second.initialize();createProfile({name:'נועה'});await localPersistence.flush();
    first.detach();expect(getLearningSnapshot().profiles.map(p=>p.name)).toEqual(['נועה']);
  });
});
