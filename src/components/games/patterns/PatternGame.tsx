import { useEffect, useMemo, useState } from 'react';
import { Age, Difficulty } from '../../../types';
import { getPatternPuzzles } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { calculateStars, getEncouragementMessage } from '../../../utils/helpers';
import { gameInstructions } from '../../../data/gameInstructions';

interface PatternGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function PatternGame({ age, difficulty, voiceEnabled, onBack, onFinish }: PatternGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const puzzles = useMemo(() => getPatternPuzzles(age, difficulty), [age, difficulty]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const currentPuzzle = puzzles[currentIndex];
  const total = puzzles.length;

  useEffect(() => {
    if (!currentPuzzle) return;
    const prefix = currentIndex === 0 ? `${gameInstructions.patterns.intro} ` : '';
    speak(`${prefix}${currentPuzzle.audioText ?? currentPuzzle.prompt}`);
    return stop;
  }, [currentIndex, currentPuzzle, speak, stop]);

  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      onFinish(score, total, calculateStars(score, total));
    }
  }, [currentIndex, onFinish, score, total]);

  function submitAnswer(optionId: string) {
    if (isAnswered || !currentPuzzle) return;
    const isCorrect = optionId === currentPuzzle.correctOptionId;
    const message = getEncouragementMessage(isCorrect);
    setSelectedOptionId(optionId);
    setFeedback(message);
    setIsAnswered(true);
    speak(message);
    if (isCorrect) setScore((previous) => previous + 1);
  }

  function nextPuzzle() {
    if (!isAnswered) return;
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);
    setCurrentIndex((previous) => previous + 1);
  }

  if (!currentPuzzle) return null;

  return (
    <section className="panel game-panel game-panel--patterns">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">ניקוד: {score}</div>
      </div>

      <ProgressBar current={currentIndex + 1} total={total} />

      <div className="question-card question-card--animated">
        <span className="question-card__tag">🌈 משחק רצפים</span>
        <h2>{currentPuzzle.prompt}</h2>
        <p>הסתכלו על הסדר וחפשו מה חוזר.</p>

        <div className="pattern-strip" aria-label="רצף להשלמה">
          {currentPuzzle.sequence.map((item, index) => (
            <span className={`pattern-strip__item${item === '?' ? ' pattern-strip__item--missing' : ''}`} key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>

        <div className="options-grid">
          {currentPuzzle.options.map((option) => {
            const isCorrectOption = option.id === currentPuzzle.correctOptionId;
            const isSelected = option.id === selectedOptionId;
            const optionClassName = ['option-card', isAnswered && isCorrectOption ? 'option-card--correct' : '', isAnswered && isSelected && !isCorrectOption ? 'option-card--wrong' : ''].join(' ').trim();
            return (
              <button key={option.id} type="button" className={optionClassName} onClick={() => submitAnswer(option.id)} disabled={isAnswered} {...getSpeakProps<HTMLButtonElement>(`${option.label}`)}>
                {option.emoji ? <span>{option.emoji}</span> : null}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {feedback ? <div className={`feedback ${isAnswered ? 'feedback--visible' : ''}`}>{feedback}</div> : null}

        <div className="question-card__actions">
          <Button onClick={nextPuzzle} disabled={!isAnswered} {...getSpeakProps<HTMLButtonElement>('לרצף הבא')}>לרצף הבא</Button>
        </div>
      </div>
    </section>
  );
}
