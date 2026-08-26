import {
  audioSource,
  musicTracks,
  type MusicTrack,
  type RecordedVoiceCue,
  type SfxCue
} from '../assets/audioManifest';

export type AudioCue = 'correct' | 'retry' | 'select' | 'match' | 'flip' | 'levelStart' | 'levelComplete';

interface AudioSettings {
  musicEnabled: boolean;
  narrationEnabled: boolean;
  soundEffectsEnabled: boolean;
  musicVolume?: number;
  soundEffectsVolume?: number;
}

interface MusicOptions {
  loop?: boolean;
  crossfadeMs?: number;
}

const MUSIC_VOLUME = 0.28;
const DUCKED_MUSIC_VOLUME = 0.09;
const DEFAULT_CROSSFADE_MS = 450;
const THROTTLE_MS: Partial<Record<SfxCue, number>> = {
  select: 90,
  characterStep1: 180,
  characterStep2: 180,
  objectNear: 900,
  countTick: 100
};

let settings: AudioSettings = {
  musicEnabled: true,
  narrationEnabled: true,
  soundEffectsEnabled: true,
  musicVolume: MUSIC_VOLUME,
  soundEffectsVolume: 0.75
};
let activeMusic: HTMLAudioElement | null = null;
let activeMusicTrack: MusicTrack | null = null;
let pendingMusic: { track: MusicTrack; options: MusicOptions } | null = null;
let hasUserActivation = false;
let isDucked = false;
const fadeTokens = new WeakMap<HTMLAudioElement, number>();
const lastPlayedAt = new Map<SfxCue, number>();
const preloadCache = new Map<string, HTMLAudioElement>();
let fallbackContext: AudioContext | null = null;

const fallbackNotes: Partial<Record<SfxCue, number[]>> = {
  correct: [523.25, 659.25, 783.99],
  retry: [392, 440],
  select: [587.33],
  match: [659.25, 880],
  flip: [493.88],
  levelStart: [440, 587.33],
  levelComplete: [523.25, 659.25, 783.99, 1046.5]
};

