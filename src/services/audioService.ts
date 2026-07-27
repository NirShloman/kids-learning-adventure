export type AudioCue = 'correct' | 'retry' | 'select' | 'match' | 'flip' | 'levelStart' | 'levelComplete';

let soundEffectsEnabled = true;
let audioContext: AudioContext | null = null;
let lastCue: AudioCue | null = null;
let lastCueAt = 0;

const cueNotes: Record<AudioCue, Array<{ frequency: number; delay: number; duration: number; gain: number }>> = {
  correct: [
    { frequency: 523.25, delay: 0, duration: 0.12, gain: 0.08 },
    { frequency: 659.25, delay: 0.1, duration: 0.13, gain: 0.075 },
    { frequency: 783.99, delay: 0.2, duration: 0.18, gain: 0.07 }
  ],
  retry: [
    { frequency: 392, delay: 0, duration: 0.13, gain: 0.045 },
    { frequency: 440, delay: 0.13, duration: 0.16, gain: 0.04 }
  ],
  select: [{ frequency: 587.33, delay: 0, duration: 0.07, gain: 0.035 }],
  match: [
    { frequency: 659.25, delay: 0, duration: 0.12, gain: 0.06 },
    { frequency: 880, delay: 0.11, duration: 0.2, gain: 0.055 }
  ],
  flip: [{ frequency: 493.88, delay: 0, duration: 0.09, gain: 0.03 }],
  levelStart: [
    { frequency: 440, delay: 0, duration: 0.12, gain: 0.045 },
    { frequency: 587.33, delay: 0.12, duration: 0.18, gain: 0.045 }
  ],
  levelComplete: [
    { frequency: 523.25, delay: 0, duration: 0.13, gain: 0.07 },
    { frequency: 659.25, delay: 0.1, duration: 0.13, gain: 0.065 },
    { frequency: 783.99, delay: 0.2, duration: 0.13, gain: 0.06 },
    { frequency: 1046.5, delay: 0.31, duration: 0.24, gain: 0.055 }
  ]
};

export function configureSoundEffects(enabled: boolean): void {
  soundEffectsEnabled = enabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;
  audioContext ??= new Context();
  return audioContext;
}

export function playAudioCue(cue: AudioCue): void {
  if (!soundEffectsEnabled) return;
  const now = performance.now();
  if (lastCue === cue && now - lastCueAt < 120) return;
  lastCue = cue;
  lastCueAt = now;

  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume();
  const start = context.currentTime + 0.01;

  for (const note of cueNotes[cue]) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, start + note.delay);
    gain.gain.setValueAtTime(0.0001, start + note.delay);
    gain.gain.exponentialRampToValueAtTime(note.gain, start + note.delay + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.delay + note.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start + note.delay);
    oscillator.stop(start + note.delay + note.duration + 0.02);
  }
}
