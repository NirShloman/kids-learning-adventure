import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { GameDefinition } from '../../types';
import { GameImage } from '../common/GameImage';
import { playAudioCue } from '../../services/audioService';
import { useSpeech } from '../../hooks/useSpeech';

interface GameEntryTransitionProps {
  game: GameDefinition;
  voiceEnabled: boolean;
  onComplete: () => void;
}

const entryAnnouncements: Record<GameDefinition['id'], string> = {
  letters: 'עכשיו משחקים באותיות.',
  numbers: 'עכשיו משחקים במספרים.',
  shapes: 'עכשיו משחקים בצורות.',
  colors: 'עכשיו משחקים בצבעים.',
  matching: 'עכשיו משחקים בהתאמה.',
  memory: 'עכשיו משחקים בזיכרון.',
  patterns: 'עכשיו משחקים ברצפים.',
  sorting: 'עכשיו משחקים במיון ובסיווג.'
};

export function GameEntryTransition({ game, voiceEnabled, onComplete }: GameEntryTransitionProps) {
  const reduceMotion = useReducedMotion();
  const { speak, stop } = useSpeech(voiceEnabled);
  const duration = reduceMotion ? 250 : 1800;

  useEffect(() => {
    playAudioCue('levelStart');
    speak(entryAnnouncements[game.id], { mode: 'guided' });
    const timer = window.setTimeout(onComplete, duration);
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, [duration, game.id, onComplete, speak, stop]);

  return (
    <motion.section
      className={`game-entry game-entry--${game.accent}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.45, ease: 'easeOut' }}
      aria-live="polite"
    >
      <motion.div
        className="game-entry__art"
        initial={reduceMotion ? undefined : { y: 22, rotate: -4 }}
        animate={reduceMotion ? undefined : { y: [22, -8, 0], rotate: [-4, 2, 0] }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <GameImage assetId={game.imageAssetId} alt="" decorative />
        <span aria-hidden="true">{game.emoji}</span>
      </motion.div>
      <motion.span className="game-entry__eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        מכינים את עולם המשחק
      </motion.span>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        {game.title}
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        {game.description}
      </motion.p>
      <div className="game-entry__progress" aria-hidden="true">
        <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduceMotion ? 0.2 : 1.45, ease: 'easeInOut' }} />
      </div>
      <button type="button" className="game-entry__skip" onClick={onComplete}>דלגו למשחק</button>
    </motion.section>
  );
}
