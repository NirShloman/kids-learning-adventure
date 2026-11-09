import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { applyOperation, type LearningOperation, type ProfileRecord } from '../../src/pilot/model';
import { operationSchema } from '../../src/pilot/validation';

initializeApp();
const db = getFirestore();
const options = { region: 'europe-west1', maxInstances: 5, timeoutSeconds: 120, memory: '512MiB' as const };
async function account(request: CallableRequest) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const membership = await db.doc(`memberships/${request.auth.uid}`).get();
  if (!membership.exists || membership.data()?.disabled) throw new HttpsError('permission-denied', 'No kindergarten access');
  return { uid: request.auth.uid, id: membership.data()!.kindergartenId as string };
}
function recentLogin(request: CallableRequest) {
  if (!request.auth || Date.now() / 1000 - Number(request.auth.token.auth_time) > 300) throw new HttpsError('unauthenticated', 'Reauthenticate first');
}
export const pilotAccount = onCall(options, async request => {
  const a = await account(request); const garden = (await db.doc(`kindergartens/${a.id}`).get()).data();
  const pin = await db.doc(`staffSecrets/${a.id}`).get();
  return { ...a, name: garden?.name ?? '', pinSet: pin.exists };
});
export const pilotSetPin = onCall(options, async request => {
  const a = await account(request); recentLogin(request);
  const parsed = z.object({ pin: z.string().regex(/^\d{6}$/) }).strict().safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument','A six-digit code is required');
  const { pin } = parsed.data;
  const salt = randomBytes(32).toString('hex'); const hash = scryptSync(pin, salt, 32).toString('hex');
  await db.doc(`staffSecrets/${a.id}`).set({ salt, hash, failures: 0, lockedUntil: 0 });
  return { ok: true };
});
export const pilotVerifyPin = onCall(options, async request => {
  const a = await account(request); const parsed = z.object({ pin: z.string().regex(/^\d{6}$/) }).strict().safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument','A six-digit code is required');
  const { pin } = parsed.data;
  const ref = db.doc(`staffSecrets/${a.id}`);
  const ok = await db.runTransaction(async tx => {
    const value = (await tx.get(ref)).data();
    if (!value || value.lockedUntil > Date.now()) return false;
    const valid = timingSafeEqual(scryptSync(pin, value.salt, 32), Buffer.from(value.hash, 'hex'));
    const failures = valid ? 0 : (value.failures ?? 0) + 1;
    tx.update(ref, { failures, lockedUntil: failures >= 5 ? Date.now() + 300000 : 0 });
    return valid;
  });
  if (!ok) throw new HttpsError('permission-denied', 'Incorrect code or temporarily locked');
  return { ok: true };
});
export const pilotApply = onCall(options, async request => {
  const a = await account(request);
  const parsed = operationSchema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid operation');
  const op = parsed.data as LearningOperation;
  if (op.kindergartenId !== a.id) throw new HttpsError('permission-denied', 'Wrong kindergarten');
  const root = db.doc(`kindergartens/${a.id}`);
  const profileRef = root.collection('profiles').doc(op.profileId), stateRef = root.collection('states').doc(op.profileId);
  const receiptRef = root.collection('receipts').doc(op.id);
  return db.runTransaction(async tx => {
    const [receipt, profileDoc, stateDoc] = await tx.getAll(receiptRef, profileRef, stateRef);
    if (receipt.exists) return { deleted: receipt.data()!.deleted === true };
    const current = profileDoc.exists ? { ...profileDoc.data(), data: stateDoc.data()?.data } as ProfileRecord : null;
    if (current?.deleted) { tx.create(receiptRef, { deleted: true, committedAt: FieldValue.serverTimestamp() }); return { deleted: true }; }
    // Event documents are permanent deduplication keys, independent of the bounded UI history.
    const eventRefs = (op.events ?? []).map(e => root.collection('events').doc(`${op.profileId}:${e.id}`));
    const eventDocs = eventRefs.length ? await tx.getAll(...eventRefs) : [];
    const filtered = { ...op, events: op.events?.filter((_, index) => !eventDocs[index].exists) };
    let next: ProfileRecord;
    try { next = applyOperation(current, filtered); } catch { throw new HttpsError('failed-precondition', 'Profile missing or already exists'); }
    const { data, ...header } = next;
    // A tombstone remains to reject stale offline writes; personal data is erased.
    if (next.deleted) {
      // Large histories are removed outside this transaction by a recursive deletion below.
      tx.set(profileRef, { profile: { id: op.profileId }, revision: next.revision, deleted: true }); tx.delete(stateRef);
      tx.create(receiptRef, { deleted: true, committedAt: FieldValue.serverTimestamp() });
      // Deletion cleanup is awaited by the caller after the durable tombstone commits.
    } else {
      data.events = data.events.slice(-200);
      data.dailyContentCounts = Object.fromEntries(Object.entries(data.dailyContentCounts).filter(([key]) => key.slice(0,10) >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10)));
      if (JSON.stringify(data).length > 750000) throw new HttpsError('resource-exhausted', 'Profile state exceeds limit');
      tx.set(profileRef, header); tx.set(stateRef, { data });
      (op.events ?? []).forEach((event, i) => { if (!eventDocs[i].exists) tx.create(eventRefs[i], event); });
      for (const summary of op.sessions ?? []) tx.set(root.collection('sessions').doc(`${op.profileId}:${summary.id}`), summary);
      for (const cp of op.checkpoints ?? []) tx.set(root.collection('checkpoints').doc(`${op.profileId}:${cp.id}`), cp);
      tx.create(receiptRef, { deleted: false, committedAt: FieldValue.serverTimestamp() });
    }
    return { deleted: !!next.deleted };
  }).then(async result => {
    if (result.deleted) {
      for (const name of ['events', 'sessions', 'checkpoints']) {
        let docs;
        do { docs = await root.collection(name).where('profileId', '==', op.profileId).limit(400).get(); const batch = db.batch(); docs.docs.forEach(doc => batch.delete(doc.ref)); if (docs.size) await batch.commit(); } while (docs.size === 400);
      }
    }
    return result;
  });
});
// Not exported as a callable: account provisioning is an ADC-only local admin tool.
