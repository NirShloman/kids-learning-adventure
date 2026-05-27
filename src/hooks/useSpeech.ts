import { HTMLAttributes, useCallback } from 'react';
import { canSpeak, speakHebrew, stopSpeaking } from '../services/speechService';

export function useSpeech(enabled: boolean) {
  const speak = useCallback(
    (text: string) => {
      if (!enabled) return;
      speakHebrew(text);
    },
    [enabled]
  );

  const getSpeakProps = useCallback(
    <TElement extends HTMLElement>(text: string): HTMLAttributes<TElement> => ({
      onMouseEnter: () => speak(text),
      onFocus: () => speak(text)
    }),
    [speak]
  );

  return { speak, stop: stopSpeaking, getSpeakProps, isSupported: canSpeak() };
}
