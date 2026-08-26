import { useEffect, useState } from 'react';
import { Age, Difficulty, SortingChallenge } from '../../../types';
import { getSortingChallenges } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { calculateStars, getEncouragementMessage } from '../../../utils/helpers';
import { gameInstructions } from '../../../data/gameInstructions';
import { GameWorld, GameWorldMessage } from '../GameWorld';
import { GameImage } from '../../common/GameImage';
import { AnimatedFeedback } from '../../common/AnimatedFeedback';
import { motion } from 'motion/react';
import { recordActiveAttempt } from '../../../services/learningEvidenceService';

interface SortingGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function SortingGame({ age, difficulty, voiceEnabled, onBack, onFinish }: SortingGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const [challenges, setChallenges] = useState<SortingChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const currentChallenge = challenges[currentIndex];
  const total = challenges.length;

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);

    getSortingChallenges(age, difficulty)
      .then((items) => {
        if (!isActive) return;
        setChallenges(items);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setChallenges([]);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [age, difficulty]);

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
    recordActiveAttempt(currentChallenge, 'sorting', isCorrect);
  }

  function nextChallenge() {
    if (!isAnswered) return;
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);
    setCurrentIndex((previous) => previous + 1);
  }

  if (isLoading) {
    return (
      <GameWorld gameId="sorting" scoreLabel="ניקוד" scoreValue={score} status="מסדרים סלים" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="טוענים אתגרי מיון..." />
      </GameWorld>
    );
  }

  if (!currentChallenge) {
    return (
      <GameWorld gameId="sorting" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="אין אתגרי מיון זמינים כרגע">
          <Button onClick={onBack}>חזרה</Button>
        </GameWorldMessage>
      </GameWorld>
    );
  }

  return (
    <GameWorld gameId="sorting" scoreLabel="ניקוד" scoreValue={score} status={`${currentIndex + 1}/${total}`} onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
      <ProgressBar current={currentIndex + 1} total={total} />

      <div className="game-play-card game-play-card--sorting">
        <span className="question-card__tag">משחק מיון וסיווג</span>
        <h2>{currentChallenge.prompt}</h2>
        <p>בחרו את הסל שהפריט מתאים אליו.</p>

        <div className="sorting-item game-sorting-item" aria-label={`הפריט למיון הוא ${currentChallenge.itemName}`} {...getSpeakProps<HTMLDivElement>(currentChallenge.itemName)}>
          {currentChallenge.itemImageAssetId ? <GameImage assetId={currentChallenge.itemImageAssetId} alt="" decorative className="game-token__image" /> : <span>{currentChallenge.item}</span>}
          <strong>{currentChallenge.itemName}</strong>
        </div>

        <div className="sorting-baskets game-sorting-baskets">
          {currentChallenge.options.map((option) => {
            const isCorrectOption = option.id === currentChallenge.correctOptionId;
            const isSelected = option.id === selectedOptionId;
            const optionClassName = ['sorting-basket', 'game-sorting-basket', isAnswered && isCorrectOption ? 'sorting-basket--correct' : '', isAnswered && isSelected && !isCorrectOption ? 'sorting-basket--wrong' : ''].join(' ').trim();
            return (
              <motion.button
                key={option.id}
                type="button"
                className={optionClassName}
                data-testid="sorting-option"
                data-correct={isCorrectOption ? 'true' : 'false'}
                onClick={() => submitAnswer(option.id)}
                disabled={isAnswered}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                {...getSpeakProps<HTMLButtonElement>(option.label)}
              >
                <span className="sorting-basket__emoji">{option.emoji}</span>
                <span>{option.label}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatedFeedback message={feedback} tone={isAnswered && selectedOptionId === currentChallenge.correctOptionId ? 'correct' : 'wrong'} />

        <div className="question-card__actions">
          <Button onClick={nextChallenge} disabled={!isAnswered} {...getSpeakProps<HTMLButtonElement>('לפריט הבא')}>לפריט הבא</Button>
        </div>
      </div>
    </GameWorld>
  );
}
