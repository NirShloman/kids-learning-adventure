import { useCallback } from 'react';
import { canSpeak, speakHebrew, stopSpeaking } from '../services/speechService';

export function useSpeech(enabled: boolean) {
  const speak = useCallback(
    (text: string) => {
      if (!enabled) return;
      speakHebrew(text);
    },
    [enabled]
  );

  return { speak, stop: stopSpeaking, isSupported: canSpeak() };
}
