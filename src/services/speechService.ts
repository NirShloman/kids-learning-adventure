const CHILD_FRIENDLY_SPEECH_RATE = 0.62;
const CHILD_FRIENDLY_SPEECH_PITCH = 1.14;
const MAX_SPOKEN_TEXT_LENGTH = 260;
const REPEAT_GUARD_MS = 900;

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

export function canSpeak(): boolean {
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
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[{}[\]<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SPOKEN_TEXT_LENGTH);
}

function shouldSkipRepeatedSpeech(text: string): boolean {
  const now = Date.now();
  const shouldSkip = text === lastSpokenText && now - lastSpokenAt < REPEAT_GUARD_MS;
  lastSpokenText = text;
  lastSpokenAt = now;
  return shouldSkip;
}

export function speakHebrew(text: string): void {
  if (!canSpeak()) return;

  const safeText = normalizeSpeechText(text);
  if (!safeText || shouldSkipRepeatedSpeech(safeText)) return;

  const utterance = new SpeechSynthesisUtterance(safeText);
  utterance.lang = 'he-IL';
  utterance.rate = CHILD_FRIENDLY_SPEECH_RATE;
  utterance.pitch = CHILD_FRIENDLY_SPEECH_PITCH;
  utterance.voice = cachedHebrewVoice ?? getPreferredHebrewVoice();

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}

if (canSpeak()) {
  window.speechSynthesis.addEventListener('voiceschanged', getPreferredHebrewVoice);
  getPreferredHebrewVoice();
}
