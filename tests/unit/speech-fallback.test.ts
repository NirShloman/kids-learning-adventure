// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativeMocks = vi.hoisted(() => ({
  available: false,
  narrationAvailable: vi.fn(async () => ({ available: nativeMocks.available })),
  speak: vi.fn(async () => undefined),
  stopSpeaking: vi.fn(async () => undefined),
  addListener: vi.fn(async () => ({ remove: async () => undefined }))
}));

vi.mock('../../src/services/platformRuntime', () => ({
  platformRuntime: { native: true, platform: 'android', isActive: true },
  nativeLearning: nativeMocks
}));

import { canSpeak, speakHebrew } from '../../src/services/speechService';

describe('native narration fallback', () => {
  beforeEach(async () => {
    nativeMocks.available = false;
    nativeMocks.narrationAvailable.mockClear();
    nativeMocks.speak.mockClear();
    await Promise.resolve();
  });

  it('keeps visual guidance working without throwing when no local Hebrew voice exists', async () => {
    expect(canSpeak()).toBe(false);
    expect(() => speakHebrew('הנחיה חזותית')).not.toThrow();
    await Promise.resolve();
    expect(nativeMocks.speak).not.toHaveBeenCalled();
  });

  it('rechecks availability and speaks once an offline Hebrew voice becomes ready', async () => {
    nativeMocks.available = true;
    speakHebrew('שלום');
    await vi.waitFor(() => expect(nativeMocks.speak).toHaveBeenCalledWith(expect.objectContaining({
      text: 'שלום',
      language: 'he-IL'
    })));
  });

  it('only starts the latest request while native voice availability is pending', async () => {
    nativeMocks.available = false;
    vi.resetModules();
    const speech = await import('../../src/services/speechService');
    await Promise.resolve();
    let resolveFirst!: (value: {available: boolean}) => void;
    let resolveLast!: (value: {available: boolean}) => void;
    nativeMocks.narrationAvailable.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
    nativeMocks.narrationAvailable.mockImplementationOnce(() => new Promise(resolve => { resolveLast = resolve; }));
    const first = vi.fn(), last = vi.fn();
    speech.speakHebrew('הוראה ישנה', {onSettled:first});
    speech.speakHebrew('משוב חדש', {onSettled:last});
    expect(first).toHaveBeenCalledExactlyOnceWith('cancelled');
    resolveFirst({available:true});await Promise.resolve();
    expect(nativeMocks.speak).not.toHaveBeenCalled();
    resolveLast({available:true});await Promise.resolve();
    expect(nativeMocks.speak).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({text:'משוב חדש',requestId:expect.any(String)}));
    expect(last).not.toHaveBeenCalled();
    speech.stopSpeaking();expect(last).toHaveBeenCalledExactlyOnceWith('cancelled');
  });
});
