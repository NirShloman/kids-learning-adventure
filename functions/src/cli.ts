import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { parseBuffer } from 'music-metadata';
import { DEFAULT_NARRATION_CONFIG, normalizeHebrewNarration } from './narration/core.js';
import {
  FirebaseStorageGateway,
  FirestoreNarrationRepository,
  GoogleTextToSpeechGateway,
  structuredLogger
} from './narration/firebase-adapters.js';
import { NarrationService } from './narration/narration-service.js';

interface CatalogEntry {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceText: string;
  sources?: Array<{ sourceType: string; sourceId: string }>;
}
interface Catalog { schemaVersion: 1; entries: CatalogEntry[] }

const cliDirectory = dirname(fileURLToPath(import.meta.url));
// `tsx` executes from functions/src while the deployed build executes from
// functions/lib/src. Resolve the package root in both layouts.
const functionsRoot = existsSync(join(cliDirectory, '..', 'package.json'))
  ? resolve(cliDirectory, '..')
  : resolve(cliDirectory, '..', '..');
const projectRoot = resolve(functionsRoot, '..');
const args = process.argv.slice(2);
const command = args[0] ?? 'help';

function flag(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function envBoolean(name: string, fallback = false): boolean {
  const value = process.env[name];
  return value === undefined ? fallback : value.toLowerCase() === 'true';
}

function config() {
  return {
    language: process.env.TTS_LANGUAGE ?? DEFAULT_NARRATION_CONFIG.language,
    voice: flag('voice') ?? process.env.TTS_VOICE ?? DEFAULT_NARRATION_CONFIG.voice,
    speakingRate: Number(process.env.TTS_SPEAKING_RATE ?? DEFAULT_NARRATION_CONFIG.speakingRate),
    audioFormat: 'mp3' as const,
    version: Number(process.env.TTS_VERSION ?? DEFAULT_NARRATION_CONFIG.version)
  };
}

function requireGenerationConsent(): void {
  if (!envBoolean('TTS_GENERATION_ENABLED') || !hasFlag('allow-generation')) {
    throw new Error('Generation requires TTS_GENERATION_ENABLED=true and --allow-generation.');
  }
}

function initializeAdmin(): void {
  ensureLocalAdc();
  if (!getApps().length) initializeApp();
}

function ensureLocalAdc(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIRESTORE_EMULATOR_HOST) return;
  const adcPath = process.platform === 'win32'
    ? join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'gcloud', 'application_default_credentials.json')
    : join(homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  if (!existsSync(adcPath)) {
    throw new Error('Application Default Credentials were not found. Run gcloud auth application-default login or configure Workload Identity Federation.');
  }
}

function readCatalog(): Catalog {
  const path = resolve(projectRoot, flag('catalog') ?? join(projectRoot, 'tmp', 'narration', 'catalog.json'));
  if (!existsSync(path)) throw new Error(`Narration catalog not found: ${path}. Run npm run narration:catalog first.`);
  return JSON.parse(readFileSync(path, 'utf8')) as Catalog;
}

async function listHebrewVoices(): Promise<string[]> {
  ensureLocalAdc();
  const [response] = await new TextToSpeechClient().listVoices({ languageCode: config().language });
  return (response.voices ?? [])
    .flatMap((voice) => voice.name ? [voice.name] : [])
    .filter((name) => name.includes('Chirp3-HD'))
    .sort();
}

async function voices(): Promise<void> {
  const names = await listHebrewVoices();
  if (!names.length) throw new Error(`No Chirp 3 HD voices returned for ${config().language}.`);
  console.log(names.join('\n'));
  console.log(`\n${names.length} Chirp 3 HD voices available for ${config().language}.`);
}

const sampleSentences = [
  "שלום! איזה כיף שבאתם ליֶדַע, לֶה!",
  'בואו נמצא את התשובה הנכונה.',
  'איזו חיה עושה מו?',
  'כמה תפוחים אתם רואים בתמונה?',
  'כל הכבוד! עניתם נכון!',
  'כמעט! בואו ננסה שוב.',
  'מצוין! ממשיכים לשאלה הבאה.',
  'איזו צורה היא עיגול?',
  'איפה נמצא המספר שלוש?'
];

