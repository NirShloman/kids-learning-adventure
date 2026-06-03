import { QuizQuestion } from '../../types';

type ColorDraft = Omit<QuizQuestion, 'id' | 'category'>;

const allAges: QuizQuestion['age'] = [3, 4, 5, 6];

const colors = [
  { id: 'red', label: 'אדום', emoji: '🔴', distractors: ['green', 'blue'] },
  { id: 'blue', label: 'כחול', emoji: '🔵', distractors: ['yellow', 'red'] },
  { id: 'yellow', label: 'צהוב', emoji: '🟡', distractors: ['green', 'purple'] },
  { id: 'green', label: 'ירוק', emoji: '🟢', distractors: ['red', 'orange'] },
  { id: 'orange', label: 'כתום', emoji: '🟠', distractors: ['blue', 'white'] },
  { id: 'purple', label: 'סגול', emoji: '🟣', distractors: ['yellow', 'green'] },
  { id: 'pink', label: 'ורוד', emoji: '🩷', distractors: ['brown', 'gray'] },
  { id: 'white', label: 'לבן', emoji: '⚪', distractors: ['black', 'orange'] },
  { id: 'black', label: 'שחור', emoji: '⚫', distractors: ['white', 'yellow'] },
  { id: 'brown', label: 'חום', emoji: '🟤', distractors: ['blue', 'pink'] },
  { id: 'gray', label: 'אפור', emoji: '⬜', distractors: ['green', 'red'] }
];

const objectColors = [
  { object: 'בננה', visual: '🍌', colorId: 'yellow' },
  { object: 'תות', visual: '🍓', colorId: 'red' },
  { object: 'דשא', visual: '🌱', colorId: 'green' },
  { object: 'ים', visual: '🌊', colorId: 'blue' },
  { object: 'גזר', visual: '🥕', colorId: 'orange' },
  { object: 'ענבים', visual: '🍇', colorId: 'purple' },
  { object: 'ענן', visual: '☁️', colorId: 'white' },
  { object: 'לילה', visual: '🌙', colorId: 'black' },
  { object: 'שוקולד', visual: '🍫', colorId: 'brown' },
  { object: 'פיל בציור', visual: '🐘', colorId: 'gray' },
  { object: 'פרח עדין', visual: '🌸', colorId: 'pink' },
  { object: 'שמש', visual: '☀️', colorId: 'yellow' },
  { object: 'עלה', visual: '🍃', colorId: 'green' },
  { object: 'שלג', visual: '❄️', colorId: 'white' },
  { object: 'תפוח אדום', visual: '🍎', colorId: 'red' },
  { object: 'תפוח ירוק', visual: '🍏', colorId: 'green' },
  { object: 'לב', visual: '❤️', colorId: 'red' },
  { object: 'כדור ים', visual: '🔵', colorId: 'blue' }
];

function colorById(id: string) {
  const color = colors.find((item) => item.id === id);
  if (!color) throw new Error(`Unknown color id: ${id}`);
  return color;
}

function option(colorId: string): QuizQuestion['options'][number] {
  const color = colorById(colorId);
  return { id: color.id, label: color.label, emoji: color.emoji };
}

function colorOptions(correctId: string, distractorIds: string[]): QuizQuestion['options'] {
  return [correctId, ...distractorIds].map(option);
}

function makeQuestion(draft: ColorDraft, index: number): QuizQuestion {
  return {
    id: `colors-${draft.difficulty}-${String(index + 1).padStart(3, '0')}`,
    category: 'colors',
    ...draft,
    age: [...draft.age],
    options: draft.options.map((item) => ({ ...item }))
  };
}

const identifyColorQuestions: ColorDraft[] = colors.map((color) => ({
  age: [...allAges],
  difficulty: 'easy',
  prompt: `בחרו את הצבע ${color.label}`,
  visual: color.emoji,
  audioText: `בחרו את הצבע ${color.label}`,
  options: colorOptions(color.id, color.distractors),
  correctOptionId: color.id
}));

