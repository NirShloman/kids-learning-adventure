import { QuizQuestion } from '../../types';

export const numberQuestions: QuizQuestion[] = [
  { id: 'numbers-easy-1', category: 'numbers', age: [3, 4], difficulty: 'easy', prompt: 'כמה תפוחים יש כאן?', visual: '🍎 🍎 🍎', audioText: 'כמה תפוחים יש כאן?', options: [{ id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' }], correctOptionId: '3' },
  { id: 'numbers-easy-2', category: 'numbers', age: [3, 4], difficulty: 'easy', prompt: 'בחרו את המספר 5', visual: '5', audioText: 'בחרו את המספר חמש', options: [{ id: '5', label: '5' }, { id: '2', label: '2' }, { id: '8', label: '8' }], correctOptionId: '5' },
  { id: 'numbers-medium-1', category: 'numbers', age: [4, 5], difficulty: 'medium', prompt: 'כמה גלידות יש כאן?', visual: '🍦 🍦 🍦 🍦', audioText: 'כמה גלידות יש כאן?', options: [{ id: '3', label: '3' }, { id: '4', label: '4' }, { id: '6', label: '6' }], correctOptionId: '4' },
  { id: 'numbers-medium-2', category: 'numbers', age: [4, 5], difficulty: 'medium', prompt: 'מה בא אחרי 6?', audioText: 'מה בא אחרי המספר שש?', options: [{ id: '5', label: '5' }, { id: '7', label: '7' }, { id: '9', label: '9' }], correctOptionId: '7' },
  { id: 'numbers-hard-1', category: 'numbers', age: [5, 6], difficulty: 'hard', prompt: 'כמה זה 2 ועוד 3?', visual: '2 + 3', audioText: 'כמה זה שתיים ועוד שלוש?', options: [{ id: '4', label: '4' }, { id: '5', label: '5' }, { id: '6', label: '6' }], correctOptionId: '5' },
  { id: 'numbers-hard-2', category: 'numbers', age: [5, 6], difficulty: 'hard', prompt: 'איזה מספר קטן מ-8?', audioText: 'איזה מספר קטן משמונה?', options: [{ id: '9', label: '9' }, { id: '7', label: '7' }, { id: '10', label: '10' }], correctOptionId: '7' }
];
