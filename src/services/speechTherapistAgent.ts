import { Age, Difficulty, QuizQuestion } from '../types';

interface QuestionReview {
  questionId: string;
  approved: boolean;
  notes: string[];
}

const MAX_PROMPT_LENGTH_BY_AGE: Record<Age, number> = {
  3: 64,
  4: 78,
  5: 96,
  6: 116
};

const DIFFICULTY_BY_AGE: Record<Age, Difficulty[]> = {
  3: ['easy'],
  4: ['easy', 'medium'],
  5: ['medium', 'hard'],
  6: ['medium', 'hard']
};

function hasDuplicateOptions(question: QuizQuestion): boolean {
  const labels = question.options.map((option) => option.label.trim());
  return new Set(labels).size !== labels.length;
}

function hasCorrectOption(question: QuizQuestion): boolean {
  return question.options.some((option) => option.id === question.correctOptionId);
}

function isPromptShortEnough(question: QuizQuestion): boolean {
  return question.age.every((age) => question.prompt.length <= MAX_PROMPT_LENGTH_BY_AGE[age]);
}

function isDifficultySuitable(question: QuizQuestion): boolean {
  return question.age.some((age) => DIFFICULTY_BY_AGE[age].includes(question.difficulty));
}

function hasClearHebrewPrompt(question: QuizQuestion): boolean {
  return /[א-ת]/.test(question.prompt) && question.prompt.trim().length > 4;
}

export function reviewQuestionAsSpeechTherapist(question: QuizQuestion): QuestionReview {
  const notes: string[] = [];

  if (!hasClearHebrewPrompt(question)) notes.push('השאלה חייבת להיות בעברית ברורה וקצרה.');
  if (question.options.length < 3) notes.push('נדרשות לפחות שלוש אפשרויות כדי לשמור על מבנה משחק עקבי.');
  if (hasDuplicateOptions(question)) notes.push('נמצאו אפשרויות תשובה כפולות.');
  if (!hasCorrectOption(question)) notes.push('התשובה הנכונה אינה קיימת ברשימת האפשרויות.');
  if (!isPromptShortEnough(question)) notes.push('נוסח השאלה ארוך מדי לגיל היעד.');
  if (!isDifficultySuitable(question)) notes.push('רמת הקושי אינה תואמת מספיק לגיל היעד.');

  return {
    questionId: question.id,
    approved: notes.length === 0,
    notes
  };
}

export function getApprovedQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.filter((question) => reviewQuestionAsSpeechTherapist(question).approved);
}

export function createSpeechTherapistReviewReport(questions: QuizQuestion[]): QuestionReview[] {
  return questions.map(reviewQuestionAsSpeechTherapist);
}
