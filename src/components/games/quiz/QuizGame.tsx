import { useEffect } from 'react';
import { GameId, QuizQuestion } from '../../../types';
import { useQuizGame } from '../../../hooks/useQuizGame';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { AudioButton } from '../../common/AudioButton';
import { gameInstructions } from '../../../data/gameInstructions';
import { GameImage } from '../../common/GameImage';
import { AnimatedFeedback } from '../../common/AnimatedFeedback';
import { GameWorld } from '../GameWorld';

interface QuizGameProps {
  title: string;
  gameId: Extract<GameId, 'letters' | 'numbers' | 'shapes' | 'colors'>;
  questions: QuizQuestion[];
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function QuizGame({ title, gameId, questions, voiceEnabled, onBack, onFinish }: QuizGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const { currentQuestion, currentIndex, score, selectedOptionId, feedback, isAnswered, isFinished, total, stars, submitAnswer, nextQuestion } = useQuizGame(questions);

  useEffect(() => {
    if (!currentQuestion) return;
    const prefix = currentIndex === 0 ? `${gameInstructions[gameId].intro} ` : '';
    speak(`${prefix}${currentQuestion.audioText ?? currentQuestion.prompt}`);
    return stop;
  }, [currentIndex, currentQuestion, gameId, speak, stop]);

  useEffect(() => {
    if (isAnswered && feedback) speak(feedback);
  }, [feedback, isAnswered, speak]);

  useEffect(() => {
    if (isFinished) onFinish(score, total, stars);
  }, [isFinished, onFinish, score, stars, total]);

  if (isFinished || !currentQuestion) return null;

  return (
    <GameWorld
      gameId={gameId}
      title={title}
      scoreLabel="ניקוד"
      scoreValue={score}
      status={`${currentIndex + 1}/${total}`}
      onBack={onBack}
      backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}
      className="game-world--quiz"
    >
      <ProgressBar current={currentIndex + 1} total={total} />

      <div className={`game-play-card game-play-card--quiz game-play-card--${gameId}`}>
        <div className="question-card__topline">
          <span className="question-card__tag">{title}</span>
          <AudioButton text={currentQuestion.audioText ?? currentQuestion.prompt} onSpeak={speak} disabled={!voiceEnabled} />
        </div>

        <h2>{currentQuestion.prompt}</h2>
        {currentQuestion.subtitle ? <p>{currentQuestion.subtitle}</p> : null}

        <div className="game-visual-zone">
          {currentQuestion.imageAssetId ? <GameImage assetId={currentQuestion.imageAssetId} alt={currentQuestion.prompt} className="question-card__image" /> : null}
          {currentQuestion.visual ? <div className="question-card__visual game-token game-token--hero">{currentQuestion.visual}</div> : null}
        </div>

        <div className="options-grid game-options-grid">
          {currentQuestion.options.map((option) => {
            const isCorrectOption = option.id === currentQuestion.correctOptionId;
            const isSelected = option.id === selectedOptionId;
            const optionClassName = ['option-card', 'game-answer-token', isAnswered && isCorrectOption ? 'option-card--correct' : '', isAnswered && isSelected && !isCorrectOption ? 'option-card--wrong' : ''].join(' ').trim();
            return (
              <button
                key={option.id}
                type="button"
                className={optionClassName}
                data-testid="quiz-option"
                data-correct={isCorrectOption ? 'true' : 'false'}
                onClick={() => submitAnswer(option.id)}
                disabled={isAnswered}
                {...getSpeakProps<HTMLButtonElement>(option.label)}
              >
                {option.emoji ? <span>{option.emoji}</span> : null}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatedFeedback message={feedback} tone={isAnswered && selectedOptionId === currentQuestion.correctOptionId ? 'correct' : 'wrong'} />

        <div className="question-card__actions">
          <Button onClick={nextQuestion} disabled={!isAnswered} {...getSpeakProps<HTMLButtonElement>('לשאלה הבאה')}>לשאלה הבאה</Button>
        </div>
      </div>
    </GameWorld>
  );
}
