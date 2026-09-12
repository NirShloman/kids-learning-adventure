import { randomUUID } from 'node:crypto';
import {
  checksumAudio,
  createNarrationAssetKey,
  narrationStoragePath,
  resolveNarrationConfig,
  splitNarrationText,
  validateNarrationText,
  type NarrationAsset,
  type NarrationConfig,
  type NarrationRequest
} from './core.js';

export type LeaseResult = { outcome: 'acquired' | 'ready' | 'busy'; asset: NarrationAsset };

export interface NarrationRepository {
  get(assetKey: string): Promise<NarrationAsset | null>;
  acquireLease(asset: NarrationAsset, leaseOwner: string, nowMs: number, leaseMs: number): Promise<LeaseResult>;
  complete(assetKey: string, leaseOwner: string, result: Partial<NarrationAsset>): Promise<NarrationAsset>;
  fail(assetKey: string, leaseOwner: string, errorCode: string, retryCount: number): Promise<void>;
  recordUsage(eventId: string, deltas: { charactersSent?: number; requests?: number; cacheHits?: number; failedRequests?: number }): Promise<void>;
}

export interface TextToSpeechGateway {
  synthesize(text: string, config: NarrationConfig): Promise<Uint8Array>;
}

export interface NarrationStorageGateway {
  put(path: string, audio: Uint8Array, metadata: Record<string, string>): Promise<string>;
}

export interface NarrationLogger {
  info(event: string, details: Record<string, unknown>): void;
  error(event: string, details: Record<string, unknown>): void;
}

export interface NarrationServiceOptions {
  generationEnabled: boolean;
  leaseMs?: number;
  maxAttempts?: number;
  waitAttempts?: number;
  waitMs?: number;
}

export class NarrationGenerationDisabledError extends Error {
  constructor() {
    super('Narration generation is disabled; an existing ready asset was not found.');
    this.name = 'NarrationGenerationDisabledError';
  }
}

function safeErrorCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: string | number; name?: string };
    if (candidate.code !== undefined) return String(candidate.code).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
    if (candidate.name) return candidate.name.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
  }
  return 'UNKNOWN';
}

