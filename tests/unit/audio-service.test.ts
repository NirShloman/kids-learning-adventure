// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  src: string;
  currentTime = 0;
  volume = 1;
  paused = true;
  ended = false;
  loop = false;
  preload = '';
  dataset: Record<string, string> = {};

  constructor(src = '') {
    super();
    this.src = src;
    FakeAudio.instances.push(this);
  }

  load() {}

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

beforeEach(() => {
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(performance.now() + 1000);
    return 1;
  });
});

describe('audio service', () => {
  it('uses the supplied MP3 files and suppresses effects when disabled', async () => {
    const audio = await import('../../src/services/audioService');
    expect(audio.resolveAudioSource('music/letters-garden')).toBe('/assets/audio/music/letters-garden.mp3');

    audio.configureAudio({
      musicEnabled: false,
      narrationEnabled: false,
      soundEffectsEnabled: false
    });
    audio.playSfx('correct');
    expect(FakeAudio.instances.some((instance) => instance.src.includes('sfx/correct'))).toBe(false);
  });

  it('uses browser narration as the recorded-voice fallback', async () => {
    const audio = await import('../../src/services/audioService');
    audio.configureAudio({
      musicEnabled: false,
      narrationEnabled: true,
      soundEffectsEnabled: true
    });
    const fallback = vi.fn();
    audio.playRecordedVoice('tryAgain', undefined, fallback);
    expect(fallback).toHaveBeenCalledOnce();
    expect(FakeAudio.instances.some((instance) => instance.src.includes('/voice/'))).toBe(false);
  });

  it('keeps songs out of background playback', async () => {
    const audio = await import('../../src/services/audioService');
    audio.configureAudio({ musicEnabled: true, narrationEnabled: true, soundEffectsEnabled: true });
    window.dispatchEvent(new Event('pointerdown'));
    audio.playBackgroundMusic('letters');
    expect(FakeAudio.instances.some((instance) => instance.src.includes('music/garden-gate.mp3'))).toBe(true);
    const before = FakeAudio.instances.length;
    audio.playBackgroundMusic('mainTheme');
    expect(FakeAudio.instances).toHaveLength(before);
  });
});
