import { QuizQuestion } from '../../types';

type NumberDraft = Omit<QuizQuestion, 'id' | 'category'>;

const allAges: QuizQuestion['age'] = [3, 4, 5, 6];

const numberWords: Record<number, string> = {
  0: 'אפס',
  1: 'אחת',
  2: 'שתיים',
  3: 'שלוש',
  4: 'ארבע',
  5: 'חמש',
  6: 'שש',
  7: 'שבע',
  8: 'שמונה',
  9: 'תשע',
  10: 'עשר',
  11: 'אחת עשרה',
  12: 'שתים עשרה'
};

const countCards = [
  { item: 'תפוחים', visual: '🍎', count: 1 },
  { item: 'כדורים', visual: '⚽', count: 2 },
  { item: 'כוכבים', visual: '⭐', count: 3 },
  { item: 'בננות', visual: '🍌', count: 4 },
  { item: 'פרחים', visual: '🌸', count: 5 },
  { item: 'עפרונות', visual: '✏️', count: 6 },
  { item: 'בלונים', visual: '🎈', count: 7 },
  { item: 'ספרים', visual: '📘', count: 8 },
  { item: 'קוביות', visual: '🎲', count: 9 },
  { item: 'לבבות', visual: '❤️', count: 10 },
  { item: 'שמשות', visual: '☀️', count: 3 },
  { item: 'מכוניות', visual: '🚗', count: 5 },
  { item: 'גזרים', visual: '🥕', count: 6 },
  { item: 'דגים', visual: '🐟', count: 4 },
  { item: 'ירחים', visual: '🌙', count: 2 },
  { item: 'כוסות', visual: '🥤', count: 7 }
];

const additionFacts = [
  [1, 1],
  [1, 2],
  [2, 2],
  [2, 3],
  [3, 3],
  [4, 2],
  [5, 1],
  [3, 4],
  [4, 4],
  [5, 3],
  [6, 2],
  [7, 1],
  [2, 5],
  [1, 6],
  [3, 5],
  [6, 3]
] as const;

const subtractionFacts = [
  [3, 1],
  [4, 2],
  [5, 2],
  [6, 1],
  [7, 2],
  [8, 3],
  [9, 4],
  [10, 5],
  [6, 3],
  [8, 2],
  [9, 3],
  [10, 4]
] as const;

function option(value: number | string): QuizQuestion['options'][number] {
  const label = String(value);
  return { id: label, label };
}

function numberOptions(correct: number, distractors: number[]): QuizQuestion['options'] {
  return [correct, ...distractors].map(option);
}

function repeatedVisual(symbol: string, count: number): string {
  return Array.from({ length: count }, () => symbol).join(' ');
}

function nearbyOptions(correct: number): number[] {
  const first = Math.max(0, correct - 1);
  const second = correct + 1;
  return Array.from(new Set([first, second, correct + 2])).filter((value) => value !== correct).slice(0, 2);
}

function makeQuestion(draft: NumberDraft, index: number): QuizQuestion {
  return {
    id: `numbers-${draft.difficulty}-${String(index + 1).padStart(3, '0')}`,
    category: 'numbers',
    ...draft,
    age: [...draft.age],
    options: draft.options.map((item) => ({ ...item }))
  };
}

const countingQuestions: NumberDraft[] = countCards.map((card) => ({
  age: [...allAges],
  difficulty: 'easy',
  prompt: `כמה ${card.item} יש כאן?`,
  visual: repeatedVisual(card.visual, card.count),
  audioText: `כמה ${card.item} יש כאן?`,
  options: numberOptions(card.count, nearbyOptions(card.count)),
  correctOptionId: String(card.count)
}));

const digitRecognitionQuestions: NumberDraft[] = Array.from({ length: 10 }, (_, index) => index + 1).map((number) => ({
  age: [...allAges],
  difficulty: 'easy',
  prompt: `בחרו את המספר ${number}`,
  visual: String(number),
  audioText: `בחרו את המספר ${numberWords[number]}`,
  options: numberOptions(number, nearbyOptions(number)),
  correctOptionId: String(number)
}));

