import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Conservative accounting: reserve every submitted attempt, even if its outcome
// is unknown. Do not rely on free-tier credits or refund failed requests.
const MICROS_PER_CHARACTER = 30;
export class NarrationBudget {
  private reservedMicros = 0;
  private readonly limitMicros: number;
  constructor(private readonly path: string, private readonly approvalId: string, maxUsd: number) {
    if (!Number.isFinite(maxUsd) || maxUsd <= 0) throw new Error('A positive --max-usd is required for paid generation.');
    this.limitMicros = Math.floor(maxUsd * 1_000_000);
    if (existsSync(path)) for (const line of readFileSync(path, 'utf8').split('\n').filter(Boolean)) {
      const entry = JSON.parse(line);
      if (entry.approvalId !== approvalId || !Number.isSafeInteger(entry.characters) || entry.characters < 0) {
        throw new Error('Budget ledger does not match this recording request.');
      }
      this.reservedMicros += entry.characters * MICROS_PER_CHARACTER;
    }
    this.check(0);
  }
  get estimatedUsdReserved() { return this.reservedMicros / 1_000_000; }
  check(characters: number) {
    if (!Number.isSafeInteger(characters) || characters < 0) throw new Error('Invalid character count.');
    const proposed = this.reservedMicros + characters * MICROS_PER_CHARACTER;
    if (proposed > this.limitMicros) {
      throw new Error(`BUDGET_LIMIT: estimated USD ${(proposed / 1_000_000).toFixed(6)} exceeds approved USD ${(this.limitMicros / 1_000_000).toFixed(6)}. Stopped before sending the request.`);
    }
  }
  reserve(assetKey: string, characters: number) {
    this.check(characters);
    mkdirSync(dirname(this.path), { recursive: true });
    appendFileSync(this.path, JSON.stringify({ approvalId: this.approvalId, assetKey, characters, reservedAt: new Date().toISOString() }) + '\n', { flush: true });
    this.reservedMicros += characters * MICROS_PER_CHARACTER;
  }
}
