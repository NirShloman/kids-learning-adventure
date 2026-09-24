import { FocusEventHandler, MouseEventHandler, useCallback } from 'react';
import { canSpeak, SpeakOptions } from '../services/speechService';
import { playNarrationText, preloadNarrationTexts, stopNarrationPlayback } from '../services/narrationService';

export function useSpeech(enabled: boolean) {
  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!enabled) return;
      playNarrationText(text, options);
    },
    [enabled]
  );

  const getSpeakProps = useCallback(
    <TElement extends HTMLElement>(text: string): {
      onMouseEnter: MouseEventHandler<TElement>;
      onFocus: FocusEventHandler<TElement>;
    } => ({
      onMouseEnter: () => speak(text, { mode: 'hint' }),
      onFocus: () => speak(text, { mode: 'hint' })
    }),
    [speak]
  );

  const stop = useCallback(() => {
    stopNarrationPlayback();
  }, []);

  const preload = useCallback((texts: string[]) => {
    if (enabled) preloadNarrationTexts(texts);
  }, [enabled]);

  return { speak, stop, preload, getSpeakProps, isSupported: typeof Audio !== 'undefined' || canSpeak() };
}
