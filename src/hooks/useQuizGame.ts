import { useMemo, useRef, useState } from 'react';
import { QuizQuestion } from '../types';
import { calculateStars, getEncouragementMessage } from '../utils/helpers';
import { getActiveProfile, recordLearningEvent } from '../services/learningStoreService';
import { evidenceFormForGame, skillIdsForLegacySkill } from '../learning/skillGraph';

export function useQuizGame(questions: QuizQuestion[]) {
  const safeQuestions = useMemo(() => questions, [questions]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const sessionId = useRef(`manual-quiz-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const questionStartedAt = useRef(performance.now());

  const currentQuestion = safeQuestions[currentIndex];
  const isFinished = currentIndex >= safeQuestions.length;

  function submitAnswer(optionId: string) {
    if (isAnswered || !currentQuestion) return;

    const isCorrect = optionId === currentQuestion.correctOptionId;
    setSelectedOptionId(optionId);
    setFeedback(getEncouragementMessage(isCorrect));
    setIsAnswered(true);

    if (isCorrect) setScore((previous) => previous + 1);
    const profile = getActiveProfile();
    if (profile) recordLearningEvent({ profileId: profile.id, sessionId: sessionId.current,
      contentId: currentQuestion.id, skillIds: currentQuestion.skillIds ?? skillIdsForLegacySkill(currentQuestion.skill),
      gameId: currentQuestion.category, evidenceForm: currentQuestion.evidenceForm ?? evidenceFormForGame(currentQuestion.category, currentQuestion.skill),
      correct: isCorrect, attemptNumber: 1, hintUsed: false,
      responseMs: Math.round(performance.now() - questionStartedAt.current), monotonicMs: Math.round(performance.now()) });
  }

  function nextQuestion() {
    if (!isAnswered) return;
    setSelectedOptionId(null);
    setFeedback('');
    setIsAnswered(false);
    setCurrentIndex((previous) => previous + 1);
    questionStartedAt.current = performance.now();
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
