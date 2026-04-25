import { GameResult } from '../types';
import { Button } from '../components/common/Button';

interface SummaryPageProps {
  result: GameResult;
  title: string;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export function SummaryPage({ result, title, onPlayAgain, onBackHome }: SummaryPageProps) {
  return (
    <section className="summary-card">
      <div className="summary-card__emoji">🏆</div>
      <span className="question-card__tag">סיכום משחק</span>
      <h2>סיימתם את {title}</h2>
      <p>צברתם <strong>{result.score}</strong> מתוך <strong>{result.total}</strong></p>
      <div className="stars" aria-label={`קיבלתם ${result.stars} כוכבים`}>
        {Array.from({ length: 3 }, (_, index) => <span key={`star-${index}`} className={index < result.stars ? 'stars__active' : ''}>⭐</span>)}
      </div>
      <div className="summary-card__actions">
        <Button onClick={onPlayAgain}>לשחק שוב</Button>
        <Button variant="secondary" onClick={onBackHome}>למסך הבית</Button>
      </div>
    </section>
  );
}
