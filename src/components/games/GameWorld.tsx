import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { imageAssets } from '../../assets/assetManifest';
import { gameDefinitions } from '../../data/games';
import { GameId } from '../../types';
import { Button } from '../common/Button';
import { GameImage } from '../common/GameImage';

interface GameWorldProps {
  gameId: GameId;
  title?: string;
  scoreLabel?: string;
  scoreValue?: string | number;
  status?: string;
  children: ReactNode;
  onBack: () => void;
  backSpeakProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  className?: string;
}

interface GameWorldMessageProps {
  title: string;
  children?: ReactNode;
}

export function GameWorld({
  gameId,
  title,
  scoreLabel,
  scoreValue,
  status,
  children,
  onBack,
  backSpeakProps,
  className = ''
}: GameWorldProps) {
  const game = gameDefinitions.find((item) => item.id === gameId);
  const backgroundAssetId = game?.backgroundAssetId;
  const worldStyle = backgroundAssetId
    ? { '--game-world-art': `url(${imageAssets[backgroundAssetId]})` } as CSSProperties
    : undefined;

  return (
    <section className={`game-world game-world--${game?.accent ?? 'purple'} game-world--${gameId} ${className}`.trim()} style={worldStyle} dir="rtl">
      <div className="game-world__ambient" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="game-world__hud">
        <Button variant="ghost" className="game-world__back-button" onClick={onBack} {...backSpeakProps}>
          חזרה לתפריט
        </Button>

        <div className="game-world__identity">
          <div className="game-world__icon" aria-hidden="true">
            <GameImage assetId={game?.imageAssetId} alt="" decorative />
            <span>{game?.emoji}</span>
          </div>
          <div>
            <span className="game-world__eyebrow">משחק פעיל</span>
            <h2>{title ?? game?.title}</h2>
          </div>
        </div>

        <div className="game-world__status" aria-live="polite">
          {scoreLabel ? <span>{scoreLabel}</span> : null}
          {scoreValue !== undefined ? <strong>{scoreValue}</strong> : null}
          {status ? <small>{status}</small> : null}
        </div>
      </header>

      <div className="game-world__stage">
        {children}
      </div>
    </section>
  );
}

export function GameWorldMessage({ title, children }: GameWorldMessageProps) {
  return (
    <div className="game-play-card game-play-card--message">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
