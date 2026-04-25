import { GameDefinition } from '../../types';
import { Button } from '../common/Button';

interface GameCardProps {
  game: GameDefinition;
  onPlay: (gameId: GameDefinition['id']) => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <article className={`game-card game-card--${game.accent}`}>
      <div className="game-card__icon">{game.emoji}</div>
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <small>מתאים לגילאי {game.recommendedAges.join(', ')}</small>
      <Button onClick={() => onPlay(game.id)} fullWidth>מתחילים</Button>
    </article>
  );
}
