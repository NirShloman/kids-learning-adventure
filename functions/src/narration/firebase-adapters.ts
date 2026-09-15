import { createHash } from 'node:crypto';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { NarrationAsset, NarrationConfig } from './core.js';
import type {
  LeaseResult,
  NarrationLogger,
  NarrationRepository,
  NarrationStorageGateway,
  TextToSpeechGateway
} from './narration-service.js';

function initializeAdmin(): void {
  if (!getApps().length) initializeApp();
}

function publicDownloadUrl(bucket: string, path: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

function asMillis(value: unknown): number | undefined {
  return value instanceof Timestamp ? value.toMillis() : typeof value === 'number' ? value : undefined;
}

function toAsset(data: Record<string, unknown>): NarrationAsset {
  return {
    assetKey: String(data.assetKey ?? ''),
    sourceText: String(data.sourceText ?? ''),
    normalizedText: String(data.normalizedText ?? ''),
    language: String(data.language ?? ''),
    voice: String(data.voice ?? ''),
    speakingRate: Number(data.speakingRate ?? 1),
    audioFormat: 'mp3',
    version: Number(data.version ?? data.ttsVersion ?? 1),
    ...(typeof data.revision === 'string' ? { revision: data.revision } : {}),
    storagePath: String(data.storagePath ?? ''),
    audioUrl: String(data.audioUrl ?? ''),
    status: data.status === 'ready' || data.status === 'failed' ? data.status : 'generating',
    cached: false,
    ...(typeof data.checksum === 'string' ? { checksum: data.checksum } : {}),
    ...(typeof data.byteLength === 'number' ? { byteLength: data.byteLength } : {}),
    ...(typeof data.retryCount === 'number' ? { retryCount: data.retryCount } : {}),
    ...(typeof data.errorCode === 'string' ? { errorCode: data.errorCode } : {}),
    ...(typeof data.leaseOwner === 'string' ? { leaseOwner: data.leaseOwner } : {}),
    ...(asMillis(data.leaseExpiresAt) !== undefined ? { leaseExpiresAtMs: asMillis(data.leaseExpiresAt) } : {}),
    ...(typeof data.generationSequence === 'number' ? { generationSequence: data.generationSequence } : {})
  };
}

export class FirestoreNarrationRepository implements NarrationRepository {
  private readonly firestore: Firestore;

  constructor(firestore?: Firestore) {
    initializeAdmin();
    this.firestore = firestore ?? getFirestore();
  }

  async get(assetKey: string): Promise<NarrationAsset | null> {
    const snapshot = await this.firestore.collection('narrationAssets').doc(assetKey).get();
    return snapshot.exists ? toAsset(snapshot.data() ?? {}) : null;
  }

  async acquireLease(asset: NarrationAsset, leaseOwner: string, nowMs: number, leaseMs: number): Promise<LeaseResult> {
    const reference = this.firestore.collection('narrationAssets').doc(asset.assetKey);
    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const current = snapshot.exists ? toAsset(snapshot.data() ?? {}) : null;
      if (current?.status === 'ready') return { outcome: 'ready', asset: current };
      if (current?.status === 'generating' && (current.leaseExpiresAtMs ?? 0) > nowMs) {
        return { outcome: 'busy', asset: current };
      }
      const generationSequence = (current?.generationSequence ?? 0) + 1;
      const leased: NarrationAsset = {
        ...asset,
        leaseOwner,
        leaseExpiresAtMs: nowMs + leaseMs,
        generationSequence,
        retryCount: current?.retryCount ?? 0
      };
      transaction.set(reference, {
        ...leased,
        ttsVersion: leased.version,
        cached: FieldValue.delete(),
        leaseExpiresAt: Timestamp.fromMillis(nowMs + leaseMs),
        createdAt: snapshot.exists ? (snapshot.data()?.createdAt ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        errorCode: FieldValue.delete(),
        lastErrorAt: FieldValue.delete()
      }, { merge: true });
      return { outcome: 'acquired', asset: leased };
    });
  }

  async complete(assetKey: string, leaseOwner: string, result: Partial<NarrationAsset>): Promise<NarrationAsset> {
    const reference = this.firestore.collection('narrationAssets').doc(assetKey);
    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('Narration asset disappeared before completion.');
      const current = toAsset(snapshot.data() ?? {});
      if (current.leaseOwner !== leaseOwner) throw new Error('Narration generation lease was lost.');
      const ready: NarrationAsset = { ...current, ...result, status: 'ready', cached: false };
      transaction.update(reference, {
        ...result,
        status: 'ready',
        leaseOwner: FieldValue.delete(),
        leaseExpiresAt: FieldValue.delete(),
        errorCode: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      });
      return ready;
    });
  }

  async fail(assetKey: string, leaseOwner: string, errorCode: string, retryCount: number): Promise<void> {
    const reference = this.firestore.collection('narrationAssets').doc(assetKey);
    await this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists || snapshot.data()?.leaseOwner !== leaseOwner) return;
      transaction.update(reference, {
        status: 'failed',
        errorCode,
        retryCount,
        lastErrorAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        leaseOwner: FieldValue.delete(),
        leaseExpiresAt: FieldValue.delete()
      });
    });
  }

  async recordUsage(eventId: string, deltas: { charactersSent?: number; requests?: number; cacheHits?: number; failedRequests?: number }): Promise<void> {
    const safeEventId = createHash('sha256').update(eventId).digest('hex');
    const month = new Date().toISOString().slice(0, 7);
    const eventReference = this.firestore.collection('ttsUsageEvents').doc(safeEventId);
    const aggregateReference = this.firestore.collection('ttsUsage').doc(month);
    await this.firestore.runTransaction(async (transaction) => {
      if ((await transaction.get(eventReference)).exists) return;
      transaction.create(eventReference, { month, ...deltas, createdAt: FieldValue.serverTimestamp() });
      transaction.set(aggregateReference, {
        charactersSent: FieldValue.increment(deltas.charactersSent ?? 0),
        requests: FieldValue.increment(deltas.requests ?? 0),
        cacheHits: FieldValue.increment(deltas.cacheHits ?? 0),
        failedRequests: FieldValue.increment(deltas.failedRequests ?? 0),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });
  }
}

export class GoogleTextToSpeechGateway implements TextToSpeechGateway {
  constructor(private readonly client = new TextToSpeechClient(), private readonly disableAutomaticRetries = false) {}

  async synthesize(text: string, config: NarrationConfig): Promise<Uint8Array> {
    const [response] = await this.client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: config.language, name: config.voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: config.speakingRate }
    }, this.disableAutomaticRetries ? { retry: { retryCodes: [] }, timeout: 60_000 } : undefined);
    const content = response.audioContent;
    if (!content) throw new Error('Google TTS returned no audio content.');
    return typeof content === 'string' ? Uint8Array.from(Buffer.from(content, 'base64')) : Uint8Array.from(content);
  }
}

export class FirebaseStorageGateway implements NarrationStorageGateway {
  async put(path: string, audio: Uint8Array, metadata: Record<string, string>): Promise<string> {
    initializeAdmin();
    const bucket = getStorage().bucket();
    const file = bucket.file(path);
    try {
      await file.save(Buffer.from(audio), {
        resumable: false,
        contentType: 'audio/mpeg',
        metadata: {
          cacheControl: 'public,max-age=31536000,immutable',
          metadata
        },
        preconditionOpts: { ifGenerationMatch: 0 }
      });
    } catch (error) {
      const code = error && typeof error === 'object' ? Number((error as { code?: unknown }).code) : 0;
      if (code !== 412) throw error;
    }
    return publicDownloadUrl(bucket.name, path);
  }
}

export const structuredLogger: NarrationLogger = {
  info(event, details) { console.info(JSON.stringify({ event, ...details })); },
  error(event, details) { console.error(JSON.stringify({ event, ...details })); }
};