const nextNumberQuestions: NumberDraft[] = Array.from({ length: 10 }, (_, index) => index + 1).map((number) => ({
  age: [...allAges],
  difficulty: 'medium',
  prompt: `מה בא אחרי ${number}?`,
  audioText: `מה בא אחרי המספר ${numberWords[number]}?`,
  options: numberOptions(number + 1, [number, number + 2]),
  correctOptionId: String(number + 1)
}));

const previousNumberQuestions: NumberDraft[] = Array.from({ length: 9 }, (_, index) => index + 2).map((number) => ({
  age: [...allAges],
  difficulty: 'medium',
  prompt: `מה בא לפני ${number}?`,
  audioText: `מה בא לפני המספר ${numberWords[number]}?`,
  options: numberOptions(number - 1, [number, Math.max(0, number - 2)]),
  correctOptionId: String(number - 1)
}));

const compareQuestions: NumberDraft[] = [
  { prompt: 'איזה מספר גדול מ-3?', correct: 4, distractors: [2, 3] },
  { prompt: 'איזה מספר קטן מ-5?', correct: 4, distractors: [5, 6] },
  { prompt: 'איזה מספר גדול מ-6?', correct: 7, distractors: [5, 6] },
  { prompt: 'איזה מספר קטן מ-8?', correct: 7, distractors: [8, 9] },
  { prompt: 'איזה מספר נמצא בין 2 ל-4?', correct: 3, distractors: [2, 5] },
  { prompt: 'איזה מספר נמצא בין 5 ל-7?', correct: 6, distractors: [4, 8] },
  { prompt: 'איזה מספר הוא זוגי?', correct: 6, distractors: [7, 9] },
  { prompt: 'איזה מספר הוא אי-זוגי?', correct: 5, distractors: [4, 6] }
].map((item) => ({
  age: [...allAges],
  difficulty: 'medium',
  prompt: item.prompt,
  audioText: item.prompt,
  options: numberOptions(item.correct, item.distractors),
  correctOptionId: String(item.correct)
}));

const additionQuestions: NumberDraft[] = additionFacts.map(([left, right]) => {
  const answer = left + right;
  return {
    age: [...allAges],
    difficulty: 'hard',
    prompt: `כמה זה ${left} ועוד ${right}?`,
    visual: `${left} + ${right}`,
    audioText: `כמה זה ${numberWords[left]} ועוד ${numberWords[right]}?`,
    options: numberOptions(answer, nearbyOptions(answer)),
    correctOptionId: String(answer)
  };
});

const subtractionQuestions: NumberDraft[] = subtractionFacts.map(([left, right]) => {
  const answer = left - right;
  return {
    age: [...allAges],
    difficulty: 'hard',
    prompt: `כמה זה ${left} פחות ${right}?`,
    visual: `${left} - ${right}`,
    audioText: `כמה זה ${numberWords[left]} פחות ${numberWords[right]}?`,
    options: numberOptions(answer, nearbyOptions(answer)),
    correctOptionId: String(answer)
  };
});

const everydayReasoningQuestions: NumberDraft[] = [
  { prompt: 'כמה גלגלים יש לאופניים?', visual: '🚲', correct: 2, distractors: [3, 4] },
  { prompt: 'כמה אצבעות יש ביד אחת?', visual: '✋', correct: 5, distractors: [4, 6] },
  { prompt: 'כמה זוגות נעליים יש בארבע נעליים?', visual: '👟 👟 👟 👟', correct: 2, distractors: [3, 4] },
  { prompt: 'כמה עיניים יש לפנים?', visual: '🙂', correct: 2, distractors: [1, 3] },
  { prompt: 'כמה צדדים יש למטבע?', visual: '🪙', correct: 2, distractors: [1, 4] },
  { prompt: 'כמה ימים יש בסוף שבוע?', visual: 'שבת + ראשון', correct: 2, distractors: [1, 3] }
].map((item) => ({
  age: [...allAges],
  difficulty: 'hard',
  prompt: item.prompt,
  visual: item.visual,
  audioText: item.prompt,
  options: numberOptions(item.correct, item.distractors),
  correctOptionId: String(item.correct)
}));

export const numberQuestions: QuizQuestion[] = [
  ...countingQuestions,
  ...digitRecognitionQuestions,
  ...nextNumberQuestions,
  ...previousNumberQuestions,
  ...compareQuestions,
  ...additionQuestions,
  ...subtractionQuestions,
  ...everydayReasoningQuestions
].map(makeQuestion);
