import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeApp as adminApp } from 'firebase-admin/app';
import { getAuth as adminAuth } from 'firebase-admin/auth';
import { getFirestore as adminDb } from 'firebase-admin/firestore';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { createDefaultProfile } from '../../src/services/learningStoreService';
import type { LearningOperation } from '../../src/pilot/model';
import { applyOperation } from '../../src/pilot/model';

const projectId='demo-olamia-pilot';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8088'; process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9098';
adminApp({projectId});
const admin=adminDb();
let environment: Awaited<ReturnType<typeof initializeTestEnvironment>>;
const apps: ReturnType<typeof initializeApp>[]=[];
let callA: (name:string,data?:unknown)=>Promise<unknown>; let callB: typeof callA;
const profile = createDefaultProfile({id:'emulator-child',name:'ילד בדיקה'});
const operation = (patch: Partial<LearningOperation> = {}): LearningOperation => ({id:crypto.randomUUID(),kindergartenId:'garden-a',profileId:profile.id,sessionId:'session-a',createdAt:new Date().toISOString(),kind:'create',profile,...patch});
before(async () => {
  environment=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088,rules:await readFile(new URL('../../pilot/firestore.rules',import.meta.url),'utf8')}});
  await environment.clearFirestore();
  for (const garden of ['a','b']) {
    const email=`garden-${garden}@example.test`, password='Test-only-123!';
    const user=await adminAuth().getUserByEmail(email).catch(()=>adminAuth().createUser({email,password}));
    await admin.doc(`memberships/${user.uid}`).set({kindergartenId:`garden-${garden}`,disabled:false}); await admin.doc(`kindergartens/garden-${garden}`).set({name:`Garden ${garden}`});
    const app=initializeApp({projectId,apiKey:'demo-key',authDomain:`${projectId}.firebaseapp.com`},`test-${garden}`); apps.push(app);
    const auth=getAuth(app); connectAuthEmulator(auth,'http://127.0.0.1:9098',{disableWarnings:true}); await signInWithEmailAndPassword(auth,email,password);
    const f=getFunctions(app,'europe-west1'); connectFunctionsEmulator(f,'127.0.0.1',5008);
    const invoke=async(name:string,data:unknown={})=>(await httpsCallable(f,name)(JSON.parse(JSON.stringify(data)))).data;
    if(garden==='a') callA=invoke; else callB=invoke;
  }
});
after(async()=>{ await Promise.all(apps.map(deleteApp)); await environment?.cleanup(); });
test('server creates profiles and rejects cross-garden requests',async()=>{
  assert.deepEqual(await callA('pilotApply',operation()),{deleted:false});
  await assert.rejects(()=>callB('pilotApply',operation({kind:'update',profile:{musicVolume:2}})));
});
test('atomic operation receipts avoid duplicate evidence after retry',async()=>{
  const e={id:'e1',profileId:profile.id,sessionId:'s1',contentId:'letters-1',skillIds:['hebrew.letter-recognition'],gameId:'letters',evidenceForm:'visual-choice',correct:true,attemptNumber:1,hintUsed:false,responseMs:1,monotonicMs:1,occurredAt:new Date().toISOString(),effectiveDay:'2026-10-19'};
  const op=operation({kind:'update',profile:undefined,events:[e as never]});
  await callA('pilotApply',op); await callA('pilotApply',op); await callA('pilotApply',{...op,id:crypto.randomUUID()});
  const data=(await admin.doc(`kindergartens/garden-a/states/${profile.id}`).get()).data()!.data;
  assert.equal(data.mastery['hebrew.letter-recognition'].evidenceCount,1);
});
test('PIN setup, correct/incorrect codes and rate limiting',async()=>{
  await callA('pilotSetPin',{pin:'123456'}); await callA('pilotVerifyPin',{pin:'123456'});
  for(let i=0;i<5;i++) await assert.rejects(()=>callA('pilotVerifyPin',{pin:'999999'}));
  await assert.rejects(()=>callA('pilotVerifyPin',{pin:'123456'}));
});
test('approved history import preserves mastery and does not double-count old evidence',async()=>{
  const childId='history-child';const base=operation({profileId:childId,profile:{...profile,id:childId}});
  const evidence=Array.from({length:10},(_,i)=>({id:`history-${i}`,profileId:childId,sessionId:'old-round',contentId:'letters-1',skillIds:['hebrew.letter-recognition'],gameId:'letters',evidenceForm:'visual-choice',correct:true,attemptNumber:1,hintUsed:false,responseMs:1,monotonicMs:1,occurredAt:new Date().toISOString(),effectiveDay:'2026-10-19'}));
  const existing=applyOperation(applyOperation(null,base),{...base,id:crypto.randomUUID(),kind:'update',profile:undefined,events:evidence as never});
  await callA('pilotApply',{...base,baseline:{mastery:existing.data.mastery,dailyContentCounts:existing.data.dailyContentCounts}});
  const history={...base,id:crypto.randomUUID(),kind:'update',profile:undefined,historical:true,events:evidence};await callA('pilotApply',history);
  const saved=(await admin.doc(`kindergartens/garden-a/states/${childId}`).get()).data()!.data;
  assert.equal(saved.mastery['hebrew.letter-recognition'].evidenceCount,10);assert.equal(saved.events.length,10);
  await assert.rejects(()=>callA('pilotApply',{...history,id:crypto.randomUUID(),sessionId:'unrelated-session'}));
});
test('rules deny anonymous, cross-garden reads and all direct writes',async()=>{
  const user=(await adminAuth().getUserByEmail('garden-a@example.test')).uid;
  const db=environment.authenticatedContext(user).firestore();
  await assertSucceeds(getDocs(collection(db,'kindergartens/garden-a/profiles')));
  await assertFails(getDocs(collection(db,'kindergartens/garden-b/profiles')));
  await assertFails(getDocs(collection(environment.unauthenticatedContext().firestore(),'kindergartens/garden-a/profiles')));
  await assertFails(setDoc(doc(db,'kindergartens/garden-a/profiles/forged'),{profile}));
  await assertFails(getDocs(collection(db,'staffSecrets')));
});
test('deletion erases personal records and permanently rejects stale creates and updates',async()=>{
  await callA('pilotApply',operation({kind:'delete',profile:undefined}));
  assert.equal((await admin.doc(`kindergartens/garden-a/states/${profile.id}`).get()).exists,false);
  assert.equal((await admin.collection('kindergartens/garden-a/events').where('profileId','==',profile.id).get()).size,0);
  assert.deepEqual(await callA('pilotApply',operation()),{deleted:true});
  assert.deepEqual(await callA('pilotApply',operation({kind:'update',profile:{name:'ישן'}})),{deleted:true});
});
