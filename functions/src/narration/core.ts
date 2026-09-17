import { createHash } from 'node:crypto';

export const DEFAULT_NARRATION_CONFIG = {
  language: 'he-IL',
  voice: 'he-IL-Chirp3-HD-Aoede',
  speakingRate: 0.92,
  audioFormat: 'mp3' as const,
  version: 1
};

export const MAX_TTS_INPUT_BYTES = 4_500;

export interface NarrationConfig {
  language: string;
  voice: string;
  speakingRate: number;
  audioFormat: 'mp3';
  version: number;
  revision?: string;
}

export interface NarrationRequest extends Partial<NarrationConfig> {
  text: string;
  force?: boolean;
  requestId?: string;
}

export interface NarrationAsset {
  assetKey: string;
  sourceText: string;
  normalizedText: string;
  language: string;
  voice: string;
  speakingRate: number;
  audioFormat: 'mp3';
  version: number;
  revision?: string;
  storagePath: string;
  audioUrl: string;
  status: 'generating' | 'ready' | 'failed';
  cached: boolean;
  checksum?: string;
  byteLength?: number;
  retryCount?: number;
  errorCode?: string;
  leaseOwner?: string;
  leaseExpiresAtMs?: number;
  generationSequence?: number;
}

export class NarrationValidationError extends Error {
  constructor(public readonly code: 'EMPTY_TEXT' | 'INVALID_CONFIG' | 'TEXT_TOO_LARGE', message: string) {
    super(message);
    this.name = 'NarrationValidationError';
  }
}

export function normalizeHebrewNarration(input: string): string {
  return input
    .normalize('NFC')
    // The visual brand spelling is ידע׳לה; niqqud makes its owner-approved
    // pronunciation (יֶדַע, לֶה) explicit as two spoken words for Hebrew voices.
    .replace(/ידע[׳']לה/gu, "יֶדַע, לֶה")
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[{}[\]<>]/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=[^\s\n])/g, '$1 ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveNarrationConfig(request: NarrationRequest): NarrationConfig {
  const config: NarrationConfig = {
    language: request.language ?? DEFAULT_NARRATION_CONFIG.language,
    voice: request.voice ?? DEFAULT_NARRATION_CONFIG.voice,
    speakingRate: request.speakingRate ?? DEFAULT_NARRATION_CONFIG.speakingRate,
    audioFormat: request.audioFormat ?? DEFAULT_NARRATION_CONFIG.audioFormat,
    version: request.version ?? DEFAULT_NARRATION_CONFIG.version,
    ...(request.revision ? { revision: request.revision } : {})
  };
  if (!config.language || !config.voice || config.audioFormat !== 'mp3') {
    throw new NarrationValidationError('INVALID_CONFIG', 'Narration language, voice and MP3 format are required.');
  }
  if (!Number.isFinite(config.speakingRate) || config.speakingRate < 0.25 || config.speakingRate > 2) {
    throw new NarrationValidationError('INVALID_CONFIG', 'Speaking rate must be between 0.25 and 2.');
  }
  if (!Number.isInteger(config.version) || config.version < 1) {
    throw new NarrationValidationError('INVALID_CONFIG', 'Narration version must be a positive integer.');
  }
  if (request.force && !config.revision) {
    throw new NarrationValidationError('INVALID_CONFIG', 'Forced regeneration requires an immutable revision.');
  }
  return config;
}

export function validateNarrationText(text: string): string {
  const normalized = normalizeHebrewNarration(text);
  if (!normalized) throw new NarrationValidationError('EMPTY_TEXT', 'Narration text is empty after normalization.');
  if (Buffer.byteLength(normalized, 'utf8') > MAX_TTS_INPUT_BYTES) {
    throw new NarrationValidationError('TEXT_TOO_LARGE', `Narration exceeds ${MAX_TTS_INPUT_BYTES} UTF-8 bytes.`);
  }
  return normalized;
}

export function createNarrationAssetKey(normalizedText: string, config: NarrationConfig): string {
  const canonical = JSON.stringify({
    normalizedText,
    language: config.language,
    voice: config.voice,
    speakingRate: Number(config.speakingRate.toFixed(3)),
    audioFormat: config.audioFormat,
    version: config.version,
    revision: config.revision ?? null
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function narrationStoragePath(assetKey: string, config: NarrationConfig): string {
  const safeLanguage = config.language.replace(/[^A-Za-z0-9._-]/g, '_');
  const safeVoice = config.voice.replace(/[^A-Za-z0-9._-]/g, '_');
  return `narration/${safeLanguage}/${safeVoice}/${assetKey}.mp3`;
}

export function checksumAudio(audio: Uint8Array): string {
  return createHash('sha256').update(audio).digest('hex');
}

function splitOversizedToken(token: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const character of token) {
    if (Buffer.byteLength(current + character, 'utf8') > maxBytes) {
      if (current) chunks.push(current);
      current = character;
    } else current += character;
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Splits future long-form narration without cutting a Unicode code point or ordinary word. */
export function splitNarrationText(input: string, maxBytes = MAX_TTS_INPUT_BYTES): string[] {
  const normalized = normalizeHebrewNarration(input);
  if (!normalized) return [];
  if (Buffer.byteLength(normalized, 'utf8') <= maxBytes) return [normalized];

  const sentences = normalized.split(/(?<=[.!?])\s+/u);
  const chunks: string[] = [];
  let current = '';
  const push = () => {
    if (current) chunks.push(current.trim());
    current = '';
  };
  for (const sentence of sentences) {
    if (Buffer.byteLength(sentence, 'utf8') > maxBytes) {
      push();
      let wordChunk = '';
      for (const word of sentence.split(/\s+/u)) {
        if (Buffer.byteLength(word, 'utf8') > maxBytes) {
          if (wordChunk) chunks.push(wordChunk);
          chunks.push(...splitOversizedToken(word, maxBytes));
          wordChunk = '';
        } else if (Buffer.byteLength(`${wordChunk}${wordChunk ? ' ' : ''}${word}`, 'utf8') > maxBytes) {
          chunks.push(wordChunk);
          wordChunk = word;
        } else wordChunk += `${wordChunk ? ' ' : ''}${word}`;
      }
      if (wordChunk) chunks.push(wordChunk);
      continue;
    }
    const candidate = `${current}${current ? ' ' : ''}${sentence}`;
    if (Buffer.byteLength(candidate, 'utf8') > maxBytes) push();
    current += `${current ? ' ' : ''}${sentence}`;
  }
  push();
  return chunks;
}
