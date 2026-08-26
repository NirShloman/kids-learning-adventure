import { nativeLearning, platformRuntime } from './platformRuntime';

const CHILD_FRIENDLY_SPEECH_RATE = 0.84;
const CHILD_FRIENDLY_SPEECH_PITCH = 1.04;
const MAX_SPOKEN_TEXT_LENGTH = 260;
const REPEAT_GUARD_MS = 900;

export type SpeechMode = 'hint' | 'guided' | 'manual';

export interface SpeakOptions {
  mode?: SpeechMode;
  slow?: boolean;
}

const FEMALE_HEBREW_VOICE_HINTS = [
  'hila',
  'הילה',
  'carmit',
  'כרמית',
  'yael',
  'יעל',
  'shira',
  'שירה',
  'liora',
  'ליאורה',
  'noa',
  'נועה',
  'maya',
  'מאיה',
  'tamar',
  'תמר',
  'google hebrew',
  'google עברית'
];

const MALE_HEBREW_VOICE_HINTS = ['asaf', 'אסף', 'avri', 'אברי', 'david', 'דוד', 'גבר'];

let cachedHebrewVoice: SpeechSynthesisVoice | null = null;
let lastSpokenText = '';
let lastSpokenAt = 0;
let isSpeaking = false;
let pendingGuidedText = '';
let nativeSpeechAvailable = false;
let configuredSpeechVolume = 0.8;
let configuredSlowSpeech = false;

export function configureSpeechPreferences(volume: number, slow: boolean): void {
  configuredSpeechVolume = Math.max(0, Math.min(1, volume));
  configuredSlowSpeech = slow;
}

export interface NarrationDriver {
  available(): boolean;
  speak(text: string, options?: SpeakOptions): void;
  stop(): void;
}

function notifySpeechLifecycle(event: 'start' | 'end'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(`lomdim:speech-${event}`));
}

export function canSpeak(): boolean {
  if (platformRuntime.native) return nativeSpeechAvailable;
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function includesAny(value: string, options: string[]): boolean {
  return options.some((option) => value.includes(option));
}

function isHebrewVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();

  return lang === 'he-il' || lang.startsWith('he') || name.includes('hebrew') || name.includes('עברית');
}

function scoreHebrewVoice(voice: SpeechSynthesisVoice): number {
  const searchableVoiceDetails = `${voice.name} ${voice.lang} ${voice.voiceURI}`.toLowerCase();
  let score = 0;

  if (voice.lang.toLowerCase() === 'he-il') score += 30;
  if (includesAny(searchableVoiceDetails, FEMALE_HEBREW_VOICE_HINTS)) score += 100;
  if (includesAny(searchableVoiceDetails, MALE_HEBREW_VOICE_HINTS)) score -= 100;
  if (searchableVoiceDetails.includes('natural')) score += 10;
  if (searchableVoiceDetails.includes('google')) score += 6;
  if (voice.localService) score += 2;

  return score;
}

function getPreferredHebrewVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null;

  const voices = window.speechSynthesis.getVoices();
  const hebrewVoices = voices.filter(isHebrewVoice);

  if (!hebrewVoices.length) return null;

  cachedHebrewVoice = [...hebrewVoices].sort((first, second) => scoreHebrewVoice(second) - scoreHebrewVoice(first))[0];
  return cachedHebrewVoice;
}

function normalizeSpeechText(text: string): string {
  const normalized = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[{}[\]<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SPOKEN_TEXT_LENGTH);
  return /[A-Za-z]/.test(normalized) ? '' : normalized;
}

function shouldSkipRepeatedSpeech(text: string): boolean {
  const now = Date.now();
  const shouldSkip = text === lastSpokenText && now - lastSpokenAt < REPEAT_GUARD_MS;
  lastSpokenText = text;
  lastSpokenAt = now;
  return shouldSkip;
}

