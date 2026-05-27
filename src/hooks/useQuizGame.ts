import { useMemo, useState } from 'react';
import { QuizQuestion } from '../types';
import { calculateStars, getEncouragementMessage } from '../utils/helpers';

export function useQuizGame(questions: QuizQuestion[]) {
  const safeQuestions = useMemo(() => questions, [questions]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = safeQuestions[currentIndex];
  const isFinished = currentIndex >= safeQuestions.length;

  function submitAnswer(optionId: string) {
    if (isAnswered || !currentQuestion) return;

    const isCorrect = optionId === currentQuestion.correctOptionId;
    setSelectedOptionId(optionId);
    setFeedback(getEncouragementMessage(isCorrect));
    setIsAnswered(true);

    if (isCorrect) setScore((previous) => previous + 1);
  }

  function nextQuestion() {
    if (!isAnswered) return;
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);
    setCurrentIndex((previous) => previous + 1);
  }

  return {
    currentQuestion,
    currentIndex,
    score,
    selectedOptionId,
    feedback,
    isAnswered,
    isFinished,
    total: safeQuestions.length,
    stars: calculateStars(score, safeQuestions.length),
    submitAnswer,
    nextQuestion
  };
}
