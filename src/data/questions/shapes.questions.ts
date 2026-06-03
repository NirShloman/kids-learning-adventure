import { QuizQuestion } from '../../types';

type ShapeDraft = Omit<QuizQuestion, 'id' | 'category'>;

const allAges: QuizQuestion['age'] = [3, 4, 5, 6];

const shapes = [
  { id: 'circle', label: 'עיגול', emoji: '🔵', sides: 0, corners: 0, distractors: ['square', 'triangle'] },
  { id: 'square', label: 'ריבוע', emoji: '🟦', sides: 4, corners: 4, distractors: ['circle', 'triangle'] },
  { id: 'triangle', label: 'משולש', emoji: '🔺', sides: 3, corners: 3, distractors: ['square', 'circle'] },
  { id: 'rectangle', label: 'מלבן', emoji: '▭', sides: 4, corners: 4, distractors: ['circle', 'triangle'] },
  { id: 'star', label: 'כוכב', emoji: '⭐', sides: 5, corners: 5, distractors: ['circle', 'square'] },
  { id: 'oval', label: 'אליפסה', emoji: '🥚', sides: 0, corners: 0, distractors: ['rectangle', 'triangle'] },
  { id: 'diamond', label: 'מעוין', emoji: '🔷', sides: 4, corners: 4, distractors: ['circle', 'star'] },
  { id: 'heart', label: 'לב', emoji: '❤️', sides: 0, corners: 0, distractors: ['square', 'triangle'] }
];

const objectShapes = [
  { object: 'כדור', visual: '⚽', shapeId: 'circle' },
  { object: 'שמש', visual: '☀️', shapeId: 'circle' },
  { object: 'חלון', visual: '🪟', shapeId: 'square' },
  { object: 'דלת', visual: '🚪', shapeId: 'rectangle' },
  { object: 'ספר', visual: '📘', shapeId: 'rectangle' },
  { object: 'פיצה משולשת', visual: '🍕', shapeId: 'triangle' },
  { object: 'גג של בית', visual: '🏠', shapeId: 'triangle' },
  { object: 'שרביט קסמים', visual: '🪄', shapeId: 'star' },
  { object: 'ביצה', visual: '🥚', shapeId: 'oval' },
  { object: 'תמרור אזהרה', visual: '⚠️', shapeId: 'triangle' },
  { object: 'אריח רצפה', visual: '⬜', shapeId: 'square' },
  { object: 'קלף משחק', visual: '🃏', shapeId: 'rectangle' },
  { object: 'לב בציור', visual: '❤️', shapeId: 'heart' },
  { object: 'יהלום בציור', visual: '🔷', shapeId: 'diamond' }
];

function shapeById(id: string) {
  const shape = shapes.find((item) => item.id === id);
  if (!shape) throw new Error(`Unknown shape id: ${id}`);
  return shape;
}

function option(shapeId: string): QuizQuestion['options'][number] {
  const shape = shapeById(shapeId);
  return { id: shape.id, label: shape.label, emoji: shape.emoji };
}

function shapeOptions(correctId: string, distractorIds: string[]): QuizQuestion['options'] {
  return [correctId, ...distractorIds].map(option);
}

function numberOptions(correct: number, distractors: number[]): QuizQuestion['options'] {
  return [correct, ...distractors].map((value) => ({ id: String(value), label: String(value) }));
}

function makeQuestion(draft: ShapeDraft, index: number): QuizQuestion {
  return {
    id: `shapes-${draft.difficulty}-${String(index + 1).padStart(3, '0')}`,
    category: 'shapes',
    ...draft,
    age: [...draft.age],
    options: draft.options.map((item) => ({ ...item }))
  };
}

const identifyShapeQuestions: ShapeDraft[] = shapes.flatMap((shape) => [
  {
    age: [...allAges],
    difficulty: 'easy' as const,
    prompt: 'איזו צורה זו?',
    visual: shape.emoji,
    audioText: `איזו צורה זו?`,
    options: shapeOptions(shape.id, shape.distractors),
    correctOptionId: shape.id
  },
  {
    age: [...allAges],
    difficulty: 'easy' as const,
    prompt: `בחרו ${shape.label}`,
    audioText: `בחרו ${shape.label}`,
    options: shapeOptions(shape.id, shape.distractors),
    correctOptionId: shape.id
  }
]);

