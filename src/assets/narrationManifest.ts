import generatedManifestJson from './generatedNarrationManifest.json';
import { toNarrationText } from '../utils/narrationText';

export type NarrationPriority = 'required' | 'recommended' | 'optional';
export interface NarrationEntry {
  id: string;
  text: string;
  category: 'instruction' | 'feedback' | 'content' | 'letter' | 'word' | 'sound';
  priority: NarrationPriority;
  recordedPath?: string;
  checksum?: string;
  durationMs?: number;
  assetKey?: string;
  storagePath?: string;
  audioUrl?: string;
}

interface GeneratedNarrationAsset {
  assetKey: string;
  localPath: string;
  storagePath: string;
  audioUrl: string;
  checksum: string;
  byteLength: number;
  durationMs?: number;
}

interface GeneratedNarrationManifest {
  schemaVersion: 1;
  generatedAt: string | null;
  config: {
    language: string;
    voice: string;
    speakingRate: number;
    audioFormat: 'mp3';
    version: number;
  } | null;
  entries: Record<string, GeneratedNarrationAsset>;
}

export const generatedNarrationManifest = generatedManifestJson as GeneratedNarrationManifest;

export const fixedNarrationEntries: readonly NarrationEntry[] = [
  { id: 'ui.welcome.start', text: 'מתחילים לשחק וללמוד בכיף.', category: 'instruction', priority: 'required' },
  { id: 'feedback.correct.01', text: 'כל הכבוד!', category: 'feedback', priority: 'required' },
  { id: 'feedback.correct.02', text: 'מצוין!', category: 'feedback', priority: 'required' },
  { id: 'feedback.retry.01', text: 'כמעט. ננסה שוב.', category: 'feedback', priority: 'required' },
  { id: 'instruction.repeat', text: 'נשמע שוב, לאט ובנחת.', category: 'instruction', priority: 'recommended' }
] as const;

const fixedById = new Map(fixedNarrationEntries.map((entry) => [entry.id, entry]));

export function contentNarrationEntry(contentId: string, text: string): NarrationEntry {
  return withGeneratedAsset({ id: `content.${contentId}`, text, category: 'content', priority: 'required' });
}

export function getNarrationEntry(id: string): NarrationEntry | undefined {
  const entry = fixedById.get(id);
  return entry ? withGeneratedAsset(entry) : undefined;
}

export function narrationEntryForText(text: string, id = 'runtime.text'): NarrationEntry {
  return withGeneratedAsset({ id, text, category: 'content', priority: 'required' });
}

export function narrationAssetForText(text: string): GeneratedNarrationAsset | undefined {
  return generatedNarrationManifest.entries[normalizeNarrationLookupText(text)];
}

function normalizeNarrationLookupText(text: string): string {
  return toNarrationText(text).normalize('NFC')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[{}[\]<>]/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=[^\s\n])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

function withGeneratedAsset(entry: NarrationEntry): NarrationEntry {
  const generated = narrationAssetForText(entry.text);
  if (!generated) return entry;
  return {
    ...entry,
    recordedPath: generated.localPath,
    checksum: generated.checksum,
    durationMs: generated.durationMs,
    assetKey: generated.assetKey,
    storagePath: generated.storagePath,
    audioUrl: generated.audioUrl
  };
}
