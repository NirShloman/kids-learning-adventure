import { HTMLAttributes, useCallback } from 'react';
import { canSpeak, SpeakOptions, speakHebrew, stopSpeaking } from '../services/speechService';

export function useSpeech(enabled: boolean) {
  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!enabled) return;
      speakHebrew(text, options);
    },
    [enabled]
  );

  const getSpeakProps = useCallback(
    <TElement extends HTMLElement>(text: string): HTMLAttributes<TElement> => ({
      onMouseEnter: () => speak(text, { mode: 'hint' }),
      onFocus: () => speak(text, { mode: 'hint' })
    }),
    [speak]
  );

  return { speak, stop: stopSpeaking, getSpeakProps, isSupported: canSpeak() };
}