const objectShapeQuestions: ShapeDraft[] = objectShapes.map((item) => {
  const shape = shapeById(item.shapeId);
  return {
    age: [...allAges],
    difficulty: 'medium',
    prompt: `איזו צורה דומה ל${item.object}?`,
    visual: item.visual,
    audioText: `איזו צורה דומה ל${item.object}?`,
    options: shapeOptions(shape.id, shape.distractors),
    correctOptionId: shape.id
  };
});

const sidesQuestions: ShapeDraft[] = shapes.filter((shape) => shape.id !== 'heart').map((shape) => ({
  age: [...allAges],
  difficulty: 'medium',
  prompt: `כמה צלעות יש ל${shape.label}?`,
  visual: shape.emoji,
  audioText: `כמה צלעות יש ל${shape.label}?`,
  options: numberOptions(shape.sides, shape.sides === 0 ? [3, 4] : [Math.max(0, shape.sides - 1), shape.sides + 1]),
  correctOptionId: String(shape.sides)
}));

const cornersQuestions: ShapeDraft[] = shapes.filter((shape) => ['circle', 'square', 'triangle', 'rectangle', 'star'].includes(shape.id)).map((shape) => ({
  age: [...allAges],
  difficulty: 'hard',
  prompt: `כמה פינות יש ל${shape.label}?`,
  visual: shape.emoji,
  audioText: `כמה פינות יש ל${shape.label}?`,
  options: numberOptions(shape.corners, shape.corners === 0 ? [3, 4] : [Math.max(0, shape.corners - 1), shape.corners + 1]),
  correctOptionId: String(shape.corners)
}));

const reasoningQuestions: ShapeDraft[] = [
  {
    prompt: 'לאיזו צורה אין פינות?',
    visual: '🔵',
    correct: 'circle',
    distractors: ['square', 'triangle']
  },
  {
    prompt: 'איזו צורה מתגלגלת בקלות?',
    visual: '⚽',
    correct: 'circle',
    distractors: ['square', 'triangle']
  },
  {
    prompt: 'איזו צורה יכולה להיות גג של בית?',
    visual: '🏠',
    correct: 'triangle',
    distractors: ['circle', 'square']
  },
  {
    prompt: 'איזו צורה ארוכה כמו דלת?',
    visual: '🚪',
    correct: 'rectangle',
    distractors: ['circle', 'triangle']
  },
  {
    prompt: 'לאיזו צורה יש ארבע צלעות שוות?',
    visual: '🟦',
    correct: 'square',
    distractors: ['triangle', 'circle']
  },
  {
    prompt: 'איזו צורה מלאה בקצוות מחודדים?',
    visual: '⭐',
    correct: 'star',
    distractors: ['circle', 'rectangle']
  },
  {
    prompt: 'מה משותף לריבוע ולמלבן?',
    visual: '🟦 ▭',
    correct: 'four-corners',
    distractors: ['round', 'three-sides'],
    customOptions: [
      { id: 'four-corners', label: 'יש להם 4 פינות' },
      { id: 'round', label: 'הם עגולים' },
      { id: 'three-sides', label: 'יש להם 3 צלעות' }
    ]
  },
  {
    prompt: 'איזו צורה דומה ליהלום?',
    visual: '🔷',
    correct: 'diamond',
    distractors: ['circle', 'triangle']
  },
  {
    prompt: 'איזו צורה רחבה כמו אריח?',
    visual: '⬜',
    correct: 'square',
    distractors: ['oval', 'triangle']
  },
  {
    prompt: 'איזו צורה דומה לביצה?',
    visual: '🥚',
    correct: 'oval',
    distractors: ['square', 'star']
  }
].map((item) => ({
  age: [...allAges],
  difficulty: 'hard',
  prompt: item.prompt,
  visual: item.visual,
  audioText: item.prompt,
  options: item.customOptions ?? shapeOptions(item.correct, item.distractors),
  correctOptionId: item.correct
}));

export const shapeQuestions: QuizQuestion[] = [
  ...identifyShapeQuestions,
  ...objectShapeQuestions,
  ...sidesQuestions,
  ...cornersQuestions,
  ...reasoningQuestions
].map(makeQuestion);
