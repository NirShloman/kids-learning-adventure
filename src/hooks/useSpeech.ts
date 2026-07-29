import { FocusEventHandler, MouseEventHandler, useCallback } from 'react';
import { canSpeak, SpeakOptions, speakHebrew, stopSpeaking } from '../services/speechService';
import { stopNarration } from '../services/audioService';

export function useSpeech(enabled: boolean) {
  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!enabled) return;
      speakHebrew(text, options);
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
    stopNarration();
    stopSpeaking();
  }, []);

  return { speak, stop, getSpeakProps, isSupported: canSpeak() };
}
