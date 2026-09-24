import { useCallback, useEffect, useRef, useState } from 'react';
import { playNarrationText, stopNarrationPlayback } from '../services/narrationService';
import { playSfx } from '../services/audioService';

/** One answer owns its feedback, narration and transition. Background time never advances play. */
export function useGameFeedback(voiceEnabled: boolean) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const generation = useRef(0);
  const locked = useRef(false);
  const job = useRef<{ text: string; next: () => void } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voice = useRef(voiceEnabled);
  voice.current = voiceEnabled;
  const clear = useCallback(() => {
    ++generation.current;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const start = useCallback(() => {
    const current = job.current;
    if (!current || document.hidden) return;
    clear();
    const token = generation.current;
    let visibleLongEnough = false;
    let audioFinished = !voice.current;
    const finish = () => {
      if (token !== generation.current || !visibleLongEnough || !audioFinished || document.hidden) return;
      clear();
      job.current = null;
      locked.current = false;
      setBusy(false);
      setMessage('');
      current.next();
    };
    timers.current.push(setTimeout(() => { visibleLongEnough = true; finish(); }, 1500));
    timers.current.push(setTimeout(() => {
      if (token !== generation.current) return;
      audioFinished = true;
      stopNarrationPlayback();
      finish();
    }, 10000));
    if (voice.current) playNarrationText(current.text, {
      onSettled: () => { audioFinished = true; finish(); },
    });
  }, [clear]);
  const run = useCallback((text: string, next: () => void, correct?: boolean) => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setMessage(text);
    job.current = { text, next };
    if (correct !== undefined) playSfx(correct ? 'correct' : 'wrongTarget');
    start();
    return true;
  }, [start]);
  useEffect(() => {
    const pause = () => { clear(); stopNarrationPlayback(); };
    const visibility = () => { if (document.hidden) pause(); else start(); };
    const appState = (event: Event) => {
      if ((event as CustomEvent<{ isActive: boolean }>).detail.isActive) start(); else pause();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('lomdim:app-state', appState);
    return () => {
      clear(); job.current = null; locked.current = false; stopNarrationPlayback();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('lomdim:app-state', appState);
    };
  }, [clear, start]);
  return { busy, message, run, locked, resume: start };
}
