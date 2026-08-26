import { useEffect } from 'react';
import type { ExperienceGameId, GameMode } from '../../../types';
import { useSpeech } from '../../../hooks/useSpeech';
import { GameWorld } from '../GameWorld';
import { AmbientVideo } from '../../common/AmbientVideo';

interface GameModeSelectorProps {
  gameId: ExperienceGameId;
  title: string;
  voiceEnabled: boolean;
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export function GameModeSelector({ gameId, title, voiceEnabled, onSelect, onBack }: GameModeSelectorProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);

  useEffect(() => {
    speak(`איך תרצו לשחק ב${title}? אפשר לצאת להרפתקה, או לשחק בחידון.`);
    return stop;
  }, [speak, stop, title]);

  return (
    <GameWorld gameId={gameId} title={title} status="בוחרים משחק" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
      <div className="game-play-card game-mode-selector">
        {gameId === 'numbers' && (
          <AmbientVideo
            src="/assets/video/counting-orchard.mp4"
            poster="/assets/video/counting-orchard.poster.webp"
            className="game-mode-cinematic"
            fallback={<div className="game-mode-cinematic__fallback" />}
            ariaLabel="שיר וניר סופרים תפוחים במטע"
          />
        )}
        <span className="question-card__tag">איך משחקים היום?</span>
        <h2>בחרו דרך לשחק</h2>
        <p>אפשר לבחור במשחק חווייתי במגע ישיר, או בחידון המוכר.</p>
        <div className="game-mode-selector__options">
          <button type="button" className="game-mode-card game-mode-card--featured" onClick={() => onSelect('experience')} {...getSpeakProps<HTMLButtonElement>('משחק חווייתי, נוגעים במקום ובפריטים כדי לשחק')}>
            <span className="game-mode-card__icon" aria-hidden="true">🎮</span>
            <strong>משחק חווייתי</strong>
            <span>זזים, אוספים, בונים וצובעים</span>
            <kbd>נוגעים ומשחקים</kbd>
          </button>
          <button type="button" className="game-mode-card" onClick={() => onSelect('quiz')} {...getSpeakProps<HTMLButtonElement>('טריוויה, בוחרים את התשובה הנכונה')}>
            <span className="game-mode-card__icon" aria-hidden="true">💡</span>
            <strong>טריוויה</strong>
            <span>מקשיבים ובוחרים תשובה</span>
          </button>
        </div>
      </div>
    </GameWorld>
  );
}
