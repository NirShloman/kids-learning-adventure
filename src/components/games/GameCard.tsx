import { GameDefinition } from '../../types';
import { gameInstructions } from '../../data/gameInstructions';
import { useSpeech } from '../../hooks/useSpeech';
import { worldCollection } from '../../data/worldCollection';
import { motion, useReducedMotion } from 'motion/react';
import { InterfaceIcon } from '../common/InterfaceIcon';

interface GameCardProps {
  game: GameDefinition;
  voiceEnabled: boolean;
  onPlay: (gameId: GameDefinition['id']) => void;
  discoveries?: number;
}

export function GameCard({ game, voiceEnabled, onPlay, discoveries = 0 }: GameCardProps) {
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || document.documentElement.dataset.reducedMotion === 'true';
  const { getSpeakProps } = useSpeech(voiceEnabled);
  const speechText = gameInstructions[game.id]?.hoverText ?? `${game.title}. ${game.description}`;
  const world = worldCollection.find(world => world.gameId === game.id)!;

  return (
    <motion.button
      type="button"
      onClick={() => onPlay(game.id)}
      aria-label={`מתחילים את ${game.title}`}
      className={`game-card game-card--${game.accent} game-card--premium`}
      data-game-id={game.id}
      tabIndex={0}
      whileHover={reducedMotion ? undefined : { y: -3 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 360, damping: 25 }}
      {...getSpeakProps<HTMLElement>(speechText)}
    >
      <div className="game-card__visual" aria-hidden="true">
        <img src={world.art} alt="" className="game-card__cover" decoding="async" />
        {discoveries > 0 && <span className="game-card__keepsake"><InterfaceIcon name="collection" />{discoveries}</span>}
      </div>
      <div className="game-card__caption">
        <div><h3>{game.title}</h3><span className="game-card__world-name">{world.name}</span></div>
        <span className="game-card__play" aria-hidden="true"><InterfaceIcon name="arrow" /></span>
      </div>
    </motion.button>
  );
}
