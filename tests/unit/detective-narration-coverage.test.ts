import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { narrationEntryForText } from '../../src/assets/narrationManifest';

it('packages every prompt, hint, explanation and visible card label used by detective activities', () => {
  const texts = new Set<string>();
  for (const game of ['letters', 'numbers', 'shapes', 'colors', 'patterns', 'sorting', 'matching', 'memory']) {
    for (const item of JSON.parse(readFileSync(`src/content/${game}.json`, 'utf8')).items) {
      for (const text of [item.prompt, item.hint, item.explanation, item.leftVisual?.label, item.rightVisual?.label, ...(item.options ?? []).map((option: any) => option.label)]) {
        if (text) texts.add(text);
      }
      expect(item.explanation).not.toMatch(/(?:^|\D)1 פריטים/);
    }
  }
  for (const text of texts) expect(narrationEntryForText(text).recordedPath, text).toMatch(/^\/assets\/audio\/narration\//);
});

it('packages the shared completion narration for adaptive and two-pair rounds too', () => {
  const source = readFileSync('src/pages/SummaryPage.tsx', 'utf8');
  const completion = source.match(/speak\('([^']+)'\)/)?.[1];
  expect(completion).toBeTruthy();
  expect(narrationEntryForText(completion!).recordedPath).toMatch(/^\/assets\/audio\/narration\//);
});