function canUseAudio(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

export function resolveAudioSource(relativeBase: string): string {
  return audioSource(relativeBase);
}

function createAudio(relativeBase: string, volume: number): HTMLAudioElement | null {
  if (!canUseAudio()) return null;
  const audio = new Audio(audioSource(relativeBase));
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

function fade(audio: HTMLAudioElement, target: number, durationMs: number, stopAfter = false): void {
  const token = (fadeTokens.get(audio) ?? 0) + 1;
  fadeTokens.set(audio, token);
  const startVolume = audio.volume;
  const startedAt = performance.now();
  const step = (now: number) => {
    if (token !== fadeTokens.get(audio)) return;
    const progress = Math.min(1, (now - startedAt) / Math.max(1, durationMs));
    audio.volume = Math.max(0, Math.min(1, startVolume + (target - startVolume) * progress));
    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }
    if (stopAfter) {
      audio.pause();
      audio.currentTime = 0;
    }
  };
  window.requestAnimationFrame(step);
}

function desiredMusicVolume(): number {
  const configured = settings.musicVolume ?? MUSIC_VOLUME;
  return isDucked ? Math.min(configured, DUCKED_MUSIC_VOLUME) : configured;
}

function setDucked(ducked: boolean): void {
  isDucked = ducked;
  if (activeMusic && settings.musicEnabled) fade(activeMusic, desiredMusicVolume(), 180);
}

function markUserActivation(): void {
  hasUserActivation = true;
  if (pendingMusic) {
    const { track, options } = pendingMusic;
    pendingMusic = null;
    playMusic(track, options);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', markUserActivation, { once: true, capture: true });
  window.addEventListener('keydown', markUserActivation, { once: true, capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!activeMusic) return;
    if (document.hidden) {
      activeMusic.pause();
    } else if (settings.musicEnabled && hasUserActivation) {
      void activeMusic.play().catch(() => undefined);
    }
  });
  window.addEventListener('lomdim:speech-start', () => setDucked(true));
  window.addEventListener('lomdim:speech-end', () => setDucked(false));
  window.addEventListener('lomdim:app-state', ((event: CustomEvent<{ isActive: boolean }>) => {
    if (!activeMusic) return;
    if (!event.detail.isActive) activeMusic.pause();
    else if (settings.musicEnabled && hasUserActivation) void activeMusic.play().catch(() => undefined);
  }) as EventListener);
}

export function configureAudio(next: AudioSettings): void {
  const previous = settings;
  settings = next;
  if (previous.musicEnabled && !next.musicEnabled) stopMusic(250);
  if (!previous.musicEnabled && next.musicEnabled && activeMusicTrack) {
    playMusic(activeMusicTrack);
  }
  if (previous.narrationEnabled && !next.narrationEnabled) stopNarration();
}

/** Compatibility wrapper retained for existing callers. */
export function configureSoundEffects(enabled: boolean): void {
  configureAudio({ ...settings, soundEffectsEnabled: enabled });
}

export function playMusic(track: MusicTrack, options: MusicOptions = {}): void {
  activeMusicTrack = track;
  if (!settings.musicEnabled || !canUseAudio()) return;
  if (!hasUserActivation) {
    pendingMusic = { track, options };
    return;
  }
  if (activeMusic?.dataset.track === track && !activeMusic.paused) return;

  const next = createAudio(musicTracks[track], 0);
  if (!next) return;
  next.dataset.track = track;
  next.loop = options.loop ?? (track !== 'mainTheme' && track !== 'mainThemeShort');
  const previous = activeMusic;
  activeMusic = next;
  void next.play()
    .then(() => fade(next, desiredMusicVolume(), options.crossfadeMs ?? DEFAULT_CROSSFADE_MS))
    .catch(() => {
      if (activeMusic === next) activeMusic = previous;
    });
  if (previous) fade(previous, 0, options.crossfadeMs ?? DEFAULT_CROSSFADE_MS, true);
}

export function stopMusic(fadeMs = DEFAULT_CROSSFADE_MS): void {
  pendingMusic = null;
  if (!activeMusic) return;
  const previous = activeMusic;
  activeMusic = null;
  fade(previous, 0, fadeMs, true);
}

function playSyntheticFallback(cue: SfxCue): void {
  if (typeof window === 'undefined' || !fallbackNotes[cue]) return;
  const Context = window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  fallbackContext ??= new Context();
  const context = fallbackContext;
  const start = context.currentTime + 0.01;
  fallbackNotes[cue]?.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const noteStart = start + index * 0.1;
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.035 * (settings.soundEffectsVolume ?? 0.75), noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.14);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.16);
  });
}

export function playSfx(cue: SfxCue): void {
  if (!settings.soundEffectsEnabled) return;
  const now = performance.now();
  const throttle = THROTTLE_MS[cue] ?? 70;
  if (now - (lastPlayedAt.get(cue) ?? 0) < throttle) return;
  lastPlayedAt.set(cue, now);
  playSyntheticFallback(cue);
}

export function playAudioCue(cue: AudioCue): void {
  playSfx(cue);
}

export function playRecordedVoice(
  _cue: RecordedVoiceCue,
  _gender: unknown,
  fallback?: () => void
): void {
  if (settings.narrationEnabled) fallback?.();
}

export function stopNarration(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  setDucked(false);
}

export function preloadAudio(relativeBases: string[]): void {
  if (!canUseAudio()) return;
  for (const base of relativeBases) {
    if (preloadCache.has(base)) continue;
    const audio = createAudio(base, 0);
    if (!audio) continue;
    preloadCache.set(base, audio);
    audio.load();
  }
}

export function preloadCriticalAudio(): void {
  preloadAudio([
    musicTracks.home,
    musicTracks.mainThemeShort
  ]);
}
