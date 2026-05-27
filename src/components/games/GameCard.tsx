import { GameDefinition } from '../../types';
import { gameInstructions } from '../../data/gameInstructions';
import { useSpeech } from '../../hooks/useSpeech';
import { Button } from '../common/Button';

interface GameCardProps {
  game: GameDefinition;
  voiceEnabled: boolean;
  onPlay: (gameId: GameDefinition['id']) => void;
}

export function GameCard({ game, voiceEnabled, onPlay }: GameCardProps) {
  const { getSpeakProps } = useSpeech(voiceEnabled);
  const speechText = gameInstructions[game.id]?.hoverText ?? `${game.title}. ${game.description}`;

  return (
    <article className={`game-card game-card--${game.accent} game-card--premium`} tabIndex={0} {...getSpeakProps<HTMLElement>(speechText)}>
      <div className="game-card__shine" aria-hidden="true" />
      <div className="game-card__icon" aria-hidden="true">{game.emoji}</div>
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <small>מתאים לגילאי {game.recommendedAges.join(', ')}</small>
      <Button onClick={() => onPlay(game.id)} fullWidth {...getSpeakProps<HTMLButtonElement>(`מתחילים את ${game.title}`)}>מתחילים</Button>
    </article>
  );
}
