const CHILD_FRIENDLY_SPEECH_RATE = 0.75;

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakHebrew(text: string): void {
  if (!canSpeak() || !text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'he-IL';
  utterance.rate = CHILD_FRIENDLY_SPEECH_RATE;
  utterance.pitch = 1.05;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
}