function refreshSpeechState() {
  if (platformRuntime.native) return;
  if (!canSpeak()) return;
  isSpeaking = window.speechSynthesis.speaking || window.speechSynthesis.pending;
}

function speakSafeText(safeText: string, mode: SpeechMode, slow = false): void {
  const useSlowRate = slow || configuredSlowSpeech;
  if (platformRuntime.native) {
    if (mode === 'manual') {
      pendingGuidedText = '';
      void nativeLearning.stopSpeaking();
    }
    void nativeLearning.speak({
      text: safeText,
      language: 'he-IL',
      rate: useSlowRate ? 0.68 : CHILD_FRIENDLY_SPEECH_RATE,
      pitch: CHILD_FRIENDLY_SPEECH_PITCH
    });
    return;
  }
  const utterance = new SpeechSynthesisUtterance(safeText);
  utterance.lang = 'he-IL';
  utterance.rate = useSlowRate ? 0.68 : CHILD_FRIENDLY_SPEECH_RATE;
  utterance.volume = configuredSpeechVolume;
  utterance.pitch = CHILD_FRIENDLY_SPEECH_PITCH;
  utterance.voice = cachedHebrewVoice ?? getPreferredHebrewVoice();
  utterance.onstart = () => {
    isSpeaking = true;
    notifySpeechLifecycle('start');
  };
  utterance.onend = () => {
    isSpeaking = false;
    notifySpeechLifecycle('end');
    if (!pendingGuidedText) return;
    const nextText = pendingGuidedText;
    pendingGuidedText = '';
    speakHebrew(nextText, { mode: 'guided' });
  };
  utterance.onerror = () => {
    isSpeaking = false;
    notifySpeechLifecycle('end');
  };

  if (mode === 'manual') {
    pendingGuidedText = '';
    window.speechSynthesis.cancel();
  }

  window.speechSynthesis.speak(utterance);
}

export function speakHebrew(text: string, options: SpeakOptions = {}): void {
  if (platformRuntime.native && !nativeSpeechAvailable) {
    void nativeLearning.narrationAvailable({ language: 'he-IL' }).then(({ available }) => {
      nativeSpeechAvailable = available;
      if (available) speakHebrew(text, options);
    }).catch(() => {
      nativeSpeechAvailable = false;
    });
    return;
  }
  if (!canSpeak()) return;

  const mode = options.mode ?? 'manual';
  const safeText = normalizeSpeechText(text);
  if (!safeText || shouldSkipRepeatedSpeech(safeText)) return;

  refreshSpeechState();

  if (isSpeaking && mode === 'hint') return;

  if (isSpeaking && mode === 'guided') {
    pendingGuidedText = safeText;
    return;
  }

  speakSafeText(safeText, mode, options.slow);
}

export function stopSpeaking(): void {
  pendingGuidedText = '';
  isSpeaking = false;
  if (platformRuntime.native) {
    void nativeLearning.stopSpeaking();
    notifySpeechLifecycle('end');
    return;
  }
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  notifySpeechLifecycle('end');
}

if (platformRuntime.native) {
  void nativeLearning.narrationAvailable({ language: 'he-IL' }).then(({ available }) => {
    nativeSpeechAvailable = available;
  }).catch(() => {
    nativeSpeechAvailable = false;
  });
  void nativeLearning.addListener('speechState', ({ speaking }) => {
    nativeSpeechAvailable = true;
    isSpeaking = speaking;
    notifySpeechLifecycle(speaking ? 'start' : 'end');
    if (speaking || !pendingGuidedText) return;
    const nextText = pendingGuidedText;
    pendingGuidedText = '';
    speakHebrew(nextText, { mode: 'guided' });
  });
} else if (canSpeak()) {
  window.speechSynthesis.addEventListener('voiceschanged', getPreferredHebrewVoice);
  getPreferredHebrewVoice();
}

export const narrationDriver: NarrationDriver = {
  available: canSpeak,
  speak: speakHebrew,
  stop: stopSpeaking
};
