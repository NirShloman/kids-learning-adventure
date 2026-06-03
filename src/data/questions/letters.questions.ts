import { QuizQuestion } from '../../types';

type LetterDraft = Omit<QuizQuestion, 'id' | 'category'>;

const allAges: QuizQuestion['age'] = [3, 4, 5, 6];

interface WordCard {
  word: string;
  visual: string;
  first: string;
  last: string;
  middle?: string;
  firstDistractors: string[];
  lastDistractors: string[];
}

const wordCards: WordCard[] = [
  { word: 'אבא', visual: '👨', first: 'א', last: 'א', middle: 'ב', firstDistractors: ['ב', 'מ'], lastDistractors: ['ה', 'ב'] },
  { word: 'בית', visual: '🏠', first: 'ב', last: 'ת', middle: 'י', firstDistractors: ['כ', 'ה'], lastDistractors: ['ב', 'ד'] },
  { word: 'דג', visual: '🐟', first: 'ד', last: 'ג', firstDistractors: ['ג', 'ר'], lastDistractors: ['ד', 'ז'] },
  { word: 'כלב', visual: '🐶', first: 'כ', last: 'ב', middle: 'ל', firstDistractors: ['ק', 'ל'], lastDistractors: ['כ', 'ד'] },
  { word: 'תות', visual: '🍓', first: 'ת', last: 'ת', middle: 'ו', firstDistractors: ['ט', 'ש'], lastDistractors: ['ד', 'ט'] },
  { word: 'שמש', visual: '☀️', first: 'ש', last: 'ש', middle: 'מ', firstDistractors: ['ס', 'צ'], lastDistractors: ['ס', 'מ'] },
  { word: 'ספר', visual: '📘', first: 'ס', last: 'ר', middle: 'פ', firstDistractors: ['ש', 'פ'], lastDistractors: ['ס', 'ל'] },
  { word: 'פרח', visual: '🌸', first: 'פ', last: 'ח', middle: 'ר', firstDistractors: ['ב', 'ר'], lastDistractors: ['פ', 'ה'] },
  { word: 'גזר', visual: '🥕', first: 'ג', last: 'ר', middle: 'ז', firstDistractors: ['ד', 'ז'], lastDistractors: ['ג', 'ל'] },
  { word: 'נעל', visual: '👟', first: 'נ', last: 'ל', middle: 'ע', firstDistractors: ['מ', 'ע'], lastDistractors: ['נ', 'ר'] },
  { word: 'בלון', visual: '🎈', first: 'ב', last: 'ן', middle: 'ו', firstDistractors: ['פ', 'ל'], lastDistractors: ['נ', 'ם'] },
  { word: 'ירח', visual: '🌙', first: 'י', last: 'ח', middle: 'ר', firstDistractors: ['ו', 'ר'], lastDistractors: ['י', 'ך'] },
  { word: 'כדור', visual: '⚽', first: 'כ', last: 'ר', middle: 'ד', firstDistractors: ['ק', 'ד'], lastDistractors: ['כ', 'ל'] },
  { word: 'חתול', visual: '🐱', first: 'ח', last: 'ל', middle: 'ת', firstDistractors: ['ה', 'ת'], lastDistractors: ['ח', 'ר'] },
  { word: 'רכבת', visual: '🚂', first: 'ר', last: 'ת', middle: 'כ', firstDistractors: ['ד', 'כ'], lastDistractors: ['ר', 'ב'] },
  { word: 'עיפרון', visual: '✏️', first: 'ע', last: 'ן', middle: 'פ', firstDistractors: ['א', 'פ'], lastDistractors: ['נ', 'ם'] },
  { word: 'מלך', visual: '👑', first: 'מ', last: 'ך', middle: 'ל', firstDistractors: ['נ', 'ל'], lastDistractors: ['כ', 'ם'] },
  { word: 'ים', visual: '🌊', first: 'י', last: 'ם', firstDistractors: ['ו', 'מ'], lastDistractors: ['מ', 'ן'] },
  { word: 'ציפור', visual: '🐦', first: 'צ', last: 'ר', middle: 'פ', firstDistractors: ['ס', 'פ'], lastDistractors: ['צ', 'ל'] },
  { word: 'קוביה', visual: '🎲', first: 'ק', last: 'ה', middle: 'ו', firstDistractors: ['כ', 'ב'], lastDistractors: ['ק', 'י'] },
  { word: 'חלב', visual: '🥛', first: 'ח', last: 'ב', middle: 'ל', firstDistractors: ['כ', 'ל'], lastDistractors: ['ח', 'ד'] },
  { word: 'כוס', visual: '🥤', first: 'כ', last: 'ס', middle: 'ו', firstDistractors: ['ק', 'ס'], lastDistractors: ['כ', 'ש'] },
  { word: 'לחם', visual: '🍞', first: 'ל', last: 'ם', middle: 'ח', firstDistractors: ['מ', 'ח'], lastDistractors: ['מ', 'ן'] },
  { word: 'שעון', visual: '⏰', first: 'ש', last: 'ן', middle: 'ע', firstDistractors: ['ס', 'ע'], lastDistractors: ['נ', 'ם'] }
];