function isTransient(error: unknown): boolean {
  const code = error && typeof error === 'object' ? String((error as { code?: unknown }).code ?? '') : '';
  return ['4', '8', '10', '13', '14', '429', '500', '502', '503', '504',
    'DEADLINE_EXCEEDED', 'RESOURCE_EXHAUSTED', 'ABORTED', 'INTERNAL', 'UNAVAILABLE'].includes(code);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class NarrationService {
  private readonly leaseMs: number;
  private readonly maxAttempts: number;
  private readonly waitAttempts: number;
  private readonly waitMs: number;

  constructor(
    private readonly repository: NarrationRepository,
    private readonly tts: TextToSpeechGateway,
    private readonly storage: NarrationStorageGateway,
    private readonly logger: NarrationLogger,
    private readonly options: NarrationServiceOptions
  ) {
    this.leaseMs = options.leaseMs ?? 5 * 60_000;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.waitAttempts = options.waitAttempts ?? 8;
    this.waitMs = options.waitMs ?? 250;
  }

  async generateOrGet(request: NarrationRequest): Promise<NarrationAsset> {
    const config = resolveNarrationConfig(request);
    const normalizedText = validateNarrationText(request.text);
    const characterCount = [...normalizedText].length;
    const assetKey = createNarrationAssetKey(normalizedText, config);
    const eventId = request.requestId ?? randomUUID();
    const existing = await this.repository.get(assetKey);
    if (existing?.status === 'ready' && !request.force) {
      await this.repository.recordUsage(`${eventId}:cache`, { cacheHits: 1 });
      this.logger.info('TTS_CACHE_HIT', { assetKey, textLength: characterCount, voice: config.voice, cacheHit: true });
      return { ...existing, cached: true };
    }
    if (!this.options.generationEnabled) throw new NarrationGenerationDisabledError();

    const leaseOwner = randomUUID();
    const candidate: NarrationAsset = {
      assetKey,
      sourceText: request.text,
      normalizedText,
      ...config,
      storagePath: narrationStoragePath(assetKey, config),
      audioUrl: '',
      status: 'generating',
      cached: false
    };
    const lease = await this.repository.acquireLease(candidate, leaseOwner, Date.now(), this.leaseMs);
    if (lease.outcome === 'ready') {
      await this.repository.recordUsage(`${eventId}:cache`, { cacheHits: 1 });
      return { ...lease.asset, cached: true };
    }
    if (lease.outcome === 'busy') return this.waitForReady(assetKey, eventId);

    const startedAt = Date.now();
    this.logger.info('TTS_GENERATION_STARTED', { assetKey, textLength: characterCount, voice: config.voice, cacheHit: false });
    let retryCount = lease.asset.retryCount ?? 0;
    let ttsAttempt = 0;
    try {
      let audio: Uint8Array | null = null;
      while (!audio) {
        const attemptId = `${eventId}:request:${retryCount}`;
        await this.repository.recordUsage(attemptId, { charactersSent: characterCount, requests: 1 });
        try {
          audio = await this.tts.synthesize(normalizedText, config);
        } catch (error) {
          ttsAttempt += 1;
          retryCount += 1;
          if (!isTransient(error) || ttsAttempt >= this.maxAttempts) throw error;
          await delay(200 * (2 ** (ttsAttempt - 1)));
        }
      }
      const checksum = checksumAudio(audio);
      let uploadAttempt = 0;
      let audioUrl = '';
      while (!audioUrl) {
        try {
          audioUrl = await this.storage.put(candidate.storagePath, audio, {
            assetKey,
            language: config.language,
            voice: config.voice,
            ttsVersion: String(config.version),
            checksum
          });
        } catch (error) {
          uploadAttempt += 1;
          retryCount += 1;
          if (!isTransient(error) || uploadAttempt >= this.maxAttempts) throw error;
          await delay(200 * (2 ** (uploadAttempt - 1)));
        }
      }
      this.logger.info('TTS_UPLOAD_COMPLETED', { assetKey, voice: config.voice, byteLength: audio.byteLength });
      const ready = await this.repository.complete(assetKey, leaseOwner, {
        audioUrl,
        checksum,
        byteLength: audio.byteLength,
        retryCount,
        status: 'ready'
      });
      this.logger.info('TTS_GENERATION_COMPLETED', {
        assetKey,
        voice: config.voice,
        duration: Date.now() - startedAt,
        cacheHit: false
      });
      return { ...ready, cached: false };
    } catch (error) {
      const errorCode = safeErrorCode(error);
      await this.repository.fail(assetKey, leaseOwner, errorCode, retryCount);
      await this.repository.recordUsage(`${eventId}:failed`, { failedRequests: 1 });
      this.logger.error('TTS_GENERATION_FAILED', {
        assetKey,
        textLength: characterCount,
        voice: config.voice,
        duration: Date.now() - startedAt,
        errorCode
      });
      throw error;
    }
  }

  async generateSequence(request: NarrationRequest): Promise<NarrationAsset[]> {
    const chunks = splitNarrationText(request.text);
    if (!chunks.length) return [await this.generateOrGet(request)];
    const sequenceId = request.requestId ?? randomUUID();
    const assets: NarrationAsset[] = [];
    for (const [index, text] of chunks.entries()) {
      assets.push(await this.generateOrGet({ ...request, text, requestId: `${sequenceId}:segment:${index}` }));
    }
    return assets;
  }

  private async waitForReady(assetKey: string, eventId: string): Promise<NarrationAsset> {
    for (let attempt = 0; attempt < this.waitAttempts; attempt += 1) {
      await delay(this.waitMs * (attempt + 1));
      const asset = await this.repository.get(assetKey);
      if (asset?.status === 'ready') {
        await this.repository.recordUsage(`${eventId}:cache`, { cacheHits: 1 });
        this.logger.info('TTS_CACHE_HIT', { assetKey, voice: asset.voice, cacheHit: true, waitedForConcurrentGeneration: true });
        return { ...asset, cached: true };
      }
      if (asset?.status === 'failed') throw new Error(`Concurrent narration generation failed: ${asset.errorCode ?? 'UNKNOWN'}`);
    }
    throw new Error('Narration generation is already in progress.');
  }
}