async function samples(): Promise<void> {
  requireGenerationConsent();
  const available = new Set(await listHebrewVoices());
  const requested = (flag('voices')?.split(',') ?? [
    'he-IL-Chirp3-HD-Aoede',
    'he-IL-Chirp3-HD-Leda',
    'he-IL-Chirp3-HD-Achernar',
    'he-IL-Chirp3-HD-Sulafat',
    'he-IL-Chirp3-HD-Zephyr'
  ]).map((voice) => voice.trim()).filter(Boolean);
  const missing = requested.filter((voice) => !available.has(voice));
  if (missing.length) throw new Error(`Voices not returned by listVoices: ${missing.join(', ')}`);
  const texts = flag('text') ? [flag('text')!] : sampleSentences;
  const output = resolve(projectRoot, flag('output') ?? join(projectRoot, 'tmp', 'narration', 'samples'));
  const sampleCount = Number(flag('sample-count') ?? texts.length);
  if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > texts.length) {
    throw new Error(`--sample-count must be an integer from 1 to ${texts.length}.`);
  }
  const client = new TextToSpeechClient();
  for (const voice of requested) {
    const voiceDirectory = join(output, voice);
    mkdirSync(voiceDirectory, { recursive: true });
    for (const [index, source] of texts.slice(0, sampleCount).entries()) {
      const text = normalizeHebrewNarration(source);
      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: { languageCode: config().language, name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: config().speakingRate }
      });
      if (!response.audioContent) throw new Error(`No audio returned for ${voice}, sample ${index + 1}.`);
      const audio = typeof response.audioContent === 'string'
        ? Buffer.from(response.audioContent, 'base64')
        : Buffer.from(response.audioContent);
      const sampleName = `${String(index + 1).padStart(2, '0')}-${voice.replace('he-IL-Chirp3-HD-', '')}.mp3`;
      writeFileSync(join(voiceDirectory, sampleName), audio);
      console.log(`[${voice}] ${index + 1}/${sampleCount}`);
    }
    writeFileSync(join(voiceDirectory, 'sentences.json'), `${JSON.stringify(texts, null, 2)}\n`);
  }
  console.log(`Voice samples written to ${output}`);
}

