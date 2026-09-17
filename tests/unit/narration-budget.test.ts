import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NarrationBudget } from '../../scripts/narration-budget.mts';
import { GoogleTextToSpeechGateway } from '../../functions/src/narration/firebase-adapters';
import { DEFAULT_NARRATION_CONFIG } from '../../functions/src/narration/core';

let directory: string;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'detective-budget-')); });
afterEach(() => {
  const target = resolve(directory);
  if (!target.startsWith(resolve(tmpdir()) + sep + 'detective-budget-')) throw new Error('Unexpected temporary test path');
  rmSync(target, { recursive: true, force: true });
});

it('stops the full batch before spending when the exact estimate exceeds the approved cap', () => {
  const budget = new NarrationBudget(join(directory, 'budget.jsonl'), 'approval', 0.90);
  expect(() => budget.check(30063)).toThrow('BUDGET_LIMIT');
  expect(budget.estimatedUsdReserved).toBe(0);
  expect(() => budget.check(30000)).not.toThrow();
});
it('counts retries and reloads without resetting spent reservations', () => {
  const path = join(directory, 'budget.jsonl');
  const first = new NarrationBudget(path, 'approval', 0.003);
  first.reserve('first-attempt', 40);
  first.reserve('uncertain-retry', 40);
  const resumed = new NarrationBudget(path, 'approval', 0.003);
  expect(() => resumed.reserve('over-budget', 21)).toThrow('BUDGET_LIMIT');
  resumed.reserve('within-budget', 20);
  expect(resumed.estimatedUsdReserved).toBe(0.003);
  expect(readFileSync(path, 'utf8').trim().split('\n')).toHaveLength(3);
  expect(() => new NarrationBudget(path, 'another-approval', 1)).toThrow('does not match');
});
it('rejects missing and invalid spending limits', () => {
  for (const value of [NaN, Infinity, 0, -1]) expect(() => new NarrationBudget(join(directory, 'budget.jsonl'), 'approval', value)).toThrow('positive --max-usd');
});
it('disables unmetered SDK retries for the budgeted recording tool', async () => {
  const synthesizeSpeech = vi.fn().mockResolvedValue([{ audioContent: Buffer.from('audio') }]);
  const gateway = new GoogleTextToSpeechGateway({ synthesizeSpeech } as any, true);
  await gateway.synthesize('שלום', DEFAULT_NARRATION_CONFIG);
  expect(synthesizeSpeech).toHaveBeenCalledWith(expect.any(Object), { retry: { retryCodes: [] }, timeout: 60_000 });
});
