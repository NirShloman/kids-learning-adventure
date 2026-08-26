import type { NarrationEntry } from '../assets/narrationManifest';
import { speakHebrew, stopSpeaking } from './speechService';

let activeRecording: HTMLAudioElement | null = null;
const recordedCache = new Map<string, HTMLAudioElement>();

function notify(event: 'start' | 'end') {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(`lomdim:speech-${event}`));
}

export function playNarration(entry: NarrationEntry, options: { slow?: boolean } = {}): void {
  stopNarrationPlayback();
  if (!entry.recordedPath || typeof Audio === 'undefined') {
    speakHebrew(entry.text, { mode: 'manual', slow: options.slow });
    return;
  }
  const audio = recordedCache.get(entry.id) ?? new Audio(entry.recordedPath);
  recordedCache.set(entry.id, audio);
  activeRecording = audio;
  audio.playbackRate = options.slow ? 0.8 : 1;
  audio.onplay = () => notify('start');
  audio.onended = () => { activeRecording = null; notify('end'); };
  audio.onerror = () => { activeRecording = null; notify('end'); speakHebrew(entry.text, { mode: 'manual', slow: options.slow }); };
  void audio.play().catch(() => speakHebrew(entry.text, { mode: 'manual', slow: options.slow }));
}

export function preloadNarration(entries: NarrationEntry[]): void {
  if (typeof Audio === 'undefined') return;
  for (const entry of entries) if (entry.recordedPath && !recordedCache.has(entry.id)) {
    const audio = new Audio(entry.recordedPath); audio.preload = 'metadata'; recordedCache.set(entry.id, audio); audio.load();
  }
}

export function stopNarrationPlayback(): void {
  if (activeRecording) { activeRecording.pause(); activeRecording.currentTime = 0; activeRecording = null; notify('end'); }
  stopSpeaking();
}
