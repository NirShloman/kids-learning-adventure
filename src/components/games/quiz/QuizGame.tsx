import { useEffect } from 'react';
import { GameId, QuizQuestion } from '../../../types';
import { useQuizGame } from '../../../hooks/useQuizGame';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { ProgressBar } from '../../common/ProgressBar';
import { AudioButton } from '../../common/AudioButton';
import { gameInstructions } from '../../../data/gameInstructions';

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
    <section className="panel game-panel game-panel--quiz">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">ניקוד: {score}</div>
      </div>

      <ProgressBar current={currentIndex + 1} total={total} />

      <div className="question-card question-card--animated">
        <div className="question-card__topline">
          <span className="question-card__tag">{title}</span>
          <AudioButton text={currentQuestion.audioText ?? currentQuestion.prompt} onSpeak={speak} disabled={!voiceEnabled} />
        </div>
        <h2>{currentQuestion.prompt}</h2>
        {currentQuestion.subtitle ? <p>{currentQuestion.subtitle}</p> : null}
        {currentQuestion.visual ? <div className="question-card__visual">{currentQuestion.visual}</div> : null}

        <div className="options-grid">
          {currentQuestion.options.map((option) => {
            const isCorrectOption = option.id === currentQuestion.correctOptionId;
            const isSelected = option.id === selectedOptionId;
            const optionClassName = ['option-card', isAnswered && isCorrectOption ? 'option-card--correct' : '', isAnswered && isSelected && !isCorrectOption ? 'option-card--wrong' : ''].join(' ').trim();
            return (
              <button key={option.id} type="button" className={optionClassName} onClick={() => submitAnswer(option.id)} disabled={isAnswered} {...getSpeakProps<HTMLButtonElement>(option.label)}>
                {option.emoji ? <span>{option.emoji}</span> : null}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {feedback ? <div className={`feedback ${isAnswered ? 'feedback--visible' : ''}`}>{feedback}</div> : null}

        <div className="question-card__actions">
          <Button onClick={nextQuestion} disabled={!isAnswered} {...getSpeakProps<HTMLButtonElement>('לשאלה הבאה')}>לשאלה הבאה</Button>
        </div>
      </div>
    </section>
  );
}