const targetLetters = [
  { letter: 'א', name: 'אלף', distractors: ['ע', 'מ'] },
  { letter: 'ב', name: 'בית', distractors: ['כ', 'פ'] },
  { letter: 'ג', name: 'גימל', distractors: ['ז', 'ד'] },
  { letter: 'ד', name: 'דלת', distractors: ['ר', 'ג'] },
  { letter: 'ה', name: 'הא', distractors: ['ח', 'ת'] },
  { letter: 'ו', name: 'וָו', distractors: ['י', 'ז'] },
  { letter: 'ח', name: 'חית', distractors: ['כ', 'ה'] },
  { letter: 'כ', name: 'כף', distractors: ['ק', 'ב'] },
  { letter: 'ל', name: 'למד', distractors: ['ר', 'ו'] },
  { letter: 'מ', name: 'מם', distractors: ['נ', 'ס'] },
  { letter: 'נ', name: 'נון', distractors: ['מ', 'י'] },
  { letter: 'ס', name: 'סמך', distractors: ['ש', 'צ'] },
  { letter: 'פ', name: 'פא', distractors: ['ב', 'כ'] },
  { letter: 'ר', name: 'ריש', distractors: ['ד', 'ל'] },
  { letter: 'ש', name: 'שין', distractors: ['ס', 'צ'] },
  { letter: 'ת', name: 'תו', distractors: ['ט', 'ח'] }
];

function option(id: string, label: string, emoji?: string): QuizQuestion['options'][number] {
  return emoji ? { id, label, emoji } : { id, label };
}

function letterOptions(correct: string, distractors: string[]): QuizQuestion['options'] {
  return [option(correct, correct), ...distractors.map((letter) => option(letter, letter))];
}

function wordOptions(correct: WordCard, distractors: WordCard[]): QuizQuestion['options'] {
  return [correct, ...distractors].map((card) => option(card.word, card.word, card.visual));
}

function makeQuestion(draft: LetterDraft, index: number): QuizQuestion {
  return {
    id: `letters-${draft.difficulty}-${String(index + 1).padStart(3, '0')}`,
    category: 'letters',
    ...draft,
    age: [...draft.age],
    options: draft.options.map((item) => ({ ...item }))
  };
}

const initialSoundQuestions: LetterDraft[] = wordCards.slice(0, 18).map((card) => ({
  age: [...allAges],
  difficulty: 'easy',
  prompt: `באיזו אות מתחילה המילה ${card.word}?`,
  visual: card.visual,
  audioText: `באיזו אות מתחילה המילה ${card.word}?`,
  options: letterOptions(card.first, card.firstDistractors),
  correctOptionId: card.first
}));

const chooseLetterQuestions: LetterDraft[] = targetLetters.map((item) => ({
  age: [...allAges],
  difficulty: 'easy',
  prompt: `בחרו את האות ${item.letter}`,
  subtitle: `חפשו את האות ${item.name}`,
  visual: item.letter,
  audioText: `בחרו את האות ${item.name}`,
  options: letterOptions(item.letter, item.distractors),
  correctOptionId: item.letter
}));

const wordByFirstLetterQuestions: LetterDraft[] = wordCards.slice(0, 18).map((card, index) => {
  const distractors = wordCards.filter((item) => item.first !== card.first).slice(index % 5, index % 5 + 2);
  return {
    age: [...allAges],
    difficulty: 'medium',
    prompt: `איזו מילה מתחילה באות ${card.first}?`,
    audioText: `איזו מילה מתחילה באות ${card.first}?`,
    options: wordOptions(card, distractors),
    correctOptionId: card.word
  };
});

const missingFirstLetterQuestions: LetterDraft[] = wordCards.slice(6, 24).map((card) => ({
  age: [...allAges],
  difficulty: 'medium',
  prompt: `איזו אות חסרה במילה _${card.word.slice(1)}?`,
  visual: card.visual,
  audioText: `איזו אות חסרה בתחילת המילה ${card.word}?`,
  options: letterOptions(card.first, card.firstDistractors),
  correctOptionId: card.first
}));

const lastLetterQuestions: LetterDraft[] = wordCards.slice(0, 18).map((card) => ({
  age: [...allAges],
  difficulty: 'hard',
  prompt: `באיזו אות מסתיימת המילה ${card.word}?`,
  visual: card.visual,
  audioText: `באיזו אות מסתיימת המילה ${card.word}?`,
  options: letterOptions(card.last, card.lastDistractors),
  correctOptionId: card.last
}));

const middleLetterQuestions: LetterDraft[] = wordCards.filter((card) => card.middle).slice(0, 12).map((card) => ({
  age: [5, 6],
  difficulty: 'hard',
  prompt: `מה האות האמצעית במילה ${card.word}?`,
  visual: card.visual,
  audioText: `מה האות האמצעית במילה ${card.word}?`,
  options: letterOptions(
    card.middle ?? card.first,
    Array.from(new Set([card.first, card.last, ...card.firstDistractors, ...card.lastDistractors]))
      .filter((letter) => letter !== card.middle)
      .slice(0, 2)
  ),
  correctOptionId: card.middle ?? card.first
}));

export const letterQuestions: QuizQuestion[] = [
  ...initialSoundQuestions,
  ...chooseLetterQuestions,
  ...wordByFirstLetterQuestions,
  ...missingFirstLetterQuestions,
  ...lastLetterQuestions,
  ...middleLetterQuestions
].map(makeQuestion);
