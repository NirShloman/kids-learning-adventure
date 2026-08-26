import { useEffect, useState } from 'react';
import { Age, Difficulty, PatternPuzzle } from '../../../types';
import { getPatternPuzzles } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { calculateStars, getEncouragementMessage } from '../../../utils/helpers';
import { gameInstructions } from '../../../data/gameInstructions';
import { GameWorld, GameWorldMessage } from '../GameWorld';
import { AnimatedFeedback } from '../../common/AnimatedFeedback';
import { motion } from 'motion/react';
import { recordActiveAttempt } from '../../../services/learningEvidenceService';

interface PatternGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function PatternGame({ age, difficulty, voiceEnabled, onBack, onFinish }: PatternGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const [puzzles, setPuzzles] = useState<PatternPuzzle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const currentPuzzle = puzzles[currentIndex];
  const total = puzzles.length;

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);

    getPatternPuzzles(age, difficulty)
      .then((items) => {
        if (!isActive) return;
        setPuzzles(items);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setPuzzles([]);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [age, difficulty]);

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
    recordActiveAttempt(currentPuzzle, 'patterns', isCorrect);
  }

  function nextPuzzle() {
    if (!isAnswered) return;
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);
    setCurrentIndex((previous) => previous + 1);
  }

  if (isLoading) {
    return (
      <GameWorld gameId="patterns" scoreLabel="ניקוד" scoreValue={score} status="בונים רצף" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="טוענים רצפים..." />
      </GameWorld>
    );
  }

  if (!currentPuzzle) {
    return (
      <GameWorld gameId="patterns" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="אין רצפים זמינים כרגע">
          <Button onClick={onBack}>חזרה</Button>
        </GameWorldMessage>
      </GameWorld>
    );
  }

  return (
    <GameWorld gameId="patterns" scoreLabel="ניקוד" scoreValue={score} status={`${currentIndex + 1}/${total}`} onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
      <ProgressBar current={currentIndex + 1} total={total} />

      <div className="game-play-card game-play-card--patterns">
        <span className="question-card__tag">משחק רצפים</span>
        <h2>{currentPuzzle.prompt}</h2>
        <p>הסתכלו על הסדר וחפשו מה חוזר.</p>

        <div className="pattern-strip game-pattern-track" aria-label="רצף להשלמה">
          {currentPuzzle.sequence.map((item, index) => (
            <span className={`pattern-strip__item game-token ${item === '?' ? 'pattern-strip__item--missing game-token--missing' : ''}`} key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>

        <div className="options-grid game-options-grid">
          {currentPuzzle.options.map((option) => {
            const isCorrectOption = option.id === currentPuzzle.correctOptionId;
            const isSelected = option.id === selectedOptionId;
            const optionClassName = ['option-card', 'game-answer-token', isAnswered && isCorrectOption ? 'option-card--correct' : '', isAnswered && isSelected && !isCorrectOption ? 'option-card--wrong' : ''].join(' ').trim();
            return (
              <motion.button
                key={option.id}
                type="button"
                className={optionClassName}
                data-testid="pattern-option"
                data-correct={isCorrectOption ? 'true' : 'false'}
                onClick={() => submitAnswer(option.id)}
                disabled={isAnswered}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.96 }}
                {...getSpeakProps<HTMLButtonElement>(option.label)}
              >
                {option.emoji ? <span>{option.emoji}</span> : null}
                <span>{option.label}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatedFeedback message={feedback} tone={isAnswered && selectedOptionId === currentPuzzle.correctOptionId ? 'correct' : 'wrong'} />

        <div className="question-card__actions">
          <Button onClick={nextPuzzle} disabled={!isAnswered} {...getSpeakProps<HTMLButtonElement>('לרצף הבא')}>לרצף הבא</Button>
        </div>
      </div>
    </GameWorld>
  );
}
