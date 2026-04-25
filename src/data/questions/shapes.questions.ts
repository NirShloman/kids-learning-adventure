import { QuizQuestion } from '../../types';

export const shapeQuestions: QuizQuestion[] = [
  { id: 'shapes-easy-1', category: 'shapes', age: [3, 4], difficulty: 'easy', prompt: 'איזו צורה זו?', visual: '🔵', audioText: 'איזו צורה זו?', options: [{ id: 'circle', label: 'עיגול' }, { id: 'square', label: 'ריבוע' }, { id: 'triangle', label: 'משולש' }], correctOptionId: 'circle' },
  { id: 'shapes-easy-2', category: 'shapes', age: [3, 4], difficulty: 'easy', prompt: 'בחרו משולש', audioText: 'בחרו משולש', options: [{ id: 'square', label: 'ריבוע', emoji: '🟦' }, { id: 'triangle', label: 'משולש', emoji: '🔺' }, { id: 'circle', label: 'עיגול', emoji: '🟢' }], correctOptionId: 'triangle' },
  { id: 'shapes-medium-1', category: 'shapes', age: [4, 5], difficulty: 'medium', prompt: 'כמה צלעות יש לריבוע?', visual: '🟧', audioText: 'כמה צלעות יש לריבוע?', options: [{ id: '3', label: '3' }, { id: '4', label: '4' }, { id: '5', label: '5' }], correctOptionId: '4' },
  { id: 'shapes-medium-2', category: 'shapes', age: [4, 5], difficulty: 'medium', prompt: 'איזו צורה דומה לשמש?', visual: '☀️', audioText: 'איזו צורה דומה לשמש?', options: [{ id: 'circle', label: 'עיגול' }, { id: 'square', label: 'ריבוע' }, { id: 'rectangle', label: 'מלבן' }], correctOptionId: 'circle' },
  { id: 'shapes-hard-1', category: 'shapes', age: [5, 6], difficulty: 'hard', prompt: 'לאיזו צורה יש שלוש צלעות?', audioText: 'לאיזו צורה יש שלוש צלעות?', options: [{ id: 'triangle', label: 'משולש', emoji: '🔺' }, { id: 'rectangle', label: 'מלבן', emoji: '▭' }, { id: 'star', label: 'כוכב', emoji: '⭐' }], correctOptionId: 'triangle' },
  { id: 'shapes-hard-2', category: 'shapes', age: [5, 6], difficulty: 'hard', prompt: 'איזו צורה ארוכה כמו דלת?', visual: '🚪', audioText: 'איזו צורה ארוכה כמו דלת?', options: [{ id: 'rectangle', label: 'מלבן' }, { id: 'circle', label: 'עיגול' }, { id: 'triangle', label: 'משולש' }], correctOptionId: 'rectangle' }
];
