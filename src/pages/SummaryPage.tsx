import { useEffect } from 'react';
import { GameResult } from '../types';
import { Button } from '../components/common/Button';
import { useSpeech } from '../hooks/useSpeech';

interface SummaryPageProps {
  result: GameResult;
  title: string;
  voiceEnabled: boolean;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export function SummaryPage({ result, title, voiceEnabled, onPlayAgain, onBackHome }: SummaryPageProps) {
  const { speak, getSpeakProps } = useSpeech(voiceEnabled);

  useEffect(() => {
    speak(`סיימתם את ${title}. צברתם ${result.score} מתוך ${result.total}. קיבלתם ${result.stars} כוכבים.`);
  }, [result.score, result.stars, result.total, speak, title]);

  return (
    <section className="summary-card summary-card--premium">
      <div className="summary-card__emoji" aria-hidden="true">🏆</div>
      <span className="question-card__tag">סיכום משחק</span>
      <h2>סיימתם את {title}</h2>
      <p>צברתם <strong>{result.score}</strong> מתוך <strong>{result.total}</strong></p>
      <div className="stars" aria-label={`קיבלתם ${result.stars} כוכבים`}>
        {Array.from({ length: 3 }, (_, index) => <span key={`star-${index}`} className={index < result.stars ? 'stars__active' : ''}>⭐</span>)}
      </div>
      <div className="summary-card__actions">
        <Button onClick={onPlayAgain} {...getSpeakProps<HTMLButtonElement>('לשחק שוב')}>לשחק שוב</Button>
        <Button variant="secondary" onClick={onBackHome} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>לתפריט המשחקים</Button>
      </div>
    </section>
  );
}
