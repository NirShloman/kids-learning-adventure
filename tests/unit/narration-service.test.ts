// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatedNarrationManifest } from '../../src/assets/narrationManifest';

const speech = vi.hoisted(() => ({ speak: vi.fn(), stop: vi.fn() }));
vi.mock('../../src/services/speechService', () => ({
  speakHebrew: speech.speak,
  stopSpeaking: speech.stop
}));
import * as narration from '../../src/services/narrationService';

class FakeAudio {
  static instances: FakeAudio[] = [];
  currentTime = 0;
  volume = 1;
  playbackRate = 1;
  preservesPitch = false;
  preload = '';
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public src = '') { FakeAudio.instances.push(this); }
  load() {}
  play() { this.onplay?.(); return Promise.resolve(); }
  pause = vi.fn();
}

describe('frontend narration service', () => {
  it('settles only the requested recording and cancels it exactly once', () => {
    const first=vi.fn(),second=vi.fn();
    narration.playNarrationUrl('/assets/audio/narration/request-one.mp3','אחד',{onSettled:first});
    const stale=FakeAudio.instances.at(-1)!.onended;
    narration.playNarrationUrl('/assets/audio/narration/request-two.mp3','שניים',{onSettled:second});
    expect(first).toHaveBeenCalledExactlyOnceWith('cancelled');
    stale?.();expect(second).not.toHaveBeenCalled();
    FakeAudio.instances.at(-1)!.onended?.();
    expect(second).toHaveBeenCalledExactlyOnceWith('ended');
    narration.stopNarrationPlayback();expect(second).toHaveBeenCalledTimes(1);
  });
  it('a failed recording waits for its speech fallback rather than treating failure as completion', () => {
    const settled=vi.fn();
    narration.playNarrationUrl('/assets/audio/narration/fallback-request.mp3','שלום',{onSettled:settled});
    FakeAudio.instances.at(-1)!.onerror?.();
    expect(settled).not.toHaveBeenCalled();
    speech.speak.mock.calls.at(-1)![1].onSettled('ended');
    expect(settled).toHaveBeenCalledExactlyOnceWith('ended');
  });
  it('keeps preload batches bounded even when a caller supplies the entire catalog', () => {
    const before = FakeAudio.instances.length;
    narration.preloadNarrationUrls(Array.from({ length: 500 }, (_, index) => `/assets/audio/narration/bounded-${index}.mp3`));
    expect(FakeAudio.instances.length - before).toBe(narration.MAX_PRELOAD_NARRATIONS);
  });

  it('pauses, resumes, changes volume and stops the current MP3 without speech fallback', () => {
    narration.playNarrationUrl('/assets/audio/narration/playback-controls.mp3', 'בדיקה');
    const audio = FakeAudio.instances.at(-1)!;
    audio.currentTime = 1.5;
    narration.pauseNarration();
    expect(audio.pause).toHaveBeenCalled();
    expect(narration.isNarrationPlaying()).toBe(false);
    narration.resumeNarration();
    expect(audio.currentTime).toBe(1.5);
    expect(narration.isNarrationPlaying()).toBe(true);
    narration.setNarrationVolume(0.3);
    expect(audio.volume).toBe(0.3);
    narration.stopNarrationPlayback();
    expect(audio.currentTime).toBe(0);
    expect(narration.isNarrationPlaying()).toBe(false);
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it('falls back exactly once on playback failure and ignores stale errors', () => {
    narration.playNarrationUrl('/assets/audio/narration/broken.mp3', 'עולמיה');
    const audio = FakeAudio.instances.at(-1)!;
    const staleError = audio.onerror;
    staleError?.();
    staleError?.();
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledWith('עוֹלָמִיָּה', {});
  });
  it('settles a queued request when a newer guided request replaces it', () => {
    const first = vi.fn(), second = vi.fn();
    narration.playNarrationUrl('/assets/audio/narration/current.mp3', 'פעיל');
    narration.playNarrationUrl('/assets/audio/narration/first.mp3', 'ראשון', { mode: 'guided', onSettled: first });
    narration.playNarrationUrl('/assets/audio/narration/second.mp3', 'שני', { mode: 'guided', onSettled: second });
    expect(first).toHaveBeenCalledExactlyOnceWith('cancelled');
    expect(second).not.toHaveBeenCalled();
    narration.stopNarrationPlayback();
    expect(second).toHaveBeenCalledExactlyOnceWith('cancelled');
  });
  beforeEach(() => {
    FakeAudio.instances = [];
    speech.speak.mockClear();
    speech.stop.mockClear();
    vi.stubGlobal('Audio', FakeAudio);
    generatedNarrationManifest.entries = {};
    narration.stopNarrationPlayback();
  });

  it('plays a generated local MP3 as the primary path', async () => {
    generatedNarrationManifest.entries['שלום'] = {
      assetKey: 'a'.repeat(64), localPath: '/assets/audio/narration/hello.mp3', storagePath: 'narration/hello.mp3',
      audioUrl: 'https://storage.example/hello.mp3', checksum: 'b'.repeat(64), byteLength: 10
    };
    narration.configureNarrationPreferences(0.6, true);
    narration.playNarrationText('שלום');
    expect(FakeAudio.instances[0]?.src).toBe('/assets/audio/narration/hello.mp3');
    expect(FakeAudio.instances[0]?.volume).toBe(0.6);
    expect(FakeAudio.instances[0]?.playbackRate).toBe(0.8);
    expect(speech.speak).not.toHaveBeenCalled();
    expect(narration.isNarrationPlaying()).toBe(true);
  });

  it('uses local speech fallback when no generated asset exists', async () => {
    narration.playNarrationText('טקסט חדש', { mode: 'manual' });
    expect(FakeAudio.instances).toHaveLength(0);
    expect(speech.speak).toHaveBeenCalledWith('טקסט חדש', { mode: 'manual' });
  });

  it('preloads only texts that have generated assets', async () => {
    generatedNarrationManifest.entries['מוכן'] = {
      assetKey: 'a'.repeat(64), localPath: '/assets/audio/narration/ready.mp3', storagePath: 'narration/ready.mp3',
      audioUrl: 'https://storage.example/ready.mp3', checksum: 'b'.repeat(64), byteLength: 10
    };
    narration.preloadNarrationTexts(['מוכן', 'חסר', 'מוכן']);
    expect(FakeAudio.instances.map((audio) => audio.src)).toEqual(['/assets/audio/narration/ready.mp3']);
  });

  it('ignores a cancelled play promise after a newer recording starts', async () => {
    let rejectOld: (error: Error) => void = () => {};
    const originalPlay=FakeAudio.prototype.play;
    vi.spyOn(FakeAudio.prototype,'play').mockImplementationOnce(function(this:FakeAudio){
      this.onplay?.();return new Promise<void>((_resolve,reject)=>{rejectOld=reject;});
    });
    narration.playNarrationUrl('/assets/audio/narration/old-race.mp3','ישן');
    const old=FakeAudio.instances.at(-1)!;
    const staleEnded=old.onended;
    narration.playNarrationUrl('/assets/audio/narration/new-race.mp3','חדש');
    rejectOld(new Error('AbortError: play interrupted by pause'));await Promise.resolve();
    staleEnded?.();
    expect(narration.getActiveNarrationText()).toBe('חדש');
    expect(narration.isNarrationPlaying()).toBe(true);
    expect(speech.speak).not.toHaveBeenCalled();
    FakeAudio.prototype.play=originalPlay;
  });
});
