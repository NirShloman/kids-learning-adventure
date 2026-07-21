import { useEffect } from 'react';
import { GameResult } from '../types';
import { Button } from '../components/common/Button';
import { useSpeech } from '../hooks/useSpeech';
import { getStarMessage } from '../utils/helpers';
import { GameImage } from '../components/common/GameImage';
import { RewardAnimation } from '../components/common/RewardAnimation';
import { RiveScene } from '../components/motion/RiveScene';

interface SummaryPageProps {
  result: GameResult;
  title: string;
  voiceEnabled: boolean;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export function SummaryPage({ result, title, voiceEnabled, onPlayAgain, onBackHome }: SummaryPageProps) {
  const { speak, getSpeakProps } = useSpeech(voiceEnabled);
  const starMessage = getStarMessage(result.stars);
  const starFallback = (
    <div className="stars" aria-label={`קיבלתם ${result.stars} כוכבים`}>
      {Array.from({ length: 3 }, (_, index) => (
        <span key={`star-${index}`} className={index < result.stars ? 'stars__active' : 'stars__empty'} aria-hidden="true">★</span>
      ))}
    </div>
  );

  useEffect(() => {
    speak(`סיימתם את ${title}. צברתם ${result.score} מתוך ${result.total}. קיבלתם ${result.stars} כוכבים. ${starMessage}`);
  }, [result.score, result.stars, result.total, speak, starMessage, title]);

  return (
    <section className="summary-card summary-card--premium">
      <RewardAnimation event={result.stars === 3 ? 'confetti' : 'stars'} />
      <GameImage assetId={result.stars >= 3 ? 'trophy' : 'medal'} alt="" className="summary-card__reward" decorative />
      <div className="summary-card__emoji" aria-hidden="true">🏆</div>
      <span className="question-card__tag">סיכום משחק</span>
      <h2>סיימתם את {title}</h2>
      <p>צברתם <strong>{result.score}</strong> מתוך <strong>{result.total}</strong></p>
      <RiveScene scene="reward-stars" event="reveal" stars={result.stars} className="summary-stars-motion" fallback={starFallback} />
      <p className="summary-card__message">{starMessage}</p>
      <div className="summary-card__actions">
        <Button onClick={onPlayAgain} {...getSpeakProps<HTMLButtonElement>('לשחק שוב')}>לשחק שוב</Button>
        <Button variant="secondary" onClick={onBackHome} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>לתפריט המשחקים</Button>
      </div>
    </section>
  );
}
