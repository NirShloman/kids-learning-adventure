import type { CSSProperties } from 'react';
import { GameDefinition } from '../../types';
import { gameInstructions } from '../../data/gameInstructions';
import { useSpeech } from '../../hooks/useSpeech';
import { Button } from '../common/Button';
import { GameImage } from '../common/GameImage';
import { imageAssets } from '../../assets/assetManifest';

interface GameCardProps {
  game: GameDefinition;
  voiceEnabled: boolean;
  onPlay: (gameId: GameDefinition['id']) => void;
}

export function GameCard({ game, voiceEnabled, onPlay }: GameCardProps) {
  const { getSpeakProps } = useSpeech(voiceEnabled);
  const speechText = gameInstructions[game.id]?.hoverText ?? `${game.title}. ${game.description}`;
  const backgroundStyle = game.backgroundAssetId
    ? { '--game-card-art': `url(${imageAssets[game.backgroundAssetId]})` } as CSSProperties
    : undefined;

  return (
    <article className={`game-card game-card--${game.accent} game-card--premium`} style={backgroundStyle} tabIndex={0} {...getSpeakProps<HTMLElement>(speechText)}>
      <div className="game-card__shine" aria-hidden="true" />
      <div className="game-card__visual" aria-hidden="true">
        <GameImage assetId={game.imageAssetId} alt="" className="game-card__image" decorative />
        <span className="game-card__icon">{game.emoji}</span>
      </div>
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <small>מתאים לגילאי {game.recommendedAges.join(', ')}</small>
      <Button onClick={() => onPlay(game.id)} fullWidth {...getSpeakProps<HTMLButtonElement>(`מתחילים את ${game.title}`)}>מתחילים</Button>
    </article>
  );
}
