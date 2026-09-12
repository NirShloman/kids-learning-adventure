import { describe, expect, it, vi } from 'vitest';
import type { NarrationAsset } from '../../functions/src/narration/core';
import { NarrationService, type NarrationRepository } from '../../functions/src/narration/narration-service';

class PipelineRepository implements NarrationRepository {
  assets = new Map<string, NarrationAsset>();
  usageEvents = new Set<string>();
  usage = { charactersSent: 0, requests: 0, cacheHits: 0, failedRequests: 0 };
  async get(key: string) { return this.assets.get(key) ?? null; }
  async acquireLease(asset: NarrationAsset, owner: string, now: number, leaseMs: number) {
    const current = this.assets.get(asset.assetKey);
    if (current?.status === 'ready') return { outcome: 'ready' as const, asset: current };
    const leased = { ...asset, leaseOwner: owner, leaseExpiresAtMs: now + leaseMs };
    this.assets.set(asset.assetKey, leased);
    return { outcome: 'acquired' as const, asset: leased };
  }
  async complete(key: string, _owner: string, result: Partial<NarrationAsset>) {
    const ready = { ...this.assets.get(key)!, ...result, status: 'ready' as const };
    this.assets.set(key, ready);
    return ready;
  }
  async fail(key: string, _owner: string, errorCode: string, retryCount: number) {
    this.assets.set(key, { ...this.assets.get(key)!, status: 'failed', errorCode, retryCount });
  }
  async recordUsage(eventId: string, deltas: Partial<typeof this.usage>) {
    if (this.usageEvents.has(eventId)) return;
    this.usageEvents.add(eventId);
    for (const key of Object.keys(this.usage) as Array<keyof typeof this.usage>) this.usage[key] += deltas[key] ?? 0;
  }
}

describe('narration generation pipeline', () => {
  it('generates one immutable MP3 for two bindings with the same text and a new asset after text changes', async () => {
    const repository = new PipelineRepository();
    const google = { synthesize: vi.fn(async () => Uint8Array.from([0x49, 0x44, 0x33, 4, 5, 6])) };
    const uploaded = new Map<string, { audio: Uint8Array; metadata: Record<string, string> }>();
    const storage = { put: vi.fn(async (path: string, audio: Uint8Array, metadata: Record<string, string>) => {
      uploaded.set(path, { audio, metadata });
      return `https://firebasestorage.example/${encodeURIComponent(path)}`;
    }) };
    const service = new NarrationService(repository, google, storage,
      { info: vi.fn(), error: vi.fn() }, { generationEnabled: true });

    const firstQuestion = await service.generateOrGet({ text: 'איזו חיה עושה מו?', requestId: 'question-a' });
    const secondQuestion = await service.generateOrGet({ text: 'איזו חיה עושה מו?', requestId: 'question-b' });
    const editedQuestion = await service.generateOrGet({ text: 'איזו חיה עושה הב הב?', requestId: 'question-a-edited' });

    expect(firstQuestion.audioUrl).toContain('firebasestorage');
    expect(secondQuestion.assetKey).toBe(firstQuestion.assetKey);
    expect(secondQuestion.cached).toBe(true);
    expect(editedQuestion.assetKey).not.toBe(firstQuestion.assetKey);
    expect(google.synthesize).toHaveBeenCalledTimes(2);
    expect(uploaded.size).toBe(2);
    expect([...uploaded.values()][0]?.metadata).toMatchObject({ language: 'he-IL', ttsVersion: '1' });
    expect(repository.usage.requests).toBe(2);
    expect(repository.usage.cacheHits).toBe(1);
  });
});
