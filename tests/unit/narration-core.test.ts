import { describe, expect, it } from 'vitest';
import {
  createNarrationAssetKey,
  normalizeHebrewNarration,
  resolveNarrationConfig,
  splitNarrationText,
  validateNarrationText
} from '../../functions/src/narration/core';
import { narrationBindingInputFingerprint } from '../../functions/src/narration/binding-input';
import { brand } from '../../src/config/brand';
import { toNarrationText } from '../../src/utils/narrationText';

describe('Hebrew narration core', () => {
  it('keeps Olamia display, catalog, backend and vocalized lookup in agreement', () => {
    for (const input of ['ברוכים הבאים לעולמיה!', 'ברוכים הבאים לOlamia!', 'ברוכים הבאים לעוֹלָמִיָּה!']) {
      const expected = `ברוכים הבאים ל${brand.pronunciation}!`.normalize('NFC');
      expect(normalizeHebrewNarration(input)).toBe(expected);
      expect(normalizeHebrewNarration(toNarrationText(input))).toBe(expected);
      expect(toNarrationText(toNarrationText(input))).toBe(toNarrationText(input));
    }
  });
  it('normalizes technical noise without changing Hebrew, niqqud, numbers or mixed text', () => {
    expect(normalizeHebrewNarration('  שָׁלוֹם  ,  Google 3!\n\nמה נשמע? ')).toBe('שָׁלוֹם, Google 3! מה נשמע?');
    expect(normalizeHebrewNarration('<b>שלושה</b>\u200B תפוחים')).toBe('שלושה תפוחים');
    expect(normalizeHebrewNarration('מתחילים לשחק עם עולמיה.')).toBe('מתחילים לשחק עם עוֹלָמִיָּה.');
  });

  it('creates deterministic keys and changes them for every synthesis input', () => {
    const base = resolveNarrationConfig({ text: 'שלום' });
    const key = createNarrationAssetKey(validateNarrationText('שלום'), base);
    expect(createNarrationAssetKey(validateNarrationText('שלום'), base)).toBe(key);
    expect(createNarrationAssetKey(validateNarrationText('שלום!'), base)).not.toBe(key);
    expect(createNarrationAssetKey('שלום', { ...base, voice: 'he-IL-Chirp3-HD-Leda' })).not.toBe(key);
    expect(createNarrationAssetKey('שלום', { ...base, speakingRate: 0.9 })).not.toBe(key);
    expect(createNarrationAssetKey('שלום', { ...base, version: 2 })).not.toBe(key);
    expect(createNarrationAssetKey('שלום', { ...base, revision: 'review-2' })).not.toBe(key);
  });

  it('splits long narration on sentence or word boundaries within the byte limit', () => {
    const chunks = splitNarrationText('משפט ראשון. משפט שני ארוך יותר! משפט שלישי?', 40);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => Buffer.byteLength(chunk, 'utf8') <= 40)).toBe(true);
    expect(chunks.join(' ')).toBe('משפט ראשון. משפט שני ארוך יותר! משפט שלישי?');
  });

  it('does not retrigger when only generated output fields change', () => {
    const before = { sourceText: 'שלום', voice: 'voice-a', version: 1, status: 'pending' };
    const after = { ...before, status: 'ready', assetKey: 'hash', audioUrl: 'https://example.test/audio.mp3' };
    expect(narrationBindingInputFingerprint(after)).toBe(narrationBindingInputFingerprint(before));
    expect(narrationBindingInputFingerprint({ ...after, sourceText: 'שלום!' })).not.toBe(narrationBindingInputFingerprint(before));
  });
});
