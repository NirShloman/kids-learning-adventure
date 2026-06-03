import {
  Age,
  Difficulty,
  MatchingPair,
  MemoryCard,
  PatternPuzzle,
  QuizQuestion,
  SortingChallenge
} from '../types';

interface QuestionReview {
  questionId: string;
  approved: boolean;
  notes: string[];
}

interface QuestionBankReview {
  approved: boolean;
  reviews: QuestionReview[];
  summary: {
    totalItems: number;
    rejectedItems: number;
    coverageIssues: number;
  };
}

interface ReviewableBank {
  letters: QuizQuestion[];
  numbers: QuizQuestion[];
  shapes: QuizQuestion[];
  colors: QuizQuestion[];
  matchingPairs: MatchingPair[];
  memoryCards: MemoryCard[];
  patternPuzzles: PatternPuzzle[];
  sortingChallenges: SortingChallenge[];
}

const AGES: Age[] = [3, 4, 5, 6];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const MAX_PROMPT_LENGTH_BY_AGE: Record<Age, number> = {
  3: 72,
  4: 88,
  5: 112,
  6: 132
};

const MIN_ITEMS_BY_GAME = {
  quiz: 8,
  matchingPairs: 6,
  memoryPairs: 6,
  patternPuzzles: 5,
  sortingChallenges: 5
} as const;

function hasDuplicateValues(values: string[]): boolean {
  const normalizedValues = values.map((value) => value.trim()).filter(Boolean);
  return new Set(normalizedValues).size !== normalizedValues.length;
}

