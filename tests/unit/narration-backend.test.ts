import { describe, expect, it, vi } from 'vitest';
import type { NarrationAsset } from '../../functions/src/narration/core';
import {
  NarrationService,
  type NarrationLogger,
  type NarrationRepository
} from '../../functions/src/narration/narration-service';

class MemoryRepository implements NarrationRepository {
  assets = new Map<string, NarrationAsset>();
  usage: Array<Record<string, number | undefined>> = [];
  failed = false;

  async get(key: string) { return this.assets.get(key) ?? null; }
  async acquireLease(asset: NarrationAsset, owner: string, now: number, leaseMs: number) {
    const existing = this.assets.get(asset.assetKey);
    if (existing?.status === 'ready') return { outcome: 'ready' as const, asset: existing };
    if (existing?.status === 'generating' && (existing.leaseExpiresAtMs ?? 0) > now) return { outcome: 'busy' as const, asset: existing };
    const leased = { ...asset, leaseOwner: owner, leaseExpiresAtMs: now + leaseMs };
    this.assets.set(asset.assetKey, leased);
    return { outcome: 'acquired' as const, asset: leased };
  }
  async complete(key: string, owner: string, result: Partial<NarrationAsset>) {
    const current = this.assets.get(key)!;
    if (current.leaseOwner !== owner) throw new Error('lease lost');
    const ready = { ...current, ...result, status: 'ready' as const };
    this.assets.set(key, ready);
    return ready;
  }
  async fail(key: string, _owner: string, errorCode: string, retryCount: number) {
    this.failed = true;
    this.assets.set(key, { ...this.assets.get(key)!, status: 'failed', errorCode, retryCount });
  }
  async recordUsage(_eventId: string, deltas: Record<string, number | undefined>) { this.usage.push(deltas); }
}

const logger: NarrationLogger = { info: vi.fn(), error: vi.fn() };

describe('server NarrationService', () => {
  it('synthesizes once, uploads MP3 metadata, and then returns a cache hit', async () => {
    const repository = new MemoryRepository();
    const synthesize = vi.fn(async () => Uint8Array.from([0x49, 0x44, 0x33, 1, 2, 3]));
    const put = vi.fn(async () => 'https://storage.example/audio.mp3');
    const service = new NarrationService(repository, { synthesize }, { put }, logger, { generationEnabled: true });
    const first = await service.generateOrGet({ text: 'כל הכבוד!', requestId: 'first' });
    const second = await service.generateOrGet({ text: 'כל הכבוד!', requestId: 'second' });
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.assetKey).toBe(first.assetKey);
    expect(synthesize).toHaveBeenCalledOnce();
    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^narration\/he-IL\/.+\.mp3$/), expect.any(Uint8Array), expect.objectContaining({
      language: 'he-IL', ttsVersion: '1'
    }));
    expect(repository.usage.some((usage) => usage.cacheHits === 1)).toBe(true);
  });

  it('marks failed generation and does not leave a permanent generating state', async () => {
    const repository = new MemoryRepository();
    const failure = Object.assign(new Error('bad credentials'), { code: 'UNAUTHENTICATED' });
    const service = new NarrationService(repository, { synthesize: vi.fn(async () => { throw failure; }) },
      { put: vi.fn() }, logger, { generationEnabled: true, maxAttempts: 3 });
    await expect(service.generateOrGet({ text: 'שלום', requestId: 'failed' })).rejects.toThrow('bad credentials');
    expect(repository.failed).toBe(true);
    expect([...repository.assets.values()][0]?.status).toBe('failed');
  });

  it('recovers an expired generation lease', async () => {
    const repository = new MemoryRepository();
    const service = new NarrationService(repository, { synthesize: vi.fn(async () => Uint8Array.from([1])) },
      { put: vi.fn(async () => 'https://storage.example/new.mp3') }, logger, { generationEnabled: true, leaseMs: 10 });
    const first = await service.generateOrGet({ text: 'נעילה ישנה', requestId: 'seed' });
    repository.assets.set(first.assetKey, { ...first, status: 'generating', leaseOwner: 'dead', leaseExpiresAtMs: Date.now() - 1 });
    const recovered = await service.generateOrGet({ text: 'נעילה ישנה', requestId: 'recover' });
    expect(recovered.status).toBe('ready');
    expect(recovered.cached).toBe(false);
  });
});
