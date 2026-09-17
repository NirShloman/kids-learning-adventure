import { narrationEntryForText, type NarrationEntry } from '../assets/narrationManifest';
import { speakHebrew, stopSpeaking, type SpeakOptions } from './speechService';
import { toNarrationText } from '../utils/narrationText';

export interface NarrationPlaybackOptions extends SpeakOptions {
  slow?: boolean;
}

type PlaybackListener = (playing: boolean) => void;

let activeRecording: HTMLAudioElement | null = null;
let playbackGeneration = 0;
let activeRequest: { entry: NarrationEntry; options: NarrationPlaybackOptions } | null = null;
let activeText = '';
let pendingGuided: { text: string; options: NarrationPlaybackOptions } | null = null;
let narrationVolume = 0.8;
let slowNarration = false;
let playing = false;
const recordedCache = new Map<string, HTMLAudioElement>();
const listeners = new Set<PlaybackListener>();

function notify(event: 'start' | 'end'): void {
  playing = event === 'start';
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(`lomdim:speech-${event}`));
  listeners.forEach((listener) => listener(playing));
}

function playPendingGuided(): void {
  const pending = pendingGuided;
  pendingGuided = null;
  if (pending) playNarrationText(pending.text, pending.options);
}

function fallback(entry: NarrationEntry, options: NarrationPlaybackOptions): void {
  if (activeRecording) {
    activeRecording.onplay = null;
    activeRecording.onended = null;
    activeRecording.onerror = null;
    activeRecording.pause();
  }
  activeRecording = null;
  activeRequest = null;
  activeText = '';
  if (playing) notify('end');
  speakHebrew(toNarrationText(entry.text), options);
}

function startRecording(audio: HTMLAudioElement, entry: NarrationEntry, options: NarrationPlaybackOptions): void {
  const generation = ++playbackGeneration;
  const isCurrent = () => generation === playbackGeneration && activeRecording === audio;
  activeRequest = { entry, options };
  audio.onplay = () => { if (isCurrent()) notify('start'); };
  audio.onended = () => {
    if (!isCurrent()) return;
    activeRecording = null;
    activeRequest = null;
    activeText = '';
    notify('end');
    playPendingGuided();
  };
  audio.onerror = () => { if (isCurrent()) fallback(entry, options); };
  // pause() rejects a still-pending play() promise asynchronously. A stale
  // rejection must never clear the new recording or start a competing voice.
  void audio.play().catch(() => { if (isCurrent()) fallback(entry, options); });
}

export function configureNarrationPreferences(volume: number, slow: boolean): void {
  narrationVolume = Math.max(0, Math.min(1, volume));
  slowNarration = slow;
  if (activeRecording) activeRecording.volume = narrationVolume;
}

export function playNarration(entry: NarrationEntry, options: NarrationPlaybackOptions = {}): void {
  const mode = options.mode ?? 'manual';
  if (activeRecording && mode === 'hint') return;
  if (activeRecording && mode === 'guided') {
    pendingGuided = { text: entry.text, options };
    return;
  }
  stopNarrationPlayback();
  if (!entry.recordedPath || typeof Audio === 'undefined') {
    if (typeof console !== 'undefined') console.warn('NARRATION_ASSET_MISSING', { textLength: entry.text.length });
    fallback(entry, options);
    return;
  }

  const audio = recordedCache.get(entry.recordedPath) ?? new Audio(entry.recordedPath);
  recordedCache.set(entry.recordedPath, audio);
  activeRecording = audio;
  activeText = entry.text;
  audio.currentTime = 0;
  audio.volume = narrationVolume;
  audio.playbackRate = options.slow || slowNarration ? 0.8 : 1;
  if ('preservesPitch' in audio) audio.preservesPitch = true;
  startRecording(audio, entry, options);
}

export function playNarrationText(text: string, options: NarrationPlaybackOptions = {}): void {
  playNarration(narrationEntryForText(text), options);
}

export function playNarrationUrl(url: string, text = '', options: NarrationPlaybackOptions = {}): void {
  playNarration({ id: `url.${url}`, text, category: 'content', priority: 'required', recordedPath: url }, options);
}

export function preloadNarration(entries: NarrationEntry[]): void {
  if (typeof Audio === 'undefined') return;
  for (const entry of entries) {
    if (!entry.recordedPath || recordedCache.has(entry.recordedPath)) continue;
    const audio = new Audio(entry.recordedPath);
    audio.preload = 'auto';
    recordedCache.set(entry.recordedPath, audio);
    audio.load();
  }
}

export function preloadNarrationTexts(texts: string[]): void {
  preloadNarration([...new Set(texts)].map((text) => narrationEntryForText(text)));
}

export function preloadNarrationUrls(urls: string[]): void {
  preloadNarration([...new Set(urls)].map((url) => ({
    id: `url.${url}`,
    text: '',
    category: 'content',
    priority: 'required',
    recordedPath: url
  })));
}

export function pauseNarration(): void {
  if (!activeRecording) return;
  playbackGeneration += 1;
  activeRecording.pause();
  if (playing) notify('end');
}

export function resumeNarration(): void {
  if (!activeRecording || !activeRequest) return;
  startRecording(activeRecording, activeRequest.entry, activeRequest.options);
}

export function stopNarrationPlayback(): void {
  playbackGeneration += 1;
  pendingGuided = null;
  if (activeRecording) {
    activeRecording.onplay = null;
    activeRecording.onended = null;
    activeRecording.onerror = null;
    activeRecording.pause();
    activeRecording.currentTime = 0;
    activeRecording = null;
    activeText = '';
    if (playing) notify('end');
  }
  activeRequest = null;
  stopSpeaking();
}

export function setNarrationVolume(volume: number): void {
  configureNarrationPreferences(volume, slowNarration);
}

export function isNarrationPlaying(): boolean {
  return playing;
}

export function getActiveNarrationText(): string {
  return activeText;
}

export function subscribeToNarration(listener: PlaybackListener): () => void {
  listeners.add(listener);
  listener(playing);
  return () => listeners.delete(listener);
}

export const narrationAudioService = {
  play: playNarrationUrl,
  playNarration,
  playText: playNarrationText,
  stop: stopNarrationPlayback,
  pause: pauseNarration,
  resume: resumeNarration,
  preload: preloadNarrationUrls,
  preloadTexts: preloadNarrationTexts,
  isPlaying: isNarrationPlaying,
  setVolume: setNarrationVolume,
  subscribe: subscribeToNarration
};