function hasHebrewText(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

function hasCorrectOption(item: { options: { id: string }[]; correctOptionId: string }): boolean {
  return item.options.some((option) => option.id === item.correctOptionId);
}

function isPromptShortEnough(item: { age: Age[]; prompt: string }): boolean {
  return item.age.every((age) => item.prompt.length <= MAX_PROMPT_LENGTH_BY_AGE[age]);
}

function hasValidAgeAndDifficulty(item: { age: Age[]; difficulty: Difficulty }): boolean {
  return item.age.length > 0 && item.age.every((age) => AGES.includes(age)) && DIFFICULTIES.includes(item.difficulty);
}

function reviewOptions(item: { options: { id: string; label: string }[]; correctOptionId: string }, notes: string[]): void {
  if (item.options.length < 3) notes.push('נדרשות לפחות שלוש אפשרויות כדי לשמור על מבנה משחק עקבי.');
  if (item.options.some((option) => !option.id.trim() || !option.label.trim())) notes.push('כל אפשרות תשובה חייבת לכלול מזהה ותווית ברורים.');
  if (hasDuplicateValues(item.options.map((option) => option.id))) notes.push('נמצאו מזהי תשובות כפולים.');
  if (hasDuplicateValues(item.options.map((option) => option.label))) notes.push('נמצאו אפשרויות תשובה כפולות.');
  if (!hasCorrectOption(item)) notes.push('התשובה הנכונה אינה קיימת ברשימת האפשרויות.');
}

function reviewPrompt(item: { age: Age[]; difficulty: Difficulty; prompt: string }, notes: string[]): void {
  if (!hasValidAgeAndDifficulty(item)) notes.push('הפריט חייב לכלול גיל ורמת קושי תקפים.');
  if (!hasHebrewText(item.prompt) || item.prompt.trim().length < 4) notes.push('הניסוח חייב להיות בעברית ברורה וקצרה.');
  if (!isPromptShortEnough(item)) notes.push('נוסח השאלה ארוך מדי לגיל היעד.');
  if (/[!?]{2,}/.test(item.prompt)) notes.push('יש להימנע מסימני קריאה או שאלה כפולים שמעמיסים על הילד.');
}

function reviewQuizQuestion(question: QuizQuestion): QuestionReview {
  const notes: string[] = [];

  reviewPrompt(question, notes);
  reviewOptions(question, notes);

  const hasOptionVisualSupport = question.options.some((option) => Boolean(option.emoji) || /\d/.test(option.label));
  const hasQuestionVisualSupport = Boolean(question.visual || question.imageAssetId || hasOptionVisualSupport);

  if (!question.audioText?.trim()) notes.push('מומלץ לכלול audioText כדי שתיווך קולי יהיה עקבי.');
  if (!hasQuestionVisualSupport) notes.push('שאלה לילדים צעירים צריכה רמז חזותי או אפשרויות עם איורים.');
  if (!hasOptionVisualSupport && !question.visual && !question.imageAssetId) {
    notes.push('מומלץ לשלב תמיכה חזותית בשאלה או באפשרויות.');
  }

  return {
    questionId: question.id,
    approved: notes.length === 0,
    notes
  };
}

function reviewMatchingPair(pair: MatchingPair): QuestionReview {
  const notes: string[] = [];

  if (!hasValidAgeAndDifficulty(pair)) notes.push('הזוג חייב לכלול גיל ורמת קושי תקפים.');
  if (!String(pair.left).trim() || !pair.right.trim()) notes.push('שני צדי ההתאמה חייבים להיות מלאים וברורים.');
  if (!hasHebrewText(pair.right)) notes.push('צד המילה בהתאמה צריך להיות בעברית.');

  return {
    questionId: pair.id,
    approved: notes.length === 0,
    notes
  };
}

function reviewMemoryPair(pairId: string, cards: MemoryCard[]): QuestionReview {
  const notes: string[] = [];

  if (cards.length !== 2) notes.push('במשחק זיכרון כל זוג חייב לכלול בדיוק שני קלפים.');
  if (cards.some((card) => !hasValidAgeAndDifficulty(card))) notes.push('כל קלף חייב לכלול גיל ורמת קושי תקפים.');
  if (hasDuplicateValues(cards.map((card) => card.id))) notes.push('נמצאו מזהי קלפים כפולים בזוג.');
  if (cards.some((card) => !String(card.value).trim())) notes.push('כל קלף חייב לכלול ערך חזותי.');
  if (new Set(cards.map((card) => card.value)).size > 1) notes.push('שני קלפים באותו זוג חייבים להציג אותו ערך.');

  return {
    questionId: pairId,
    approved: notes.length === 0,
    notes
  };
}

function reviewPatternPuzzle(puzzle: PatternPuzzle): QuestionReview {
  const notes: string[] = [];

  reviewPrompt(puzzle, notes);
  reviewOptions(puzzle, notes);

  if (puzzle.sequence.length < 4) notes.push('רצף צריך לכלול לפחות ארבעה פריטים כדי לאפשר זיהוי דפוס.');
  if (puzzle.sequence.filter((item) => item === '?').length !== 1) notes.push('רצף צריך לכלול בדיוק סימן שאלה אחד.');
  if (puzzle.sequence.some((item) => !String(item).trim())) notes.push('כל איברי הרצף חייבים להיות מלאים.');

  return {
    questionId: puzzle.id,
    approved: notes.length === 0,
    notes
  };
}

function reviewSortingChallenge(challenge: SortingChallenge): QuestionReview {
  const notes: string[] = [];

  reviewPrompt(challenge, notes);
  reviewOptions(challenge, notes);

  if (!String(challenge.item).trim() || !challenge.itemName.trim()) notes.push('אתגר מיון חייב לכלול פריט ושם פריט.');
  if (!hasHebrewText(challenge.itemName)) notes.push('שם הפריט למיון צריך להיות בעברית.');

  return {
    questionId: challenge.id,
    approved: notes.length === 0,
    notes
  };
}

function reviewDuplicateIds(kind: string, ids: string[]): QuestionReview[] {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) duplicated.add(id);
    seen.add(id);
  });

  return [...duplicated].map((id) => ({
    questionId: `${kind}:${id}`,
    approved: false,
    notes: ['נמצא מזהה כפול במאגר.']
  }));
}

function reviewCoverage<T extends { age: Age[]; difficulty: Difficulty }>(
  kind: string,
  items: T[],
  minimum: number
): QuestionReview[] {
  const coverageReviews: QuestionReview[] = [];

  AGES.forEach((age) => {
    DIFFICULTIES.forEach((difficulty) => {
      const count = items.filter((item) => item.age.includes(age) && item.difficulty === difficulty).length;
      if (count < minimum) {
        coverageReviews.push({
          questionId: `${kind}-${age}-${difficulty}`,
          approved: false,
          notes: [`נדרש כיסוי רחב יותר: נמצאו ${count} פריטים בלבד לגיל ${age} ברמת ${difficulty}.`]
        });
      }
    });
  });

  return coverageReviews;
}