async function backfill(): Promise<void> {
  if (!hasFlag('apply')) throw new Error('Backfill is dry by default. Pass --apply after reviewing the catalog.');
  if (!hasFlag('approved-voice')) throw new Error('Backfill requires --approved-voice to confirm that samples were reviewed.');
  initializeAdmin();
  const firestore = getFirestore();
  const catalog = readCatalog();
  const selected = config();
  let scanned = 0;
  let unchanged = 0;
  let queued = 0;
  for (let offset = 0; offset < catalog.entries.length; offset += 400) {
    const page = catalog.entries.slice(offset, offset + 400);
    const references = page.map((entry) => firestore.collection('narrationBindings').doc(entry.id));
    const snapshots = await firestore.getAll(...references);
    const batch = firestore.batch();
    page.forEach((entry, index) => {
      scanned += 1;
      const existing = snapshots[index]?.data();
      const desired = {
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        sourceRefs: entry.sources ?? [{ sourceType: entry.sourceType, sourceId: entry.sourceId }],
        sourceText: entry.sourceText,
        language: selected.language,
        voice: selected.voice,
        speakingRate: selected.speakingRate,
        audioFormat: selected.audioFormat,
        version: selected.version
      };
      const same = existing && Object.entries(desired).every(([key, value]) => JSON.stringify(existing[key]) === JSON.stringify(value));
      if (same) { unchanged += 1; return; }
      queued += 1;
      batch.set(references[index]!, { ...desired, status: 'pending', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    if (queued > 0) await batch.commit();
    console.log(`Bindings scanned: ${Math.min(offset + page.length, catalog.entries.length)}/${catalog.entries.length}`);
  }
  console.log(JSON.stringify({ scanned, unchanged, queued, uniqueTexts: new Set(catalog.entries.map((entry) => entry.sourceText)).size }, null, 2));
}

async function sync(): Promise<void> {
  if (!hasFlag('apply')) throw new Error('Sync writes runtime assets. Pass --apply explicitly.');
  initializeAdmin();
  const firestore = getFirestore();
  const bucket = getStorage().bucket();
  const bindings = await firestore.collection('narrationBindings').where('status', '==', 'ready').get();
  const byText: Record<string, Record<string, unknown>> = {};
  let downloaded = 0;
  let reused = 0;
  for (const binding of bindings.docs) {
    const data = binding.data();
    if (typeof data.sourceText !== 'string' || typeof data.assetKey !== 'string' || typeof data.storagePath !== 'string') continue;
    const destination = join(projectRoot, 'public', 'assets', 'audio', data.storagePath);
    let audio: Buffer;
    if (existsSync(destination)) {
      audio = readFileSync(destination);
      const checksum = createHash('sha256').update(audio).digest('hex');
      if (checksum === data.checksum) reused += 1;
      else {
        [audio] = await bucket.file(data.storagePath).download();
        mkdirSync(dirname(destination), { recursive: true });
        writeFileSync(destination, audio);
        downloaded += 1;
      }
    } else {
      [audio] = await bucket.file(data.storagePath).download();
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, audio);
      downloaded += 1;
    }
    const metadata = await parseBuffer(audio, { mimeType: 'audio/mpeg' }, { duration: true });
    byText[data.sourceText] = {
      assetKey: data.assetKey,
      localPath: `/assets/audio/${data.storagePath}`,
      storagePath: data.storagePath,
      audioUrl: data.audioUrl,
      checksum: data.checksum,
      byteLength: audio.byteLength,
      durationMs: metadata.format.duration ? Math.round(metadata.format.duration * 1000) : undefined
    };
  }
  const manifestPath = join(projectRoot, 'src', 'assets', 'generatedNarrationManifest.json');
  writeFileSync(manifestPath, `${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    config: config(),
    entries: Object.fromEntries(Object.entries(byText).sort(([first], [second]) => first.localeCompare(second)))
  }, null, 2)}\n`);
  console.log(JSON.stringify({ readyBindings: bindings.size, uniqueRuntimeTexts: Object.keys(byText).length, downloaded, reused, manifestPath }, null, 2));
}

async function regenerate(): Promise<void> {
  if (!hasFlag('apply')) throw new Error('Regenerate requires --apply.');
  const bindingId = flag('id');
  const all = hasFlag('all');
  if (!bindingId && !all) throw new Error('Pass --id <bindingId> or --all.');
  if (hasFlag('force') && !flag('revision')) throw new Error('--force requires --revision <immutable-revision>.');
  initializeAdmin();
  const firestore = getFirestore();
  const references = bindingId
    ? [firestore.collection('narrationBindings').doc(bindingId)]
    : (await firestore.collection('narrationBindings').get()).docs.map((document) => document.ref);
  for (let offset = 0; offset < references.length; offset += 400) {
    const batch = firestore.batch();
    for (const reference of references.slice(offset, offset + 400)) {
      batch.set(reference, {
        generationRequest: new Date().toISOString(),
        forceGeneration: hasFlag('force'),
        ...(flag('revision') ? { revision: flag('revision') } : {}),
        status: 'pending',
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await batch.commit();
  }
  console.log(`Queued ${references.length} binding(s) for regeneration.`);
}

async function cleanup(): Promise<void> {
  initializeAdmin();
  const firestore = getFirestore();
  const [assets, bindings] = await Promise.all([
    firestore.collection('narrationAssets').where('status', '==', 'ready').get(),
    firestore.collection('narrationBindings').where('status', '==', 'ready').get()
  ]);
  const referenced = new Set(bindings.docs.map((document) => document.data().assetKey).filter(Boolean));
  const orphaned = assets.docs.filter((document) => !referenced.has(document.id)).map((document) => ({
    assetKey: document.id,
    storagePath: document.data().storagePath,
    byteLength: document.data().byteLength ?? 0
  }));
  console.log(JSON.stringify({ dryRun: true, readyAssets: assets.size, referencedAssets: referenced.size, orphanedCount: orphaned.length,
    orphanedBytes: orphaned.reduce((total, asset) => total + Number(asset.byteLength), 0), orphaned }, null, 2));
  console.log('No files or documents were deleted.');
}

async function smoke(): Promise<void> {
  requireGenerationConsent();
  if (!hasFlag('approved-voice')) throw new Error('Cloud smoke requires --approved-voice.');
  initializeAdmin();
  const selected = config();
  const service = new NarrationService(
    new FirestoreNarrationRepository(),
    new GoogleTextToSpeechGateway(),
    new FirebaseStorageGateway(),
    structuredLogger,
    { generationEnabled: true }
  );
  const text = flag('text') ?? `בדיקת קריינות מאובטחת של ידע׳לה, ${new Date().toISOString()}.`;
  const request = { text, ...selected };
  const first = await service.generateOrGet({ ...request, requestId: `smoke:${Date.now()}:first` });
  const second = await service.generateOrGet({ ...request, requestId: `smoke:${Date.now()}:second` });
  if (first.cached || !second.cached || first.assetKey !== second.assetKey) {
    throw new Error('Cloud smoke cache assertions failed.');
  }
  const [metadata] = await getStorage().bucket().file(first.storagePath).getMetadata();
  if (metadata.contentType !== 'audio/mpeg') throw new Error(`Unexpected content type: ${metadata.contentType}`);
  console.log(JSON.stringify({
    assetKey: first.assetKey,
    storagePath: first.storagePath,
    audioUrl: first.audioUrl,
    contentType: metadata.contentType,
    cacheControl: metadata.cacheControl,
    firstCached: first.cached,
    secondCached: second.cached,
    googleCallsExpected: 1
  }, null, 2));
}

function help(): void {
  console.log(`Narration administration commands:
  voices
  samples --allow-generation [--voices voice,voice] [--output path]
  backfill --apply --approved-voice [--voice name] [--catalog path]
  sync --apply
  regenerate --apply (--id id | --all) [--force --revision value]
  cleanup
  smoke --allow-generation --approved-voice [--text text]`);
}

const commands: Record<string, () => Promise<void> | void> = { voices, samples, backfill, sync, regenerate, cleanup, smoke, help };
try {
  await (commands[command] ?? help)();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const friendly = message.includes('default credentials')
    ? 'Application Default Credentials were not found. Run gcloud auth application-default login or use a managed workload identity.'
    : message;
  console.error(`Narration command failed: ${friendly}`);
  process.exitCode = 1;
}
