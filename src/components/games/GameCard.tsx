import { GameDefinition } from '../../types';
import { gameInstructions } from '../../data/gameInstructions';
import { useSpeech } from '../../hooks/useSpeech';
import { worldCollection } from '../../data/worldCollection';
import { motion } from 'motion/react';

interface GameCardProps {
  game: GameDefinition;
  voiceEnabled: boolean;
  onPlay: (gameId: GameDefinition['id']) => void;
}

export function GameCard({ game, voiceEnabled, onPlay }: GameCardProps) {
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
      whileHover={{ y: -7, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 360, damping: 25 }}
      {...getSpeakProps<HTMLElement>(speechText)}
    >
      <div className="game-card__visual" aria-hidden="true">
        <img src={world.art} alt="" className="game-card__cover" decoding="async" />
      </div>
      <div className="game-card__caption">
        <div><h3>{game.title}</h3><span className="game-card__world-name">{world.name}</span></div>
        <span className="game-card__play" aria-hidden="true">←</span>
      </div>
    </motion.button>
  );
}