function reviewMemoryCoverage(cards: MemoryCard[]): QuestionReview[] {
  const pairRepresentatives = [...new Map(cards.map((card) => [card.pairId, card])).values()];
  return reviewCoverage('memoryCards', pairRepresentatives, MIN_ITEMS_BY_GAME.memoryPairs);
}

export function reviewQuestionAsSpeechTherapist(question: QuizQuestion): QuestionReview {
  return reviewQuizQuestion(question);
}

export function getApprovedQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.filter((question) => reviewQuestionAsSpeechTherapist(question).approved);
}

export function createSpeechTherapistReviewReport(questions: QuizQuestion[]): QuestionReview[] {
  return questions.map(reviewQuestionAsSpeechTherapist);
}

export function reviewQuestionBankContent(questionBank: ReviewableBank): QuestionBankReview {
  const quizQuestions = [
    ...questionBank.letters,
    ...questionBank.numbers,
    ...questionBank.shapes,
    ...questionBank.colors
  ];

  const memoryPairs = [...new Set(questionBank.memoryCards.map((card) => card.pairId))].map((pairId) =>
    reviewMemoryPair(pairId, questionBank.memoryCards.filter((card) => card.pairId === pairId))
  );

  const reviews = [
    ...quizQuestions.map(reviewQuizQuestion),
    ...questionBank.matchingPairs.map(reviewMatchingPair),
    ...memoryPairs,
    ...questionBank.patternPuzzles.map(reviewPatternPuzzle),
    ...questionBank.sortingChallenges.map(reviewSortingChallenge),
    ...reviewDuplicateIds('quiz', quizQuestions.map((question) => question.id)),
    ...reviewDuplicateIds('matchingPairs', questionBank.matchingPairs.map((pair) => pair.id)),
    ...reviewDuplicateIds('memoryCards', questionBank.memoryCards.map((card) => card.id)),
    ...reviewDuplicateIds('patternPuzzles', questionBank.patternPuzzles.map((puzzle) => puzzle.id)),
    ...reviewDuplicateIds('sortingChallenges', questionBank.sortingChallenges.map((challenge) => challenge.id)),
    ...reviewCoverage('letters', questionBank.letters, MIN_ITEMS_BY_GAME.quiz),
    ...reviewCoverage('numbers', questionBank.numbers, MIN_ITEMS_BY_GAME.quiz),
    ...reviewCoverage('shapes', questionBank.shapes, MIN_ITEMS_BY_GAME.quiz),
    ...reviewCoverage('colors', questionBank.colors, MIN_ITEMS_BY_GAME.quiz),
    ...reviewCoverage('matchingPairs', questionBank.matchingPairs, MIN_ITEMS_BY_GAME.matchingPairs),
    ...reviewMemoryCoverage(questionBank.memoryCards),
    ...reviewCoverage('patternPuzzles', questionBank.patternPuzzles, MIN_ITEMS_BY_GAME.patternPuzzles),
    ...reviewCoverage('sortingChallenges', questionBank.sortingChallenges, MIN_ITEMS_BY_GAME.sortingChallenges)
  ];

  const rejectedItems = reviews.filter((review) => !review.approved).length;
  const coverageIssues = reviews.filter((review) => review.questionId.includes('-3-') || review.questionId.includes('-4-') || review.questionId.includes('-5-') || review.questionId.includes('-6-')).length;

  return {
    approved: rejectedItems === 0,
    reviews,
    summary: {
      totalItems: quizQuestions.length + questionBank.matchingPairs.length + questionBank.memoryCards.length + questionBank.patternPuzzles.length + questionBank.sortingChallenges.length,
      rejectedItems,
      coverageIssues
    }
  };
}

export function assertQuestionBankContentApproved(questionBank: ReviewableBank): void {
  const report = reviewQuestionBankContent(questionBank);
  if (report.approved) return;

  const issueSummary = report.reviews
    .filter((review) => !review.approved)
    .slice(0, 20)
    .map((review) => `${review.questionId}: ${review.notes.join(' ')}`)
    .join('\n');

  throw new Error(`Question bank quality review failed with ${report.summary.rejectedItems} issue(s).\n${issueSummary}`);
}