const objectColorQuestions: ColorDraft[] = objectColors.map((item) => {
  const color = colorById(item.colorId);
  return {
    age: [...allAges],
    difficulty: 'easy',
    prompt: `מה הצבע של ${item.object}?`,
    visual: item.visual,
    audioText: `מה הצבע של ${item.object}?`,
    options: colorOptions(color.id, color.distractors),
    correctOptionId: color.id
  };
});

const matchObjectToColorQuestions: ColorDraft[] = objectColors.slice(0, 16).map((item) => {
  const color = colorById(item.colorId);
  return {
    age: [...allAges],
    difficulty: 'medium',
    prompt: `איזה צבע מתאים ל${item.object}?`,
    visual: item.visual,
    audioText: `איזה צבע מתאים ל${item.object}?`,
    options: colorOptions(color.id, color.distractors),
    correctOptionId: color.id
  };
});

const chooseObjectByColorQuestions: ColorDraft[] = colors.slice(0, 10).map((color) => {
  const correctObject = objectColors.find((item) => item.colorId === color.id) ?? objectColors[0];
  const distractors = objectColors.filter((item) => item.colorId !== color.id).slice(0, 2);
  return {
    age: [...allAges],
    difficulty: 'medium',
    prompt: `איזה פריט יכול להיות ${color.label}?`,
    audioText: `איזה פריט יכול להיות ${color.label}?`,
    options: [
      { id: correctObject.object, label: correctObject.object, emoji: correctObject.visual },
      ...distractors.map((item) => ({ id: item.object, label: item.object, emoji: item.visual }))
    ],
    correctOptionId: correctObject.object
  };
});

const mixingQuestions: ColorDraft[] = [
  { prompt: 'איזה צבע מתקבל מאדום וצהוב?', correct: 'orange', distractors: ['green', 'brown'] },
  { prompt: 'איזה צבע מתקבל מכחול וצהוב?', correct: 'green', distractors: ['orange', 'pink'] },
  { prompt: 'איזה צבע מתקבל מאדום וכחול?', correct: 'purple', distractors: ['yellow', 'green'] },
  { prompt: 'איזה צבע בהיר יותר?', correct: 'white', distractors: ['black', 'brown'] },
  { prompt: 'איזה צבע כהה יותר?', correct: 'black', distractors: ['yellow', 'white'] },
  { prompt: 'איזה צבע נחשב צבע חם?', correct: 'red', distractors: ['blue', 'gray'] },
  { prompt: 'איזה צבע נחשב צבע קר?', correct: 'blue', distractors: ['orange', 'red'] },
  { prompt: 'איזה צבע מתאים לרמזור עצור?', correct: 'red', distractors: ['green', 'blue'] },
  { prompt: 'איזה צבע מתאים לרמזור סע?', correct: 'green', distractors: ['red', 'yellow'] },
  { prompt: 'איזה צבע נראה כמו שמיים בהירים?', correct: 'blue', distractors: ['brown', 'black'] },
  { prompt: 'איזה צבע נראה כמו חול בים?', correct: 'brown', distractors: ['purple', 'green'] },
  { prompt: 'איזה צבע מתאים לענן בהיר?', correct: 'white', distractors: ['orange', 'black'] },
  { prompt: 'איזה צבע מתאים לפרח עדין?', correct: 'pink', distractors: ['gray', 'brown'] },
  { prompt: 'איזה צבע מתאים לענבים?', correct: 'purple', distractors: ['orange', 'white'] },
  { prompt: 'איזה צבע מתאים לגזר?', correct: 'orange', distractors: ['blue', 'black'] },
  { prompt: 'איזה צבע מתאים לעלה?', correct: 'green', distractors: ['purple', 'red'] }
].map((item) => ({
  age: [...allAges],
  difficulty: 'hard',
  prompt: item.prompt,
  audioText: item.prompt,
  options: colorOptions(item.correct, item.distractors),
  correctOptionId: item.correct
}));

export const colorQuestions: QuizQuestion[] = [
  ...identifyColorQuestions,
  ...objectColorQuestions,
  ...matchObjectToColorQuestions,
  ...chooseObjectByColorQuestions,
  ...mixingQuestions
].map(makeQuestion);
