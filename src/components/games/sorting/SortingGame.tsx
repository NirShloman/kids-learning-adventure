import { useEffect, useMemo, useState } from 'react';
import { Age, Difficulty } from '../../../types';
import { getSortingChallenges } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { calculateStars, getEncouragementMessage } from '../../../utils/helpers';
import { gameInstructions } from '../../../data/gameInstructions';

interface SortingGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function SortingGame({ age, difficulty, voiceEnabled, onBack, onFinish }: SortingGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const challenges = useMemo(() => getSortingChallenges(age, difficulty), [age, difficulty]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const currentChallenge = challenges[currentIndex];
  const total = challenges.length;

  useEffect(() => {
    if (!currentChallenge) return;
    const prefix = currentIndex === 0 ? `${gameInstructions.sorting.intro} ` : '';
    speak(`${prefix}${currentChallenge.audioText ?? currentChallenge.prompt}`);
    return stop;
  }, [currentChallenge, currentIndex, speak, stop]);

  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      onFinish(score, total, calculateStars(score, total));
    }
  }, [currentIndex, onFinish, score, total]);

  function submitAnswer(optionId: string) {
    if (isAnswered || !currentChallenge) return;
    const isCorrect = optionId === currentChallenge.correctOptionId;
    const message = getEncouragementMessage(isCorrect);
    setSelectedOptionId(optionId);
    setFeedback(message);
    setIsAnswered(true);
    speak(message);
    if (isCorrect) setScore((previous) => previous + 1);
  }

  function nextChallenge() {
    if (!isAnswered) return;
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);
    setCurrentIndex((previous) => previous + 1);
  }

  if (!currentChallenge) return null;

  return (
    <section className="panel game-panel game-panel--sorting">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">ניקוד: {score}</div>
      </div>

      <ProgressBar current={currentIndex + 1} total={total} />

      <div className="question-card question-card--animated sorting-card">
        <span className="question-card__tag">🧺 משחק מיון וסיווג</span>
        <h2>{currentChallenge.prompt}</h2>
        <p>בחרו את הסל שהפריט מתאים אליו.</p>

        <div className="sorting-item" aria-label={`הפריט למיון הוא ${currentChallenge.itemName}`} {...getSpeakProps<HTMLDivElement>(currentChallenge.itemName)}>
          <span>{currentChallenge.item}</span>
          <strong>{currentChallenge.itemName}</strong>
        </div>

        <div className="sorting-baskets">
          {currentChallenge.options.map((option) => {
            const isCorrectOption = option.id === currentChallenge.correctOptionId;
            const isSelected = option.id === selectedOptionId;
            const optionClassName = ['sorting-basket', isAnswered && isCorrectOption ? 'sorting-basket--correct' : '', isAnswered && isSelected && !isCorrectOption ? 'sorting-basket--wrong' : ''].join(' ').trim();
            return (
              <button key={option.id} type="button" className={optionClassName} onClick={() => submitAnswer(option.id)} disabled={isAnswered} {...getSpeakProps<HTMLButtonElement>(option.label)}>
                <span className="sorting-basket__emoji">{option.emoji}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {feedback ? <div className={`feedback ${isAnswered ? 'feedback--visible' : ''}`}>{feedback}</div> : null}

        <div className="question-card__actions">
          <Button onClick={nextChallenge} disabled={!isAnswered} {...getSpeakProps<HTMLButtonElement>('לפריט הבא')}>לפריט הבא</Button>
        </div>
      </div>
    </section>
  );
}
