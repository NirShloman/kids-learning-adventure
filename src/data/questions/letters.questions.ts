import { QuizQuestion } from '../../types';

export const letterQuestions: QuizQuestion[] = [
  { id: 'letters-easy-1', category: 'letters', age: [3, 4], difficulty: 'easy', prompt: 'באיזו אות מתחילה המילה אבא?', visual: '👨', audioText: 'באיזו אות מתחילה המילה אבא?', options: [{ id: 'a', label: 'א' }, { id: 'b', label: 'ב' }, { id: 'g', label: 'ג' }], correctOptionId: 'a' },
  { id: 'letters-easy-2', category: 'letters', age: [3, 4], difficulty: 'easy', prompt: 'בחרו את האות מ', subtitle: 'חפשו את האות המתאימה', audioText: 'בחרו את האות מם', options: [{ id: 'm', label: 'מ' }, { id: 'n', label: 'נ' }, { id: 's', label: 'ס' }], correctOptionId: 'm' },
  { id: 'letters-easy-3', category: 'letters', age: [3, 4], difficulty: 'easy', prompt: 'באיזו אות מתחילה המילה דג?', visual: '🐟', audioText: 'באיזו אות מתחילה המילה דג?', options: [{ id: 'd', label: 'ד' }, { id: 'r', label: 'ר' }, { id: 't', label: 'ת' }], correctOptionId: 'd' },
  { id: 'letters-medium-1', category: 'letters', age: [4, 5], difficulty: 'medium', prompt: 'איזו מילה מתחילה באות ש?', audioText: 'איזו מילה מתחילה באות שין?', options: [{ id: 'sun', label: 'שמש', emoji: '☀️' }, { id: 'house', label: 'בית', emoji: '🏠' }, { id: 'dog', label: 'כלב', emoji: '🐶' }], correctOptionId: 'sun' },
  { id: 'letters-medium-2', category: 'letters', age: [4, 5], difficulty: 'medium', prompt: 'איזו אות חסרה במילה _רפרף?', visual: '🦋', audioText: 'איזו אות חסרה במילה פרפר?', options: [{ id: 'p', label: 'פ' }, { id: 'k', label: 'כ' }, { id: 'l', label: 'ל' }], correctOptionId: 'p' },
  { id: 'letters-hard-1', category: 'letters', age: [5, 6], difficulty: 'hard', prompt: 'בחרו את האות הסופית המתאימה למילה ים_', audioText: 'בחרו את האות הסופית המתאימה למילה ים', options: [{ id: 'final-mem', label: 'ם' }, { id: 'mem', label: 'מ' }, { id: 'nun', label: 'ן' }], correctOptionId: 'final-mem' },
  { id: 'letters-hard-2', category: 'letters', age: [5, 6], difficulty: 'hard', prompt: 'איזו מילה מסתיימת באות ת?', audioText: 'איזו מילה מסתיימת באות תו?', options: [{ id: 'door', label: 'דלת', emoji: '🚪' }, { id: 'ball', label: 'כדור', emoji: '⚽' }, { id: 'flower', label: 'פרח', emoji: '🌸' }], correctOptionId: 'door' }
];
