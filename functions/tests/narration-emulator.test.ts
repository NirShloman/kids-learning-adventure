import assert from 'node:assert/strict';
import { after, test, mock } from 'node:test';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { checksumAudio, createNarrationAssetKey, DEFAULT_NARRATION_CONFIG, narrationStoragePath, type NarrationAsset } from '../src/narration/core.js';
import { FirebaseStorageGateway, FirestoreNarrationRepository, GoogleTextToSpeechGateway } from '../src/narration/firebase-adapters.js';

// Never fall through to ADC/production if someone invokes this file directly.
for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
  assert.match(process.env[name] ?? '', /^(127\.0\.0\.1|localhost):\d+$/, `${name} must point to a local emulator`);
}
const projectId = 'demo-olamia-narration';
process.env.TTS_GENERATION_ENABLED = 'true';
process.env.TTS_LANGUAGE = DEFAULT_NARRATION_CONFIG.language;
process.env.TTS_VOICE = DEFAULT_NARRATION_CONFIG.voice;
process.env.TTS_SPEAKING_RATE = String(DEFAULT_NARRATION_CONFIG.speakingRate);
process.env.TTS_VERSION = String(DEFAULT_NARRATION_CONFIG.version);
const app = initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` });
const db = getFirestore();
const repository = new FirestoreNarrationRepository(db);
const storage = new FirebaseStorageGateway();
const { generateNarrationBinding } = await import('../src/index.js');
const manifest = JSON.parse(readFileSync(new URL('../../src/assets/generatedNarrationManifest.json', import.meta.url), 'utf8'));
const entry = Object.values(manifest.entries)[0] as { localPath: string };
const audio = readFileSync(new URL(`../../public${entry.localPath}`, import.meta.url));
const synth = mock.method(GoogleTextToSpeechGateway.prototype, 'synthesize', async () => audio);
after(async () => { mock.restoreAll(); await db.terminate(); await deleteApp(app); });

type BindingEvent = Parameters<typeof generateNarrationBinding.run>[0];
async function runBinding(id: string, input: Record<string, unknown>) {
  const ref = db.collection('narrationBindings').doc(id);
  const before = await ref.get();
  await ref.set(input, { merge: true });
  const after = await ref.get();
  const event = { id: randomUUID(), params: { bindingId: id }, data: { before, after } } as BindingEvent;
  await generateNarrationBinding.run(event);
  return { ref, event, data: (await ref.get()).data()! };
}

test('binding handler creates an immutable MP3; duplicates and output-only updates do not synthesize', async () => {
  const calls = synth.mock.callCount();
  const text = `בדיקת עולמיה ${randomUUID()}`;
  const first = await runBinding(randomUUID(), { sourceText: text });
  assert.equal(first.data.status, 'ready');
  const second = await runBinding(randomUUID(), { sourceText: text });
  assert.equal(second.data.assetKey, first.data.assetKey);
  assert.equal(second.data.cached, true);
  await generateNarrationBinding.run(first.event); // at-least-once delivery
  await runBinding(first.ref.id, { updatedAt: Timestamp.now(), status: 'ready' });
  assert.equal(synth.mock.callCount(), calls + 1);
  const file = getStorage().bucket().file(first.data.storagePath);
  const [download] = await file.download();
  const [metadata] = await file.getMetadata();
  assert.equal(checksumAudio(download), first.data.checksum);
  assert.equal(metadata.contentType, 'audio/mpeg');
  assert.equal(metadata.cacheControl, 'public,max-age=31536000,immutable');
});

test('failed synthesis releases the lease and leaves both asset and binding failed', async () => {
  synth.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('test invalid voice'), { code: 3 }); });
  const text = `כשל ${randomUUID()}`;
  const id = randomUUID();
  await assert.rejects(runBinding(id, { sourceText: text }), /test invalid voice/);
  const asset = await repository.get(createNarrationAssetKey(text, DEFAULT_NARRATION_CONFIG));
  assert.equal(asset?.status, 'failed');
  assert.equal(asset?.leaseOwner, undefined);
  assert.equal((await db.collection('narrationBindings').doc(id).get()).data()?.status, 'failed');
});

test('an older event cannot publish its result over a newer binding edit', async () => {
  const id = randomUUID();
  const newText = `טקסט חדש ${randomUUID()}`;
  synth.mock.mockImplementationOnce(async () => {
    await db.collection('narrationBindings').doc(id).update({ sourceText: newText, status: 'pending' });
    return audio;
  });
  const result = await runBinding(id, { sourceText: `טקסט ישן ${randomUUID()}` });
  assert.equal(result.data.sourceText, newText);
  assert.equal(result.data.status, 'pending');
  assert.equal(result.data.assetKey, undefined);
  const calls = synth.mock.callCount();
  await generateNarrationBinding.run(result.event);
  assert.equal(synth.mock.callCount(), calls);
});

test('regenerating one binding creates a new immutable revision without replacing the original', async () => {
  const calls = synth.mock.callCount();
  const id = randomUUID();
  const text = `גרסה ${randomUUID()}`;
  const original = await runBinding(id, { sourceText: text, ...DEFAULT_NARRATION_CONFIG });
  const revised = await runBinding(id, { forceGeneration: true, revision: randomUUID(), generationRequest: randomUUID() });
  assert.notEqual(revised.data.assetKey, original.data.assetKey);
  assert.notEqual(revised.data.storagePath, original.data.storagePath);
  assert.equal(revised.data.status, 'ready');
  await generateNarrationBinding.run(revised.event);
  assert.equal(synth.mock.callCount(), calls + 2);
  const [originalBytes] = await getStorage().bucket().file(original.data.storagePath).download();
  assert.equal(checksumAudio(originalBytes), original.data.checksum);
});

test('real Firestore transactions serialize leases, recover expired owners and deduplicate usage', async () => {
  const text = randomUUID();
  const key = createNarrationAssetKey(text, DEFAULT_NARRATION_CONFIG);
  const candidate: NarrationAsset = { ...DEFAULT_NARRATION_CONFIG, assetKey: key, sourceText: text, normalizedText: text,
    storagePath: narrationStoragePath(key, DEFAULT_NARRATION_CONFIG), audioUrl: '', status: 'generating', cached: false };
  const now = Date.now();
  const leases = await Promise.all(['a', 'b', 'c'].map(owner => repository.acquireLease(candidate, owner, now, 60_000)));
  assert.equal(leases.filter(lease => lease.outcome === 'acquired').length, 1);
  assert.equal(leases.filter(lease => lease.outcome === 'busy').length, 2);
  const oldOwner = leases.find(lease => lease.outcome === 'acquired')!.asset.leaseOwner!;
  await db.collection('narrationAssets').doc(key).update({ leaseExpiresAt: Timestamp.fromMillis(now - 1) });
  assert.equal((await repository.acquireLease(candidate, 'recovered', now, 60_000)).outcome, 'acquired');
  await assert.rejects(repository.complete(key, oldOwner, { status: 'ready' }), /lease was lost/);
  await repository.complete(key, 'recovered', { audioUrl: 'http://localhost/test', durationMs: 1000 });
  assert.equal((await repository.get(key))?.durationMs, 1000);
  const month = new Date().toISOString().slice(0, 7);
  const before = (await db.collection('ttsUsage').doc(month).get()).data()?.requests ?? 0;
  const eventId = randomUUID();
  await Promise.all([1, 2, 3].map(() => repository.recordUsage(eventId, { requests: 1, charactersSent: 5 })));
  assert.equal((await db.collection('ttsUsage').doc(month).get()).data()?.requests, before + 1);
});

test('Storage metadata is checked on a simulated GCS precondition failure', async () => {
  const path = `narration/he-IL/test/${randomUUID()}.mp3`;
  const metadata = { checksum: checksumAudio(audio) };
  const url = await storage.put(path, audio, metadata);
  // The Storage emulator does not enforce ifGenerationMatch. Simulate only the
  // production 412 response; the subsequent metadata read uses real emulated Storage.
  const file = getStorage().bucket().file(path);
  const save = mock.method(Object.getPrototypeOf(file), 'save', async (_bytes: unknown, options: { preconditionOpts: { ifGenerationMatch: number } }) => {
    assert.equal(options.preconditionOpts.ifGenerationMatch, 0);
    throw Object.assign(new Error('precondition failed'), { code: 412 });
  });
  try {
    assert.equal(await storage.put(path, audio, metadata), url);
    await assert.rejects(storage.put(path, new Uint8Array([1, 2]), { checksum: 'other' }), /IMMUTABLE_AUDIO_CONFLICT/);
  } finally { save.mock.restore(); }
  const [stillOriginal] = await getStorage().bucket().file(path).download();
  assert.equal(checksumAudio(stillOriginal), metadata.checksum);
});
